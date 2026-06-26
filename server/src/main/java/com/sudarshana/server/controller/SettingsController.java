package com.sudarshana.server.controller;

import com.sudarshana.server.model.SettingsConfig;
import com.sudarshana.server.model.User;
import com.sudarshana.server.repository.SettingsConfigRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/settings")
public class SettingsController {

    private final SettingsConfigRepository settingsConfigRepository;

    @Autowired
    public SettingsController(SettingsConfigRepository settingsConfigRepository) {
        this.settingsConfigRepository = settingsConfigRepository;
    }

    private User getAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof User) {
            return (User) authentication.getPrincipal();
        }
        return null;
    }

    @GetMapping
    public ResponseEntity<?> getSettings() {
        User user = getAuthenticatedUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "User not authenticated"));
        }

        SettingsConfig config = settingsConfigRepository.findById(user.getId())
                .orElseGet(() -> {
                    // Initialize default settings for this specific user
                    List<String> exceptions = new ArrayList<>();
                    Map<String, String> integrations = new HashMap<>();
                    integrations.put("Microsoft 365", "Not connected");
                    integrations.put("Google Workspace", "Not connected");
                    integrations.put("Slack", "Not connected");
                    integrations.put("Splunk", "Not connected");
                    integrations.put("Okta", "Not connected");

                    String fullName = user.getFullName();
                    String displayName = fullName != null && !fullName.isEmpty() ? fullName : user.getEmail();

                    SettingsConfig defaultConfig = new SettingsConfig(
                            user.getId(),
                            displayName,
                            user.getEmail(),
                            "UTC",
                            "quarantine",
                            exceptions,
                            75,
                            65,
                            integrations
                    );
                    return settingsConfigRepository.save(defaultConfig);
                });

        return ResponseEntity.ok(config);
    }

    @PostMapping
    public ResponseEntity<?> updateSettings(@RequestBody SettingsConfig newConfig) {
        User user = getAuthenticatedUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "User not authenticated"));
        }

        if (newConfig == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Settings config cannot be null"));
        }

        newConfig.setUserId(user.getId());
        newConfig.setEmail(user.getEmail()); // Ensure they cannot spoof their email
        SettingsConfig saved = settingsConfigRepository.save(newConfig);
        return ResponseEntity.ok(saved);
    }

    /**
     * Tests an IMAP connection with the provided credentials.
     * Returns a success or error message â€” does not persist credentials.
     */
    @PostMapping("/test-imap")
    public ResponseEntity<Map<String, String>> testImapConnection(@RequestBody Map<String, Object> payload) {
        String host     = (String) payload.getOrDefault("host", "");
        String username = (String) payload.getOrDefault("username", "");
        String password = (String) payload.getOrDefault("password", "");
        int port = 993;
        if (payload.get("port") instanceof Number) {
            port = ((Number) payload.get("port")).intValue();
        }

        if (host.isEmpty() || username.isEmpty() || password.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                "status", "ERROR",
                "message", "Host, username, and password are required."
            ));
        }

        java.util.Properties props = new java.util.Properties();
        props.put("mail.store.protocol", "imaps");
        props.put("mail.imaps.host", host);
        props.put("mail.imaps.port", String.valueOf(port));
        props.put("mail.imaps.timeout", "6000");
        props.put("mail.imaps.connectiontimeout", "6000");
        props.put("mail.imaps.ssl.enable", "true");
        props.put("mail.imaps.ssl.trust", "*");

        try {
            jakarta.mail.Session session = jakarta.mail.Session.getInstance(props);
            jakarta.mail.Store store = session.getStore("imaps");
            store.connect(host, port, username, password);
            jakarta.mail.Folder inbox = store.getFolder("INBOX");
            inbox.open(jakarta.mail.Folder.READ_ONLY);
            int msgCount = inbox.getMessageCount();
            inbox.close(false);
            store.close();
            return ResponseEntity.ok(Map.of(
                "status", "SUCCESS",
                "message", "Connected successfully. INBOX contains " + msgCount + " message(s)."
            ));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of(
                "status", "ERROR",
                "message", "Connection failed: " + e.getMessage()
            ));
        }
    }
}

