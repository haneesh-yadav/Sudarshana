package com.sudarshana.server;

import com.sudarshana.server.model.EmailMessage;
import com.sudarshana.server.model.MessageSecurityResult;
import com.sudarshana.server.model.ThreadSecurityReport;
import com.sudarshana.server.service.CryptographyService;
import com.sudarshana.server.service.NlpAnalysisService;
import com.sudarshana.server.service.SudarshanaService;
import com.sudarshana.server.repository.EmailMessageRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

class SudarshanaSecurityTests {

    private CryptographyService cryptographyService;
    private NlpAnalysisService nlpAnalysisService;
    private EmailMessageRepository emailMessageRepository;
    private SudarshanaService SudarshanaService;

    @BeforeEach
    void setUp() {
        cryptographyService = new CryptographyService();
        nlpAnalysisService = new NlpAnalysisService();
        emailMessageRepository = Mockito.mock(EmailMessageRepository.class);

        Map<String, List<EmailMessage>> mockStore = new HashMap<>();
        Mockito.when(emailMessageRepository.findByThreadId(Mockito.anyString())).thenAnswer(invocation -> {
            String tId = invocation.getArgument(0);
            return mockStore.computeIfAbsent(tId, k -> new ArrayList<>());
        });
        Mockito.doAnswer(invocation -> {
            EmailMessage msg = invocation.getArgument(0);
            String tId = msg.getThreadId();
            List<EmailMessage> list = mockStore.computeIfAbsent(tId, k -> new ArrayList<>());
            if (!list.contains(msg)) {
                list.add(msg);
            }
            return msg;
        }).when(emailMessageRepository).save(Mockito.any(EmailMessage.class));

        SudarshanaService = new SudarshanaService(cryptographyService, nlpAnalysisService, emailMessageRepository);
    }

    @Test
    void testCryptographyService_HashingAndVerification() {
        EmailMessage msg = EmailMessage.builder()
                .sender("alice@company.com")
                .recipient("bob@vendor.com")
                .subject("Payment details")
                .body("Hello Bob, please send the invoice.")
                .build();

        String hash = cryptographyService.calculateCurrentHash(msg);
        assertNotNull(hash);

        msg.setCurrentHash(hash);
        assertTrue(cryptographyService.verifyMessageHash(msg));

        // Tamper with body
        msg.setBody("Hello Bob, please send the invoice immediately to the new account.");
        assertFalse(cryptographyService.verifyMessageHash(msg));
    }

    @Test
    void testNlpAnalysisService_Heuristics() {
        // Safe message
        NlpAnalysisService.NlpResult safe = nlpAnalysisService.analyzeText("Hi, hope you are doing well. Just wanted to follow up on yesterday's discussion.");
        assertTrue(safe.riskScore() < 10.0);
        assertTrue(safe.markers().isEmpty());

        // Urgent financial fraud message
        NlpAnalysisService.NlpResult urgentFin = nlpAnalysisService.analyzeText(
                "URGENT: Please execute a wire transfer to our updated bank details by EOD today. This is a direct order from the CEO."
        );
        assertTrue(urgentFin.riskScore() > 60.0);
        assertTrue(urgentFin.markers().contains("URGENCY_PRESSURE"));
        assertTrue(urgentFin.markers().contains("FINANCIAL_ANOMALY"));
        assertTrue(urgentFin.markers().contains("AUTHORITY_EXPLOITATION"));
    }

