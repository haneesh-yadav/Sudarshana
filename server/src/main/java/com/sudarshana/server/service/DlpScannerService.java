package com.sudarshana.server.service;

import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class DlpScannerService {

    private static final Pattern CC_PATTERN = Pattern.compile("\\b(?:\\d[ -]*?){13,16}\\b");
    private static final Pattern SSN_PATTERN = Pattern.compile("\\b\\d{3}-\\d{2}-\\d{4}\\b");
    private static final Pattern API_KEY_PATTERN = Pattern.compile("\\b(?:key|secret|token|password|auth|private|passwd)\\s*[:=]\\s*[\"']?[a-zA-Z0-9_*\\-]{16,}[\"']?\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern HIGH_ENTROPY_PATTERN = Pattern.compile("\\b[a-zA-Z0-9+/_\\-]{32,}\\b");
    private static final Pattern ROUTING_PATTERN = Pattern.compile("\\b\\d{9}\\b");
    private static final Pattern IBAN_PATTERN = Pattern.compile("\\b[A-Z]{2}\\d{2}[A-Z0-9]{11,30}\\b");
    private static final Pattern WIRE_KEYWORD_PATTERN = Pattern.compile("\\b(?:routing|account|iban|swift|routing#|bank account|wire details)\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern DIGIT_SEQUENCE_PATTERN = Pattern.compile("\\d{4,}");

    public Map<String, String> scan(String text) {
        if (text == null || text.isBlank()) {
            return null;
        }

        // 1. Credit Cards
        Matcher ccMatcher = CC_PATTERN.matcher(text);
        if (ccMatcher.find()) {
            String clean = ccMatcher.group().replaceAll("[\\s-]", "");
            if (clean.length() >= 13 && clean.length() <= 16) {
                String obscured = "****-****-****-" + clean.substring(clean.length() - 4);
                return Map.of("type", "Credit Card Details", "value", obscured);
            }
        }

        // 2. SSN
        Matcher ssnMatcher = SSN_PATTERN.matcher(text);
        if (ssnMatcher.find()) {
            String ssn = ssnMatcher.group();
            return Map.of("type", "Social Security Number (SSN)", "value", "***-**-" + ssn.substring(ssn.length() - 4));
        }

        // 3. API Keys / Secrets
        Matcher apiMatcher = API_KEY_PATTERN.matcher(text);
        if (apiMatcher.find()) {
            String match = apiMatcher.group();
            String truncated = match.length() > 10 ? match.substring(0, 10) + "..." : match;
            return Map.of("type", "API Credentials / Token", "value", truncated);
        }

        Matcher entropyMatcher = HIGH_ENTROPY_PATTERN.matcher(text);
        if (entropyMatcher.find()) {
            String val = entropyMatcher.group();
            if (!val.matches("^\\d+$") && !val.contains(":") && !val.startsWith("TH-") && !val.startsWith("MSG-")) {
                return Map.of("type", "Cryptographic Key / API Secret", "value", val.substring(0, Math.min(8, val.length())) + "...");
            }
        }

        // 4. Bank Routing / IBAN / Wire Transfer
        Matcher routingMatcher = ROUTING_PATTERN.matcher(text);
        if (routingMatcher.find()) {
            String routing = routingMatcher.group();
            return Map.of("type", "Bank Routing Number", "value", "*****" + routing.substring(routing.length() - 4));
        }

        Matcher ibanMatcher = IBAN_PATTERN.matcher(text);
        if (ibanMatcher.find()) {
            String iban = ibanMatcher.group();
            return Map.of("type", "International Bank Account (IBAN)", "value", iban.substring(0, Math.min(4, iban.length())) + "..." + iban.substring(iban.length() - 4));
        }

        if (WIRE_KEYWORD_PATTERN.matcher(text).find() && DIGIT_SEQUENCE_PATTERN.matcher(text).find()) {
            return Map.of("type", "Wire Transfer / Bank Account Info", "value", "Sensitive Keywords + Digits");
        }

        return null;
    }
}
