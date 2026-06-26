package com.sudarshana.server.service;

import com.sudarshana.server.model.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.stereotype.Service;

import java.util.Properties;

@Service
public class EmailSenderService {

    private static final Logger logger = LoggerFactory.getLogger(EmailSenderService.class);

    private final GoogleOauthService googleOauthService;

    @Autowired
    public EmailSenderService(GoogleOauthService googleOauthService) {
        this.googleOauthService = googleOauthService;
    }

    public void sendEmail(User user, String to, String subject, String body) {
        if (user.getSmtpHost() == null || user.getSmtpHost().isEmpty()) {
            throw new IllegalArgumentException("SMTP Host is not configured for user: " + user.getEmail());
        }

        logger.info("Configuring dynamic mail sender for user {} using SMTP host {}", user.getEmail(), user.getSmtpHost());

        boolean useOauth = user.getOauth2RefreshToken() != null && !user.getOauth2RefreshToken().isEmpty();
        String authSecret;

        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
        mailSender.setHost(user.getSmtpHost());
        mailSender.setPort(user.getSmtpPort());
        mailSender.setUsername(user.getEmailUser());

        Properties props = mailSender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.smtp.connectiontimeout", "5000");
        props.put("mail.smtp.timeout", "5000");

        if (useOauth) {
            authSecret = googleOauthService.getAccessToken(user.getOauth2RefreshToken());
            props.put("mail.smtp.auth.mechanisms", "XOAUTH2");
        } else {
            authSecret = user.getEmailPassword();
        }

        mailSender.setPassword(authSecret);

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(user.getEmail());
        message.setTo(to);
        message.setSubject(subject);
        message.setText(body);

        try {
            mailSender.send(message);
            logger.info("Email successfully sent to {} from {}", to, user.getEmail());
        } catch (Exception e) {
            logger.error("Failed to send email to {} using SMTP for user {}: {}", to, user.getEmail(), e.getMessage(), e);
            throw new RuntimeException("SMTP email send failed: " + e.getMessage(), e);
        }
    }
}

