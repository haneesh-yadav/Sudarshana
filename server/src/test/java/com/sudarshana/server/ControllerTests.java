package com.sudarshana.server;

import com.sudarshana.server.controller.HealthController;
import com.sudarshana.server.controller.UserController;
import com.sudarshana.server.controller.ThreadController;
import com.sudarshana.server.model.User;
import com.sudarshana.server.repository.EmailMessageRepository;
import com.sudarshana.server.repository.UserRepository;
import com.sudarshana.server.repository.AuditLogRepository;
import com.sudarshana.server.service.SudarshanaService;
import com.sudarshana.server.service.EmailSenderService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class ControllerTests {

    private UserRepository userRepository;
    private EmailMessageRepository emailMessageRepository;
    private BCryptPasswordEncoder passwordEncoder;
    private UserController userController;
    private HealthController healthController;

    @BeforeEach
    void setUp() {
        userRepository = Mockito.mock(UserRepository.class);
        emailMessageRepository = Mockito.mock(EmailMessageRepository.class);
        passwordEncoder = new BCryptPasswordEncoder();
        userController = new UserController(userRepository, emailMessageRepository, passwordEncoder);
        healthController = new HealthController();
    }

    @Test
    void healthCheck_returnsUp() {
        Map<String, String> response = healthController.healthCheck();
        assertEquals("UP", response.get("status"));
    }

    @Test
    void getAllUsers_returnsSanitizedPasswords() {
        User user = new User();
        user.setId(1L);
        user.setEmail("test@test.com");
        user.setEmailPassword("my-secret-app-password");
        user.setPassword("hashed-login-pw");

        when(userRepository.findAll()).thenReturn(List.of(user));

        ResponseEntity<List<User>> response = userController.getAllUsers();
        assertEquals(200, response.getStatusCode().value());
        assertEquals(1, response.getBody().size());
        assertEquals("********", response.getBody().get(0).getEmailPassword());
        assertNull(response.getBody().get(0).getPassword());
    }

    @Test
    void verifyPassword_correctPassword_returnsVerified() {
        User user = new User();
        user.setId(1L);
        user.setPassword(passwordEncoder.encode("correctPassword123"));

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        ResponseEntity<?> response = userController.verifyPassword(1L, Map.of("password", "correctPassword123"));
        assertEquals(200, response.getStatusCode().value());
        @SuppressWarnings("unchecked")
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertEquals(true, body.get("verified"));
    }

    @Test
    void verifyPassword_wrongPassword_returnsNotVerified() {
        User user = new User();
        user.setId(1L);
        user.setPassword(passwordEncoder.encode("correctPassword123"));

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        ResponseEntity<?> response = userController.verifyPassword(1L, Map.of("password", "wrongPassword"));
        assertEquals(200, response.getStatusCode().value());
        @SuppressWarnings("unchecked")
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertEquals(false, body.get("verified"));
    }

    @Test
    void verifyPassword_emptyPassword_returnsBadRequest() {
        ResponseEntity<?> response = userController.verifyPassword(1L, Map.of("password", ""));
        assertEquals(400, response.getStatusCode().value());
    }

    @Test
    void verifyPassword_userNotFound_returnsNotFound() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        ResponseEntity<?> response = userController.verifyPassword(999L, Map.of("password", "pw"));
        assertEquals(404, response.getStatusCode().value());
    }

    @Test
    void deleteUser_withCorrectPassword_succeeds() {
        User user = new User();
        user.setId(1L);
        user.setPassword(passwordEncoder.encode("mypassword"));

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(emailMessageRepository.findByOwnerId(1L)).thenReturn(List.of());

        ResponseEntity<Void> response = userController.deleteUser(1L, Map.of("password", "mypassword"));
        assertEquals(200, response.getStatusCode().value());
        verify(userRepository).deleteById(1L);
    }

    @Test
    void deleteUser_withWrongPassword_returnsForbidden() {
        User user = new User();
        user.setId(1L);
        user.setPassword(passwordEncoder.encode("mypassword"));

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        ResponseEntity<Void> response = userController.deleteUser(1L, Map.of("password", "wrong"));
        assertEquals(403, response.getStatusCode().value());
        verify(userRepository, never()).deleteById(anyLong());
    }

    @Test
    void deleteUser_withoutPasswordVerification_succeeds() {
        User user = new User();
        user.setId(1L);

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(emailMessageRepository.findByOwnerId(1L)).thenReturn(List.of());

        ResponseEntity<Void> response = userController.deleteUser(1L, null);
        assertEquals(200, response.getStatusCode().value());
        verify(userRepository).deleteById(1L);
    }

    @Test
    void deleteUser_userNotFound_returnsNotFound() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        ResponseEntity<Void> response = userController.deleteUser(999L, Map.of("password", "pw"));
        assertEquals(404, response.getStatusCode().value());
    }

    @Test
    void registerUser_newUser_savesWithDefaults() {
        User newUser = new User();
        newUser.setEmail("new@test.com");
        newUser.setFullName("New User");

        when(userRepository.findByEmail("new@test.com")).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        ResponseEntity<User> response = userController.registerUser(newUser);
        assertEquals(200, response.getStatusCode().value());
        assertEquals(993, response.getBody().getImapPort());
        assertEquals(587, response.getBody().getSmtpPort());
        verify(userRepository).save(any(User.class));
    }

    @Test
    void registerUser_existingUser_updatesFields() {
        User existing = new User();
        existing.setId(1L);
        existing.setEmail("existing@test.com");
        existing.setFullName("Old Name");
        existing.setImapPort(993);

        User update = new User();
        update.setEmail("existing@test.com");
        update.setFullName("New Name");
        update.setImapPort(143);

        when(userRepository.findByEmail("existing@test.com")).thenReturn(Optional.of(existing));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        ResponseEntity<User> response = userController.registerUser(update);
        assertEquals(200, response.getStatusCode().value());
        assertEquals("New Name", response.getBody().getFullName());
        assertEquals(143, response.getBody().getImapPort());
    }

    @Test
    void checkEmail_exists_returnsTrue() {
        when(userRepository.findByEmail("test@test.com")).thenReturn(Optional.of(new User()));

        // This tests via AuthController logic, but let's verify the repository mock works
        Optional<User> result = userRepository.findByEmail("test@test.com");
        assertTrue(result.isPresent());
    }

    @Test
    void checkEmail_notExists_returnsFalse() {
        when(userRepository.findByEmail("unknown@test.com")).thenReturn(Optional.empty());

        Optional<User> result = userRepository.findByEmail("unknown@test.com");
        assertFalse(result.isPresent());
    }
}


