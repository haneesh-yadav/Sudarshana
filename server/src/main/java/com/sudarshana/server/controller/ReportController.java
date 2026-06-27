package com.sudarshana.server.controller;

import com.sudarshana.server.model.Report;
import com.sudarshana.server.model.User;
import com.sudarshana.server.repository.ReportRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportRepository reportRepository;

    @Autowired
    public ReportController(ReportRepository reportRepository) {
        this.reportRepository = reportRepository;
    }

    private User getAuthenticatedUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof User) {
            return (User) principal;
        }
        return null;
    }

    @GetMapping
    public ResponseEntity<List<Report>> getReports() {
        User user = getAuthenticatedUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        List<Report> reports = reportRepository.findByUserIdOrderByGeneratedAtDesc(user.getId());
        return ResponseEntity.ok(reports);
    }

    @PostMapping
    public ResponseEntity<Report> createReport(@RequestBody Report report) {
        User user = getAuthenticatedUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        report.setUserId(user.getId());
        if (report.getGeneratedAt() == 0) {
            report.setGeneratedAt(System.currentTimeMillis());
        }
        if (report.getStatus() == null) {
            report.setStatus("Ready");
        }
        Report saved = reportRepository.save(report);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteReport(@PathVariable Long id) {
        User user = getAuthenticatedUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return reportRepository.findById(id)
            .filter(r -> r.getUserId().equals(user.getId()))
            .map(r -> {
                reportRepository.delete(r);
                return ResponseEntity.ok(Map.<String, String>of("status", "SUCCESS"));
            })
            .orElse(ResponseEntity.notFound().build());
    }
}
