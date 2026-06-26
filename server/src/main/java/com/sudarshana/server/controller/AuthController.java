package com.sudarshana.server.controller;

import com.sudarshana.server.model.User;
import com.sudarshana.server.repository.UserRepository;
import com.sudarshana.server.service.JwtTokenService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    @Value("${google.oauth2.client-id}")
    private String clientId;

    @Value("${google.oauth2.client-secret}")
    private String clientSecret;

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final JwtTokenService jwtTokenService;
    private final RestTemplate restTemplate = new RestTemplate();

    @Autowired
    public AuthController(UserRepository userRepository, BCryptPasswordEncoder passwordEncoder, JwtTokenService jwtTokenService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenService = jwtTokenService;
    }

    /**
     * Exposes public authentication configs (like Client ID) to the frontend.
     */
    @GetMapping("/config")
    public ResponseEntity<?> getAuthConfig() {
        return ResponseEntity.ok(Map.of("clientId", clientId != null ? clientId : ""));
    }

    private User getAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof User) {
            return (User) authentication.getPrincipal();
        }
        return null;
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        User user = getAuthenticatedUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("status", "ERROR", "message", "Authentication is required"));
        }

        return ResponseEntity.ok(Map.of(
                "status", "SUCCESS",
                "userId", user.getId(),
                "email", user.getEmail(),
                "fullName", user.getFullName() != null ? user.getFullName() : ""
        ));
    }

    /**
     * Ex-changes Google Auth Code for Refresh & Access Tokens, initializes user profile.
     */
    @PostMapping("/google")
    public ResponseEntity<?> handleGoogleAuth(@RequestBody Map<String, String> request) {
        String code = request.get("code");
        String redirectUri = request.get("redirectUri");

        if (code == null || redirectUri == null) {
            return ResponseEntity.badRequest().body(Map.of("status", "ERROR", "message", "Code and redirectUri are required"));
        }

        try {
            // 1. Exchange auth code for tokens
            String tokenUrl = "https://oauth2.googleapis.com/token";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("code", code);
            body.add("client_id", clientId);
            body.add("client_secret", clientSecret);
            body.add("redirect_uri", redirectUri);
            body.add("grant_type", "authorization_code");

            HttpEntity<MultiValueMap<String, String>> entity = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(tokenUrl, entity, Map.class);

            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("status", "ERROR", "message", "Failed to exchange auth code"));
            }

            Map<?, ?> tokenResponse = response.getBody();
            String accessToken = (String) tokenResponse.get("access_token");
            String refreshToken = (String) tokenResponse.get("refresh_token");

            // 2. Retrieve Google User Profile Info
            String userInfoUrl = "https://www.googleapis.com/oauth2/v3/userinfo";
            HttpHeaders userInfoHeaders = new HttpHeaders();
            userInfoHeaders.setBearerAuth(accessToken);
            HttpEntity<Void> userInfoEntity = new HttpEntity<>(userInfoHeaders);
            ResponseEntity<Map> userInfoResponse = restTemplate.exchange(userInfoUrl, HttpMethod.GET, userInfoEntity, Map.class);

            if (!userInfoResponse.getStatusCode().is2xxSuccessful() || userInfoResponse.getBody() == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("status", "ERROR", "message", "Failed to fetch user info"));
            }

            Map<?, ?> profile = userInfoResponse.getBody();
            Object emailObj = profile.get("email");
            if (!(emailObj instanceof String) || ((String) emailObj).trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("status", "ERROR", "message", "Google account did not return an email address"));
            }

            Object verifiedObj = profile.get("email_verified");
            if (Boolean.FALSE.equals(verifiedObj)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("status", "ERROR", "message", "Google email is not verified"));
            }

            String email = ((String) emailObj).trim().toLowerCase();
            String name = profile.get("name") instanceof String ? ((String) profile.get("name")).trim() : "";
            if (name.isEmpty()) {
                name = email;
            }

            // 3. Find or Create User
            Optional<User> existingUserOpt = userRepository.findByEmail(email);
            User user;
            boolean isNewUser = false;

            if (existingUserOpt.isPresent()) {
                user = existingUserOpt.get();
                user.setFullName(name);
                // Update refresh token if Google returned a new one (only happens on first consent or explicit consent prompt)
                if (refreshToken != null && !refreshToken.isEmpty()) {
                    user.setOauth2RefreshToken(refreshToken);
                }
                userRepository.save(user);
            } else {
                isNewUser = true;
                user = User.builder()
                        .email(email)
                        .fullName(name)
                        .imapHost("imap.gmail.com")
                        .imapPort(993)
                        .smtpHost("smtp.gmail.com")
                        .smtpPort(587)
                        .emailUser(email)
                        .oauth2RefreshToken(refreshToken)
                        .build();
                userRepository.save(user);
            }

            logger.info("Google OAuth2 login successful for user: {}, isNewUser={}", email, isNewUser);

            String token = jwtTokenService.generateToken(user.getEmail());
            return ResponseEntity.ok(Map.of(
                    "status", "SUCCESS",
                    "token", token,
                    "userId", user.getId(),
                    "email", user.getEmail(),
                    "fullName", user.getFullName() != null ? user.getFullName() : "",
                    "isNewUser", isNewUser
            ));

        } catch (Exception e) {
            logger.error("Error during Google OAuth2 token exchange: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("status", "ERROR", "message", "OAuth2 auth failed: " + e.getMessage()));
        }
    }

    /**
     * Set a local login password for the user workspace.
     */
    @PostMapping("/set-password")
    public ResponseEntity<?> setPassword(@RequestBody Map<String, Object> request) {
        String password = (String) request.get("password");

        User authenticatedUser = getAuthenticatedUser();
        if (authenticatedUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("status", "ERROR", "message", "Authentication is required"));
        }

        if (password == null || password.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("status", "ERROR", "message", "Password is required"));
        }

        if (password.length() < 8) {
            return ResponseEntity.badRequest().body(Map.of("status", "ERROR", "message", "Password must be at least 8 characters"));
        }

        Optional<User> userOpt = userRepository.findById(authenticatedUser.getId());
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("status", "ERROR", "message", "User not found"));
        }

        User user = userOpt.get();
        user.setPassword(passwordEncoder.encode(password));
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("status", "SUCCESS", "message", "Password updated successfully"));
    }

    /**
     * Checks if a user email exists in the database.
     */
    @PostMapping("/check-email")
    public ResponseEntity<?> checkEmail(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("status", "ERROR", "message", "Email is required"));
        }
        Optional<User> userOpt = userRepository.findByEmail(email.trim().toLowerCase());
        return ResponseEntity.ok(Map.of("exists", userOpt.isPresent()));
    }

    /**
     * Standard traditional login endpoint.
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String password = request.get("password");

        if (email == null || password == null) {
            return ResponseEntity.badRequest().body(Map.of("status", "ERROR", "message", "Email and password are required"));
        }

        Optional<User> userOpt = userRepository.findByEmail(email.trim().toLowerCase());
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (user.getPassword() != null && passwordEncoder.matches(password, user.getPassword())) {
                String token = jwtTokenService.generateToken(user.getEmail());
                return ResponseEntity.ok(Map.of(
                        "status", "SUCCESS",
                        "token", token,
                        "userId", user.getId(),
                        "email", user.getEmail(),
                        "fullName", user.getFullName() != null ? user.getFullName() : ""
                ));
            }
        }

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("status", "ERROR", "message", "Invalid email or password"));

    }

    /**
     * Changes the user's password after verifying the current password.
     */
    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> request) {
        String currentPassword = request.get("currentPassword");
        String newPassword = request.get("newPassword");

        User authenticatedUser = getAuthenticatedUser();
        if (authenticatedUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("status", "ERROR", "message", "Authentication is required"));
        }

        if (currentPassword == null || currentPassword.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("status", "ERROR", "message", "Current password is required"));
        }

        if (newPassword == null || newPassword.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("status", "ERROR", "message", "New password is required"));
        }

        if (newPassword.length() < 8) {
            return ResponseEntity.badRequest().body(Map.of("status", "ERROR", "message", "Password must be at least 8 characters"));
        }

        Optional<User> userOpt = userRepository.findById(authenticatedUser.getId());
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("status", "ERROR", "message", "User not found"));
        }

        User user = userOpt.get();
        if (user.getPassword() == null || !passwordEncoder.matches(currentPassword, user.getPassword())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("status", "ERROR", "message", "Current password is incorrect"));
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("status", "SUCCESS", "message", "Password changed successfully"));
    }
}