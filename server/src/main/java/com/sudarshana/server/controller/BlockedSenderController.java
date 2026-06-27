package com.sudarshana.server.controller;

import com.sudarshana.server.model.BlockedSender;
import com.sudarshana.server.repository.BlockedSenderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/senders")
public class BlockedSenderController {

    private final BlockedSenderRepository blockedSenderRepository;

    @Autowired
    public BlockedSenderController(BlockedSenderRepository blockedSenderRepository) {
        this.blockedSenderRepository = blockedSenderRepository;
    }

    @GetMapping
    public ResponseEntity<?> getSenderStatus(@RequestParam String email) {
        BlockedSender record = blockedSenderRepository.findBySenderEmail(email);
        if (record == null) {
            return ResponseEntity.ok(Map.of("status", "none"));
        }
        return ResponseEntity.ok(Map.of(
                "status", record.getAction(),
                "email", record.getSenderEmail(),
                "createdAt", record.getCreatedAt()
        ));
    }

    @PostMapping("/block")
    public ResponseEntity<?> blockSender(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("status", "ERROR", "message", "Email is required."));
        }

        String userEmail = "demo@sudarshana.com";
        blockedSenderRepository.deleteBySenderEmail(email);
        BlockedSender saved = blockedSenderRepository.save(
                new BlockedSender(email, "blocked", System.currentTimeMillis(), userEmail)
        );
        return ResponseEntity.ok(Map.of(
                "status", "SUCCESS",
                "message", "Sender '" + email + "' has been blocked.",
                "email", saved.getSenderEmail()
        ));
    }

    @PostMapping("/trust")
    public ResponseEntity<?> trustSender(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("status", "ERROR", "message", "Email is required."));
        }

        String userEmail = "demo@sudarshana.com";
        blockedSenderRepository.deleteBySenderEmail(email);
        BlockedSender saved = blockedSenderRepository.save(
                new BlockedSender(email, "trusted", System.currentTimeMillis(), userEmail)
        );
        return ResponseEntity.ok(Map.of(
                "status", "SUCCESS",
                "message", "Sender '" + email + "' has been marked as trusted.",
                "email", saved.getSenderEmail()
        ));
    }

    @DeleteMapping
    public ResponseEntity<?> unblockSender(@RequestParam String email) {
        blockedSenderRepository.deleteBySenderEmail(email);
        return ResponseEntity.ok(Map.of("status", "SUCCESS", "message", "Sender action cleared for '" + email + "'."));
    }
}
