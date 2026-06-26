package com.sudarshana.server.service;

import com.sudarshana.server.model.EmailMessage;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

@Service
public class CryptographyService {

    /**
     * Calculates the current hash of an EmailMessage based on its contents
     * and the previous message's hash (implementing H_current = SHA-256(M_current || H_previous)).
     */
    public String calculateCurrentHash(EmailMessage message) {
        if (message == null) {
            return null;
        }

        // Serialize message metadata and content: M_current = sender | recipient | subject | body
        String mCurrent = String.format("%s|%s|%s|%s",
                message.getSender() != null ? message.getSender() : "",
                message.getRecipient() != null ? message.getRecipient() : "",
                message.getSubject() != null ? message.getSubject() : "",
                message.getBody() != null ? message.getBody() : "");

        String hPrevious = message.getPreviousHash() != null ? message.getPreviousHash() : "";

        // Combine message content and previous hash
        String input = mCurrent + "||" + hPrevious;

        return sha256(input);
    }

    /**
     * Verifies if the currentHash value in the EmailMessage matches the computed hash.
     */
    public boolean verifyMessageHash(EmailMessage message) {
        if (message == null || message.getCurrentHash() == null) {
            return false;
        }
        String computedHash = calculateCurrentHash(message);
        return message.getCurrentHash().equalsIgnoreCase(computedHash);
    }

    private String sha256(String base) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(base.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException ex) {
            throw new RuntimeException("SHA-256 algorithm not found", ex);
        }
    }
}

