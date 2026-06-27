package com.sudarshana.server.controller;

import com.sudarshana.server.model.AuditLog;
import com.sudarshana.server.repository.AuditLogRepository;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/audit-logs")
public class AuditLogController {

    private static final Logger logger = LoggerFactory.getLogger(AuditLogController.class);
    private final AuditLogRepository auditLogRepository;

    @Autowired
    public AuditLogController(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @PostConstruct
    public void cleanupStaleLogs() {
        try {
            auditLogRepository.deleteByAction("EMAIL_SYNC");
            logger.info("Cleaned up stale EMAIL_SYNC audit logs on startup");
        } catch (Exception e) {
            logger.warn("Could not clean up EMAIL_SYNC audit logs: {}", e.getMessage());
        }
    }

    /**
     * Retrieves all audit logs from the database, sorted from newest to oldest.
     */
    @GetMapping
    public ResponseEntity<List<AuditLog>> getAllLogs() {
        List<AuditLog> logs = auditLogRepository.findAll(Sort.by(Sort.Direction.DESC, "timestamp"));
        return ResponseEntity.ok(logs);
    }

    /**
     * Creates a new audit log entry from a client-side action (e.g. launching a URL sandbox).
     */
    @PostMapping
    public ResponseEntity<AuditLog> createLog(@RequestBody AuditLog log) {
        if (log.getTimestamp() == 0) {
            log.setTimestamp(System.currentTimeMillis());
        }
        AuditLog saved = auditLogRepository.save(log);
        return ResponseEntity.ok(saved);
    }

    /**
     * Deletes all audit logs matching the given action type.
     */
    @DeleteMapping
    public ResponseEntity<?> deleteByAction(@RequestParam String action) {
        auditLogRepository.deleteByAction(action);
        return ResponseEntity.ok(Map.of("status", "SUCCESS", "deleted", action));
    }
}