    @Test
    void testNlpAnalysisService_EdgeCases() {
        // Null body
        NlpAnalysisService.NlpResult nullResult = nlpAnalysisService.analyzeText(null);
        assertEquals(0.0, nullResult.riskScore());
        assertTrue(nullResult.markers().isEmpty());

        // Empty body
        NlpAnalysisService.NlpResult emptyResult = nlpAnalysisService.analyzeText("");
        assertEquals(0.0, emptyResult.riskScore());
        assertTrue(emptyResult.markers().isEmpty());

        // Single urgency keyword only â€” should flag urgency but not financial or authority
        NlpAnalysisService.NlpResult urgencyOnly = nlpAnalysisService.analyzeText("Please respond ASAP.");
        assertTrue(urgencyOnly.markers().contains("URGENCY_PRESSURE"));
        assertFalse(urgencyOnly.markers().contains("FINANCIAL_ANOMALY"));
        assertFalse(urgencyOnly.markers().contains("AUTHORITY_EXPLOITATION"));
        assertTrue(urgencyOnly.riskScore() > 0.0);

        // Financial only â€” routing number change without urgency
        NlpAnalysisService.NlpResult financialOnly = nlpAnalysisService.analyzeText(
                "Please update our routing number in your records for future payments."
        );
        assertTrue(financialOnly.markers().contains("FINANCIAL_ANOMALY"));
        assertTrue(financialOnly.riskScore() >= 25.0);
    }

    @Test
    void testUrlHeuristics_SuspiciousPatterns() {
        // Punycode homoglyph domain
        double punycodeScore = nlpAnalysisService.scoreUrl("http://xn--nrthbrdge-p5a.com/login");
        assertTrue(punycodeScore >= 40.0, "Punycode URL should score high risk");

        // APK download link
        double apkScore = nlpAnalysisService.scoreUrl("http://scammail-portal.com/download/security-patch.apk");
        assertTrue(apkScore >= 45.0, "APK download URL should score high risk");

        // HTTP with phishing path
        double phishScore = nlpAnalysisService.scoreUrl("http://billing-verify.com/account-update");
        assertTrue(phishScore >= 25.0, "HTTP phishing URL should score medium-high risk");

        // Known trusted domain
        double googleScore = nlpAnalysisService.scoreUrl("https://www.google.com/search?q=test");
        assertEquals(0.0, googleScore, "Trusted domain should return 0 risk");

        // IP address host
        double ipHostScore = nlpAnalysisService.scoreUrl("http://185.190.4.99/admin");
        assertTrue(ipHostScore >= 25.0, "IP-based URL host should score higher risk");

        // HTTPS with no other flags â€” should be low risk
        double httpsClean = nlpAnalysisService.scoreUrl("https://company.com/report-2025.pdf");
        assertTrue(httpsClean < 20.0, "Plain HTTPS URL with no flags should be low risk");
    }

    @Test
    void testSudarshanaService_ChainingAndHijackSimulation() {
        String threadId = "thread-123";

        // Message 1
        EmailMessage msg1 = EmailMessage.builder()
                .sender("ceo@firm.com")
                .recipient("cfo@firm.com")
                .subject("Confidential Project")
                .body("Let's coordinate on the transaction details soon.")
                .spfAligned(true)
                .dkimAligned(true)
                .dmarcAligned(true)
                .build();

        MessageSecurityResult res1 = SudarshanaService.addMessage(threadId, msg1);
        assertTrue(res1.isHashValid());
        assertNull(res1.getPreviousHash());
        assertNotNull(res1.getCurrentHash());

        // Message 2 (Reply)
        EmailMessage msg2 = EmailMessage.builder()
                .sender("cfo@firm.com")
                .recipient("ceo@firm.com")
                .subject("Re: Confidential Project")
                .body("Understood. Ready to proceed when you send the routing details.")
                .spfAligned(true)
                .dkimAligned(true)
                .dmarcAligned(true)
                .build();

        MessageSecurityResult res2 = SudarshanaService.addMessage(threadId, msg2);
        assertTrue(res2.isHashValid());
        assertEquals(res1.getCurrentHash(), res2.getPreviousHash());

        // Generate report and assert chain validity
        ThreadSecurityReport initialReport = SudarshanaService.generateReport(threadId);
        assertTrue(initialReport.isChainValid());
        assertEquals(2, initialReport.getMessagesAnalyzedCount());
        assertEquals(-1, initialReport.getBrokenAtIndex());
        assertEquals("LOW", initialReport.getRiskLevel());

        // Simulate hijacking/tampering with Message 1's content in storage
        boolean hijackSuccess = SudarshanaService.simulateHijack(
                threadId,
                res1.getMessageId(),
                "URGENT: Wire transfer $500,000 to routing number 123456789 by EOD."
        );
        assertTrue(hijackSuccess);

        // Re-generate report: Cryptographic validation should fail starting at index 0
        ThreadSecurityReport tamperedReport = SudarshanaService.generateReport(threadId);
        assertFalse(tamperedReport.isChainValid());
        assertEquals(0, tamperedReport.getBrokenAtIndex()); // broken at index 0 (message 1 body tampered)
        assertEquals("HIGH", tamperedReport.getRiskLevel());
        assertFalse(tamperedReport.getMessages().get(0).isHashValid());
        assertFalse(tamperedReport.getMessages().get(1).isHashValid()); // subsequent cascade fails validation
    }

