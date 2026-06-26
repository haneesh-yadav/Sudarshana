package com.sudarshana.server.controller;

import com.sudarshana.server.model.User;
import com.sudarshana.server.model.EmailMessage;
import com.sudarshana.server.repository.UserRepository;
import com.sudarshana.server.repository.EmailMessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;
    private final EmailMessageRepository emailMessageRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    @Autowired
    public UserController(UserRepository userRepository, EmailMessageRepository emailMessageRepository, BCryptPasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.emailMessageRepository = emailMessageRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Lists all registered user workspaces, sanitizing the password field for UI consumption.
     */
    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = userRepository.findAll().stream()
                .map(u -> {
                    User sanitized = new User();
                    sanitized.setId(u.getId());
                    sanitized.setEmail(u.getEmail());
                    sanitized.setFullName(u.getFullName());
                    sanitized.setImapHost(u.getImapHost());
                    sanitized.setImapPort(u.getImapPort());
                    sanitized.setSmtpHost(u.getSmtpHost());
                    sanitized.setSmtpPort(u.getSmtpPort());
                    sanitized.setEmailUser(u.getEmailUser());
                    // Blank password for security
                    sanitized.setEmailPassword(u.getEmailPassword() != null && !u.getEmailPassword().isEmpty() ? "********" : "");
                    return sanitized;
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    /**
     * Creates a new user profile or updates details for an existing user.
     */
    @PostMapping
    public ResponseEntity<User> registerUser(@RequestBody User user) {
        if (user.getEmail() == null || user.getEmail().trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        Optional<User> existing = userRepository.findByEmail(user.getEmail().trim().toLowerCase());
        User saved;
        if (existing.isPresent()) {
            User current = existing.get();
            current.setFullName(user.getFullName());
            current.setImapHost(user.getImapHost());
            current.setImapPort(user.getImapPort());
            current.setSmtpHost(user.getSmtpHost());
            current.setSmtpPort(user.getSmtpPort());
            current.setEmailUser(user.getEmailUser());
            // Only update password if a new one is provided and is not the placeholder mask
            if (user.getEmailPassword() != null && !user.getEmailPassword().isEmpty() && !user.getEmailPassword().equals("********")) {
                current.setEmailPassword(user.getEmailPassword());
            }
            saved = userRepository.save(current);
        } else {
            user.setEmail(user.getEmail().trim().toLowerCase());
            // Default port settings if not defined
            if (user.getImapPort() == 0) user.setImapPort(993);
            if (user.getSmtpPort() == 0) user.setSmtpPort(587);
            saved = userRepository.save(user);
        }

        // Sanitize return value
        saved.setEmailPassword(saved.getEmailPassword() != null && !saved.getEmailPassword().isEmpty() ? "********" : "");
        return ResponseEntity.ok(saved);
    }

    /**
     * Verifies a user's login password without exposing it.
     */
    @PostMapping("/{id}/verify-password")
    public ResponseEntity<?> verifyPassword(@PathVariable Long id, @RequestBody java.util.Map<String, String> request) {
        String password = request.get("password");
        if (password == null || password.isEmpty()) {
            return ResponseEntity.badRequest().body(java.util.Map.of("status", "ERROR", "message", "Password is required"));
        }

        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User user = userOpt.get();
        if (user.getPassword() != null && passwordEncoder.matches(password, user.getPassword())) {
            return ResponseEntity.ok(java.util.Map.of("status", "SUCCESS", "verified", true));
        }

        return ResponseEntity.ok(java.util.Map.of("status", "SUCCESS", "verified", false));
    }

    /**
     * Deletes a user profile after password verification and cascades deletion to all associated email sync data.
     */
    @DeleteMapping("/{id}")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<Void> deleteUser(@PathVariable Long id, @RequestBody(required = false) java.util.Map<String, String> request) {
        Optional<User> user = userRepository.findById(id);
        if (user.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        // If a password is provided, verify it before deleting
        if (request != null && request.containsKey("password")) {
            String password = request.get("password");
            User u = user.get();
            if (u.getPassword() == null || !passwordEncoder.matches(password, u.getPassword())) {
                return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN).build();
            }
        }

        List<EmailMessage> messages = emailMessageRepository.findByOwnerId(id);
        emailMessageRepository.deleteAll(messages);
        userRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}

