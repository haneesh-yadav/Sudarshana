package com.sudarshana.server.controller;

import com.sudarshana.server.model.AuditLog;
import com.sudarshana.server.repository.AuditLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/audit-logs")
@CrossOrigin(origins = "*")
public class AuditLogController {

    private final AuditLogRepository auditLogRepository;

    @Autowired
    public AuditLogController(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
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
}

