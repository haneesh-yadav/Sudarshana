package com.sudarshana.server.service;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class NlpAnalysisService {

    public record NlpResult(double riskScore, List<String> markers) {}

    /**
     * Performs a heuristic lexical analysis on the email body to simulate
     * behavioral NLP detection of social engineering and impersonation pressure tactics.
     */
    public NlpResult analyzeText(String body) {
        if (body == null || body.trim().isEmpty()) {
            return new NlpResult(0.0, List.of());
        }

        String lowerBody = body.toLowerCase();
        List<String> markers = new ArrayList<>();
        double score = 0.0;

        // 1. Urgency Pressure Checks
        String[] urgencyKeywords = {
                "urgent", "asap", "immediately", "quick response",
                "as soon as possible", "before the end of", "eod",
                "deadline", "emergency", "hurry", "quick action"
        };
        int urgencyMatches = countMatches(lowerBody, urgencyKeywords);
        if (urgencyMatches > 0) {
            markers.add("URGENCY_PRESSURE");
            score += Math.min(35.0, urgencyMatches * 15.0);
        }

        // 2. Financial/Billing Modification Checks
        String[] financialKeywords = {
                "routing number", "wire transfer", "bank details", "swift code",
                "payment method", "new bank account", "invoice payment",
                "deposit details", "update billing", "transfer funds", "aba number"
        };
        int financialMatches = countMatches(lowerBody, financialKeywords);
        if (financialMatches > 0) {
            markers.add("FINANCIAL_ANOMALY");
            score += Math.min(45.0, financialMatches * 25.0);
        }

        // 3. Authority / Compliance Exploitation Checks
        String[] authorityKeywords = {
                "ceo", "president", "confidential instructions", "strictly confidential",
                "board directive", "executive order", "do not disclose", "request from leadership",
                "direct instruction", "discretion required"
        };
        int authorityMatches = countMatches(lowerBody, authorityKeywords);
        if (authorityMatches > 0) {
            markers.add("AUTHORITY_EXPLOITATION");
            score += Math.min(30.0, authorityMatches * 15.0);
        }

        // Add a small baseline noise score if something was matched, otherwise baseline is low
        if (score > 0) {
            score = Math.min(99.9, score + (Math.random() * 5.0)); // add 0-5 random decimal noise
        } else {
            score = 2.0 + (Math.random() * 3.0); // very low baseline risk (2-5%)
        }

        // Round to 1 decimal place
        score = Math.round(score * 10.0) / 10.0;

        return new NlpResult(score, markers);
    }

    /**
     * Heuristic URL risk scorer. Evaluates a URL against known phishing and
     * malware distribution patterns without making any external network calls.
     * Returns a risk score from 0.0 (clean) to 99.0 (high risk).
     */
    public double scoreUrl(String url) {
        if (url == null || url.trim().isEmpty()) return 0.0;
        double score = 0.0;
        String lower = url.toLowerCase();

        // Punycode / IDN homoglyph attack (e.g. xn--nrthbrdge-p5a.com)
        if (lower.contains("xn--")) score += 40.0;

        // Cyrillic or mixed-script lookalike characters in raw form
        for (char c : url.toCharArray()) {
            if (c > 0x400 && c < 0x500) { score += 35.0; break; } // Cyrillic block
        }

        // HTTP (no SSL/TLS)
        if (lower.startsWith("http://")) score += 15.0;

        // IP address as host
        if (lower.matches("https?://\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}.*")) score += 25.0;

        // Suspicious TLDs
        String[] suspiciousTlds = { ".xyz", ".tk", ".cc", ".top", ".club", ".work",
                                    ".online", ".site", ".bid", ".win", ".stream", ".download" };
        for (String tld : suspiciousTlds) {
            if (lower.contains(tld + "/") || lower.endsWith(tld)) { score += 20.0; break; }
        }

        // APK download link (sideloading risk)
        if (lower.contains(".apk")) score += 35.0;

        // Executable file types
        if (lower.matches(".*\\.(exe|msi|bat|sh|ps1|scr|vbs|jar)(\\?.*)?$")) score += 30.0;

        // Excessive subdomains (obfuscation)
        try {
            String host = new java.net.URL(lower.startsWith("http") ? lower : "https://" + lower).getHost();
            long dots = host.chars().filter(c -> c == '.').count();
            if (dots > 3) score += 15.0;
        } catch (Exception ignored) {}

        // Very long URL (obfuscation / redirect chains)
        if (url.length() > 150) score += 10.0;

        // Phishing keyword patterns in path/query
        String[] phishingTokens = { "verify", "confirm", "secure", "account-update", "signin",
                                    "login", "credential", "paypal", "banking", "invoice-pay",
                                    "password-reset", "employee-verification" };
        for (String token : phishingTokens) {
            if (lower.contains(token)) { score += 10.0; break; }
        }

        // Known good domains get a clean pass (score reset to 0)
        String[] trustedDomains = { "google.com", "microsoft.com", "github.com",
                                    "amazon.com", "apple.com", "cloudflare.com" };
        for (String td : trustedDomains) {
            if (lower.contains(td)) return 0.0;
        }

        return Math.min(99.0, score);
    }

    private int countMatches(String text, String[] keywords) {
        int count = 0;
        for (String keyword : keywords) {
            if (text.contains(keyword)) {
                count++;
            }
        }
        return count;
    }
}

