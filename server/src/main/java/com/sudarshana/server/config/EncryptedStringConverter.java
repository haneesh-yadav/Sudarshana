package com.sudarshana.server.config;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;

@Converter
public class EncryptedStringConverter implements AttributeConverter<String, String> {

    private static final Logger logger = LoggerFactory.getLogger(EncryptedStringConverter.class);
    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int GCM_IV_LENGTH = 12;
    private static final int GCM_TAG_LENGTH = 128;

    private final SecretKeySpec secretKey;

    public EncryptedStringConverter() {
        SecretKeySpec key = null;
        String keyHex = System.getenv("SUDARSHANA_ENCRYPTION_KEY");
        if (keyHex != null && !keyHex.trim().isEmpty()) {
            try {
                byte[] keyBytes = HexFormat.of().parseHex(keyHex.trim());
                if (keyBytes.length == 32) {
                    key = new SecretKeySpec(keyBytes, "AES");
                } else {
                    logger.warn("SUDARSHANA_ENCRYPTION_KEY must be 64 hex characters (32 bytes). " +
                            "Sensitive fields will NOT be encrypted.");
                }
            } catch (Exception e) {
                logger.warn("SUDARSHANA_ENCRYPTION_KEY is not a valid hex string. " +
                        "Sensitive fields will NOT be encrypted.");
            }
        } else {
            logger.warn("SUDARSHANA_ENCRYPTION_KEY not set. Sensitive fields will NOT be encrypted. " +
                    "Generate one with: openssl rand -hex 32");
        }
        this.secretKey = key;
    }

    @Override
    public String convertToDatabaseColumn(String attribute) {
        if (attribute == null || attribute.isEmpty()) {
            return attribute;
        }
        if (secretKey == null) {
            return attribute;
        }
        try {
            byte[] iv = new byte[GCM_IV_LENGTH];
            new SecureRandom().nextBytes(iv);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, new GCMParameterSpec(GCM_TAG_LENGTH, iv));
            byte[] encrypted = cipher.doFinal(attribute.getBytes(StandardCharsets.UTF_8));

            ByteBuffer buffer = ByteBuffer.allocate(iv.length + encrypted.length);
            buffer.put(iv);
            buffer.put(encrypted);

            return Base64.getEncoder().encodeToString(buffer.array());
        } catch (Exception e) {
            logger.error("Failed to encrypt field: {}", e.getMessage());
            throw new RuntimeException("Encryption failed", e);
        }
    }

    @Override
    public String convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isEmpty()) {
            return dbData;
        }
        if (secretKey == null) {
            return dbData;
        }
        try {
            byte[] decoded = Base64.getDecoder().decode(dbData);

            ByteBuffer buffer = ByteBuffer.wrap(decoded);
            byte[] iv = new byte[GCM_IV_LENGTH];
            buffer.get(iv);
            byte[] encrypted = new byte[buffer.remaining()];
            buffer.get(encrypted);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, new GCMParameterSpec(GCM_TAG_LENGTH, iv));
            byte[] decrypted = cipher.doFinal(encrypted);

            return new String(decrypted, StandardCharsets.UTF_8);
        } catch (Exception e) {
            logger.error("Failed to decrypt field (may be legacy plaintext): {}", e.getMessage());
            return dbData;
        }
    }
}