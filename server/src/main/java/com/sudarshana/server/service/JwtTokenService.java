package com.sudarshana.server.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

@Service
public class JwtTokenService {

    private static final Logger logger = LoggerFactory.getLogger(JwtTokenService.class);
    private static final String HMAC_ALGORITHM = "HmacSHA256";

    // 24 hours token expiration duration by default
    private final long expirationMs = 86400000L;

    private final String jwtSecret;

    public JwtTokenService(@Value("${sudarshana.security.jwt.secret:}") String jwtSecret) {
        if (jwtSecret == null || jwtSecret.trim().isEmpty()) {
            throw new IllegalStateException("sudarshana.security.jwt.secret must be set. Generate one with: openssl rand -hex 32");
        }
        this.jwtSecret = jwtSecret;
    }

    /**
     * Generates a signed token for the given user email.
     */
    public String generateToken(String email) {
        try {
            long expiry = System.currentTimeMillis() + expirationMs;
            String payload = Base64.getUrlEncoder().withoutPadding().encodeToString(email.getBytes(StandardCharsets.UTF_8))
                    + "."
                    + Base64.getUrlEncoder().withoutPadding().encodeToString(String.valueOf(expiry).getBytes(StandardCharsets.UTF_8));

            String signature = calculateHmac(payload);
            return payload + "." + signature;
        } catch (Exception e) {
            logger.error("Failed to generate token for email {}: {}", email, e.getMessage());
            throw new RuntimeException("Token generation failed", e);
        }
    }

    /**
     * Validates a token and extracts the subject email. Returns null if invalid or expired.
     */
    public String validateTokenAndGetEmail(String token) {
        if (token == null || token.trim().isEmpty()) {
            return null;
        }

        String[] parts = token.split("\\.");
        if (parts.length != 3) {
            logger.warn("Invalid token structure");
            return null;
        }

        try {
            String payload = parts[0] + "." + parts[1];
            String expectedSignature = calculateHmac(payload);
            String actualSignature = parts[2];

            if (!expectedSignature.equals(actualSignature)) {
                logger.warn("Token signature verification failed");
                return null;
            }

            // Verify Expiry
            byte[] expiryBytes = Base64.getUrlDecoder().decode(parts[1]);
            long expiry = Long.parseLong(new String(expiryBytes, StandardCharsets.UTF_8));
            if (System.currentTimeMillis() > expiry) {
                logger.warn("Token has expired");
                return null;
            }

            // Extract Email
            byte[] emailBytes = Base64.getUrlDecoder().decode(parts[0]);
            return new String(emailBytes, StandardCharsets.UTF_8);

        } catch (Exception e) {
            logger.error("Token parsing or validation failed: {}", e.getMessage());
            return null;
        }
    }

    private String calculateHmac(String data) throws Exception {
        Mac sha256Hmac = Mac.getInstance(HMAC_ALGORITHM);
        SecretKeySpec secretKey = new SecretKeySpec(jwtSecret.getBytes(StandardCharsets.UTF_8), HMAC_ALGORITHM);
        sha256Hmac.init(secretKey);
        byte[] hmacBytes = sha256Hmac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        return Base64.getUrlEncoder().withoutPadding().encodeToString(hmacBytes);
    }
}


