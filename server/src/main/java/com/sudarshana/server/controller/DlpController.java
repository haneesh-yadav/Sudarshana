package com.sudarshana.server.controller;

import com.sudarshana.server.service.DlpScannerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/dlp")
public class DlpController {

    private final DlpScannerService dlpScannerService;

    @Autowired
    public DlpController(DlpScannerService dlpScannerService) {
        this.dlpScannerService = dlpScannerService;
    }

    @PostMapping("/scan")
    public ResponseEntity<Map<String, String>> scan(@RequestBody Map<String, String> request) {
        String text = request.get("text");
        Map<String, String> result = dlpScannerService.scan(text);
        if (result == null) {
            return ResponseEntity.ok(Map.of("clean", "true"));
        }
        return ResponseEntity.ok(result);
    }
}