    @Test
    void testSudarshanaService_HeaderGuardValidation() {
        String threadId = "thread-header-test";

        // Message with mismatched return path and suspicious IP
        EmailMessage msg = EmailMessage.builder()
                .sender("ceo@company.com")
                .recipient("employee@company.com")
                .subject("Immediate Request")
                .body("Please check this link immediately.")
                .spfAligned(true)
                .dkimAligned(true)
                .dmarcAligned(true)
                .senderIp("185.190.4.12") // suspicious IP
                .returnPath("attacker@spamdomain.com") // mismatch
                .build();

        MessageSecurityResult res = SudarshanaService.addMessage(threadId, msg);
        
        assertFalse(res.isReturnPathMatched());
        assertEquals("185.190.4.12", res.getSenderIp());
        assertEquals("attacker@spamdomain.com", res.getReturnPath());
        assertTrue(res.getCombinedRiskScore() >= 50.0);
        assertTrue(res.getRiskLevel().equals("MEDIUM") || res.getRiskLevel().equals("HIGH"));
        
        boolean hasIpNotes = res.getHeaderValidationNotes().stream().anyMatch(n -> n.contains("SUSPICIOUS_IP"));
        boolean hasRpNotes = res.getHeaderValidationNotes().stream().anyMatch(n -> n.contains("RETURN_PATH_MISMATCH"));
        
        assertTrue(hasIpNotes);
        assertTrue(hasRpNotes);
    }

    @Test
    void testSudarshanaService_LongChainIntegrity() {
        String threadId = "thread-long-chain";
        List<MessageSecurityResult> results = new ArrayList<>();

        // Build a 5-message chain â€” all should validate and link correctly
        String[] senders = { "a@firm.com", "b@firm.com", "a@firm.com", "b@firm.com", "a@firm.com" };
        for (int i = 0; i < 5; i++) {
            EmailMessage msg = EmailMessage.builder()
                    .sender(senders[i])
                    .recipient(senders[(i + 1) % 2])
                    .subject("Thread message " + (i + 1))
                    .body("Body content for message " + (i + 1) + " with unique token: " + java.util.UUID.randomUUID())
                    .spfAligned(true).dkimAligned(true).dmarcAligned(true)
                    .build();
            results.add(SudarshanaService.addMessage(threadId, msg));
        }

        // All chain links should connect
        for (int i = 1; i < results.size(); i++) {
            assertEquals(results.get(i - 1).getCurrentHash(), results.get(i).getPreviousHash(),
                "Message " + i + " should link back to message " + (i - 1));
        }

        // Full report should show valid chain and LOW risk
        ThreadSecurityReport report = SudarshanaService.generateReport(threadId);
        assertTrue(report.isChainValid());
        assertEquals(5, report.getMessagesAnalyzedCount());
        assertEquals(-1, report.getBrokenAtIndex());
    }

    @Test
    void testCryptographyService_HashIsDeterministic() {
        EmailMessage msg = EmailMessage.builder()
                .sender("test@example.com")
                .recipient("recv@example.com")
                .subject("Determinism check")
                .body("Same content every time.")
                .build();

        String hash1 = cryptographyService.calculateCurrentHash(msg);
        String hash2 = cryptographyService.calculateCurrentHash(msg);
        assertEquals(hash1, hash2, "Hash must be deterministic for identical content");
        assertTrue(hash1.matches("[a-f0-9]{64}"), "Hash must be a 64-char hex string (SHA-256)");
    }
}


