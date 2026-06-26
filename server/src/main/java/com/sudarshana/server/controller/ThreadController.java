package com.sudarshana.server.controller;

import com.sudarshana.server.model.EmailMessage;
import com.sudarshana.server.model.MessageSecurityResult;
import com.sudarshana.server.model.ThreadSecurityReport;
import com.sudarshana.server.model.User;
import com.sudarshana.server.repository.UserRepository;
import com.sudarshana.server.service.EmailSenderService;
import com.sudarshana.server.service.SudarshanaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/threads")
public class ThreadController {

    private final SudarshanaService SudarshanaService;
    private final UserRepository userRepository;
    private final EmailSenderService emailSenderService;
    private final com.sudarshana.server.repository.AuditLogRepository auditLogRepository;

    @Autowired
    public ThreadController(SudarshanaService SudarshanaService,
                            UserRepository userRepository,
                            EmailSenderService emailSenderService,
                            com.sudarshana.server.repository.AuditLogRepository auditLogRepository) {
        this.SudarshanaService = SudarshanaService;
        this.userRepository = userRepository;
        this.emailSenderService = emailSenderService;
        this.auditLogRepository = auditLogRepository;
    }

    /**
     * Returns a summary/list of all active thread reports.
     */
    @GetMapping
    public ResponseEntity<List<ThreadSecurityReport>> getAllReports(
            @RequestParam(value = "userId", required = false) Long userId) {
        List<ThreadSecurityReport> reports = SudarshanaService.getAllReports(userId);
        return ResponseEntity.ok(reports);
    }

    /**
     * Appends a message to a thread and returns its immediate security result.
     * Also routes the message via SMTP if SMTP credentials are configured for the user.
     */
    @PostMapping("/{threadId}/messages")
    public ResponseEntity<MessageSecurityResult> addMessage(
            @PathVariable String threadId,
            @RequestBody EmailMessage message,
            @RequestParam(value = "userId", required = false) Long userId) {
        
        User owner = null;
        if (userId != null) {
            owner = userRepository.findById(userId).orElse(null);
        }
        if (owner == null) {
            // fallback to demo user
            owner = userRepository.findByEmail("demo@sudarshana.com").orElse(null);
        }

        if (owner != null) {
            message.setOwner(owner);
            message.setOutgoing(true);

            // Dynamically inject user's email as the sender address if not specifically configured
            if (message.getSender() == null || message.getSender().equalsIgnoreCase("ops@internal.sudarshana.io")) {
                message.setSender(owner.getEmail());
            }

            // Route via SMTP if configured (using OAuth2 refresh token or legacy email password)
            boolean hasSmtpSecret = (owner.getEmailPassword() != null && !owner.getEmailPassword().isEmpty()) ||
                                    (owner.getOauth2RefreshToken() != null && !owner.getOauth2RefreshToken().isEmpty());
            if (owner.getSmtpHost() != null && !owner.getSmtpHost().isEmpty() && hasSmtpSecret) {
                try {
                    String cleanRecipient = cleanEmailAddress(message.getRecipient());
                    emailSenderService.sendEmail(owner, cleanRecipient, message.getSubject(), message.getBody());
                } catch (Exception e) {
                    throw new RuntimeException("Failed to send SMTP email: " + e.getMessage(), e);
                }
            }
        }

        MessageSecurityResult result = SudarshanaService.addMessage(threadId, message);
        
        if (owner != null && auditLogRepository != null) {
            auditLogRepository.save(new com.sudarshana.server.model.AuditLog(
                System.currentTimeMillis(),
                owner.getEmail(),
                "EMAIL_REPLY",
                "Sent email reply in thread " + threadId + " to recipient " + message.getRecipient()
            ));
        }
        
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    /**
     * Returns the full verification report for a thread, re-evaluating the cryptographic chain.
     */
    @GetMapping("/{threadId}")
    public ResponseEntity<ThreadSecurityReport> getThreadReport(
            @PathVariable String threadId,
            @RequestParam(value = "userId", required = false) Long userId) {
        ThreadSecurityReport report = SudarshanaService.generateReport(threadId, userId);
        return ResponseEntity.ok(report);
    }

    /**
     * Artificially tampers with a message's body content to break the cryptographic link,
     * demonstrating Sudarshana's real-time detection capabilities.
     */
    @PostMapping("/{threadId}/hijack")
    public ResponseEntity<Map<String, String>> hijackMessage(
            @PathVariable String threadId,
            @RequestBody Map<String, String> payload,
            @RequestParam(value = "userId", required = false) Long userId) {
        String messageId = payload.get("messageId");
        String spoofedBody = payload.get("body");

        if (messageId == null || spoofedBody == null) {
            return ResponseEntity.badRequest().body(Map.of(
                    "status", "ERROR",
                    "message", "Parameters 'messageId' and 'body' are required."
            ));
        }

        boolean success = SudarshanaService.simulateHijack(threadId, messageId, spoofedBody, userId);
        if (success) {
            return ResponseEntity.ok(Map.of(
                    "status", "SUCCESS",
                    "message", "Message tampered successfully. The cryptographic chain is now broken."
            ));
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                    "status", "ERROR",
                    "message", "Message or thread not found."
            ));
        }
    }

    @PostMapping("/blacklist")
    public ResponseEntity<Map<String, String>> blacklistDomain(
            @RequestBody Map<String, String> payload,
            @RequestParam(value = "userId", required = false) Long userId) {
        String domain = payload.get("domain");
        if (domain == null || domain.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "status", "ERROR",
                    "message", "Parameter 'domain' is required."
            ));
        }
        
        String userEmail = "demo@sudarshana.com";
        if (userId != null && userRepository != null) {
            User user = userRepository.findById(userId).orElse(null);
            if (user != null) {
                userEmail = user.getEmail();
            }
        }
        
        SudarshanaService.blacklistDomain(domain, userEmail);
        return ResponseEntity.ok(Map.of(
                "status", "SUCCESS",
                "message", "Domain '" + domain + "' added to security blacklist."
        ));
    }

    private String cleanEmailAddress(String emailStr) {
        if (emailStr == null) return "";
        if (emailStr.contains("<") && emailStr.contains(">")) {
            return emailStr.substring(emailStr.indexOf("<") + 1, emailStr.indexOf(">")).trim();
        }
        return emailStr.trim();
    }
}



