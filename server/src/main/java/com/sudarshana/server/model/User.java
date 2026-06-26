package com.sudarshana.server.model;

import jakarta.persistence.*;
import com.sudarshana.server.config.EncryptedStringConverter;

@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    private String fullName;

    private String imapHost;
    private int imapPort = 993;
    private String smtpHost;
    private int smtpPort = 587;

    private String emailUser;
    @Convert(converter = EncryptedStringConverter.class)
    private String emailPassword; // Google App Password or standard credentials
    @Convert(converter = EncryptedStringConverter.class)
    private String oauth2RefreshToken;
    private String password; // Local password for logging into the tool

    public User() {}

    public User(String email, String fullName, String imapHost, int imapPort, String smtpHost, int smtpPort, String emailUser, String emailPassword, String oauth2RefreshToken, String password) {
        this.email = email;
        this.fullName = fullName;
        this.imapHost = imapHost;
        this.imapPort = imapPort;
        this.smtpHost = smtpHost;
        this.smtpPort = smtpPort;
        this.emailUser = emailUser;
        this.emailPassword = emailPassword;
        this.oauth2RefreshToken = oauth2RefreshToken;
        this.password = password;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getImapHost() { return imapHost; }
    public void setImapHost(String imapHost) { this.imapHost = imapHost; }

    public int getImapPort() { return imapPort; }
    public void setImapPort(int imapPort) { this.imapPort = imapPort; }

    public String getSmtpHost() { return smtpHost; }
    public void setSmtpHost(String smtpHost) { this.smtpHost = smtpHost; }

    public int getSmtpPort() { return smtpPort; }
    public void setSmtpPort(int smtpPort) { this.smtpPort = smtpPort; }

    public String getEmailUser() { return emailUser; }
    public void setEmailUser(String emailUser) { this.emailUser = emailUser; }

    public String getEmailPassword() { return emailPassword; }
    public void setEmailPassword(String emailPassword) { this.emailPassword = emailPassword; }

    public String getOauth2RefreshToken() { return oauth2RefreshToken; }
    public void setOauth2RefreshToken(String oauth2RefreshToken) { this.oauth2RefreshToken = oauth2RefreshToken; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private String email;
        private String fullName;
        private String imapHost;
        private int imapPort = 993;
        private String smtpHost;
        private int smtpPort = 587;
        private String emailUser;
        @Convert(converter = EncryptedStringConverter.class)
    private String emailPassword;
        @Convert(converter = EncryptedStringConverter.class)
    private String oauth2RefreshToken;
        private String password;

        public Builder email(String email) { this.email = email; return this; }
        public Builder fullName(String fullName) { this.fullName = fullName; return this; }
        public Builder imapHost(String imapHost) { this.imapHost = imapHost; return this; }
        public Builder imapPort(int imapPort) { this.imapPort = imapPort; return this; }
        public Builder smtpHost(String smtpHost) { this.smtpHost = smtpHost; return this; }
        public Builder smtpPort(int smtpPort) { this.smtpPort = smtpPort; return this; }
        public Builder emailUser(String emailUser) { this.emailUser = emailUser; return this; }
        public Builder emailPassword(String emailPassword) { this.emailPassword = emailPassword; return this; }
        public Builder oauth2RefreshToken(String oauth2RefreshToken) { this.oauth2RefreshToken = oauth2RefreshToken; return this; }
        public Builder password(String password) { this.password = password; return this; }

        public User build() {
            return new User(email, fullName, imapHost, imapPort, smtpHost, smtpPort, emailUser, emailPassword, oauth2RefreshToken, password);
        }
    }
}

