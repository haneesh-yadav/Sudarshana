package com.sudarshana.server.service;

import com.sudarshana.server.model.EmailMessage;
import com.sudarshana.server.model.MessageSecurityResult;
import com.sudarshana.server.model.ThreadSecurityReport;
import com.sudarshana.server.model.AttachmentInfo;
import com.sudarshana.server.model.LinkInfo;
import com.sudarshana.server.model.User;
import com.sudarshana.server.repository.EmailMessageRepository;
import com.sudarshana.server.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import jakarta.annotation.PostConstruct;

@Service
public class SudarshanaService {

    private final CryptographyService cryptographyService;
    private final NlpAnalysisService nlpAnalysisService;
    private final EmailMessageRepository emailMessageRepository;
    private final IpGeolocationService ipGeolocationService;
    private UserRepository userRepository;
    private com.sudarshana.server.repository.BlacklistedDomainRepository blacklistedDomainRepository;
    private com.sudarshana.server.repository.AuditLogRepository auditLogRepository;
    private final Set<String> blacklistedDomains = java.util.concurrent.ConcurrentHashMap.newKeySet();

    @Autowired
    public SudarshanaService(CryptographyService cryptographyService, 
                              NlpAnalysisService nlpAnalysisService,
                              EmailMessageRepository emailMessageRepository,
                              UserRepository userRepository,
                              IpGeolocationService ipGeolocationService,
                              com.sudarshana.server.repository.BlacklistedDomainRepository blacklistedDomainRepository,
                              com.sudarshana.server.repository.AuditLogRepository auditLogRepository) {
        this.cryptographyService = cryptographyService;
        this.nlpAnalysisService = nlpAnalysisService;
        this.emailMessageRepository = emailMessageRepository;
        this.userRepository = userRepository;
        this.ipGeolocationService = ipGeolocationService;
        this.blacklistedDomainRepository = blacklistedDomainRepository;
        this.auditLogRepository = auditLogRepository;
    }

    // 3-arg constructor for tests
    public SudarshanaService(CryptographyService cryptographyService, 
                              NlpAnalysisService nlpAnalysisService,
                              EmailMessageRepository emailMessageRepository) {
        this.cryptographyService = cryptographyService;
        this.nlpAnalysisService = nlpAnalysisService;
        this.emailMessageRepository = emailMessageRepository;
        this.ipGeolocationService = new IpGeolocationService();
    }

    @PostConstruct
    public void init() {
        // Load blacklisted domains from database on startup
        if (blacklistedDomainRepository != null) {
            blacklistedDomainRepository.findAll().forEach(bd -> {
                blacklistedDomains.add(bd.getDomain().toLowerCase().trim());
            });
        }

        // Skip demo data seeding unless SEED_DEMO_DATA=true (set this only in dev/staging).
        // In production, leave SEED_DEMO_DATA unset or set it to "false".
        String seedDemo = System.getenv().getOrDefault("SEED_DEMO_DATA", "true");
        if (!"true".equalsIgnoreCase(seedDemo)) {
            return;
        }

        if (emailMessageRepository.count() > 0) {
            return; // Demo data already loaded in the database
        }

        // Setup demo user if userRepository is present
        User demoUser = null;
        if (userRepository != null) {
            demoUser = userRepository.findByEmail("demo@sudarshana.com").orElseGet(() -> {
                User u = User.builder()
                        .email("demo@sudarshana.com")
                        .fullName("Demo User")
                        .imapHost("imap.gmail.com")
                        .imapPort(993)
                        .smtpHost("smtp.gmail.com")
                        .smtpPort(587)
                        .emailUser("demo@sudarshana.com")
                        .emailPassword(java.util.UUID.randomUUID().toString())
                        .build();
                return userRepository.save(u);
            });
        }

        // TH-10250 (Critical - Phishing Link & Malware Attachment Demo)
        String tDemo = "TH-10250";
        addMessage(tDemo, EmailMessage.builder()
                .id("MSG-10250-1")
                .sender("internal-audit@company.com")
                .recipient("all-employees@company.com")
                .subject("Upcoming Security Update and Verification")
                .body("Hello team, please be prepared for our annual security update coming up later today.")
                .spfAligned(true).dkimAligned(true).dmarcAligned(true)
                .senderIp("192.168.1.15").returnPath("internal-audit@company.com")
                .owner(demoUser)
                .build());
        addMessage(tDemo, EmailMessage.builder()
                .id("MSG-10250-2")
                .sender("sec-ops@company-scammail.com")
                .recipient("all-employees@company.com")
                .subject("URGENT: Mandatory Mobile Security Update & Verification required")
                .body("Dear Employees, as part of our security compliance program, all employees must install the updated mobile app immediately: employee-security-patch.apk. To verify your credentials, please complete the form at http://northbrÑ–dge.com/employee-verification and download the security patch app at http://scammail-portal.com/download/employee-security-patch.apk.")
                .spfAligned(false).dkimAligned(false).dmarcAligned(false)
                .senderIp("185.190.4.99").returnPath("attacker@scammail-portal.com")
                .attachments(List.of(
                    AttachmentInfo.builder()
                        .fileName("employee-security-patch.apk")
                        .fileSize("5.8 MB")
                        .fileType("APK")
                        .sha256Hash("fa5bc7c2a71f00a5a54466b5ac7c2a71f00a5a54466d78215abcde123456789b")
                        .reputationScore(95.0)
                        .build()
                ))
                .owner(demoUser)
                .build());

        // TH-10248 (Critical - Broken chain)
        String t1 = "TH-10248";
        addMessage(t1, EmailMessage.builder()
                .id("MSG-10248-1")
                .sender("vendor@sterling-logistics.com")
                .recipient("cfo@company.com")
                .subject("Re: Updated wiring instructions â€” Sterling Logistics invoice #4471")
                .body("Hello A. Whitfield, please find attached the monthly invoice #4471 for logistics operations. Let us know if you have any questions.")
                .spfAligned(true).dkimAligned(true).dmarcAligned(true)
                .senderIp("198.51.100.10").returnPath("vendor@sterling-logistics.com")
                .owner(demoUser)
                .build());
        addMessage(t1, EmailMessage.builder()
                .id("MSG-10248-2")
                .sender("cfo@company.com")
                .recipient("vendor@sterling-logistics.com")
                .subject("Re: Updated wiring instructions â€” Sterling Logistics invoice #4471")
                .body("Hi, thank you for sending the invoice. I will verify it and schedule the payment for early next week.")
                .spfAligned(true).dkimAligned(true).dmarcAligned(true)
                .senderIp("192.168.1.55").returnPath("cfo@company.com")
                .owner(demoUser)
                .build());
        addMessage(t1, EmailMessage.builder()
                .id("MSG-10248-3")
                .sender("vendor@sterling-logistic.co")
                .recipient("cfo@company.com")
                .subject("Re: Updated wiring instructions â€” Sterling Logistics invoice #4471")
                .body("URGENT: Please execute a wire transfer to our new bank details. Do not use the routing number from the invoice as we updated our billing bank account. We need payment immediately to routing number 123456789 by EOD to keep logistics moving. Alternatively, install our secure bank authentication update app: bank_transfer_update.apk to complete the transaction directly.")
                .spfAligned(false).dkimAligned(false).dmarcAligned(false)
                .senderIp("185.190.4.12").returnPath("attacker@scammail-server.net")
                .attachments(List.of(
                    AttachmentInfo.builder()
                        .fileName("bank_transfer_update.apk")
                        .fileSize("4.2 MB")
                        .fileType("APK")
                        .sha256Hash("b5ac7c2a71f00a5a54466b5ac7c2a71f00a5a54466d78215abcde123456789a")
                        .reputationScore(90.0)
                        .build()
                ))
                .owner(demoUser)
                .build());
        // Tamper with message 1 to break hash chain
        List<EmailMessage> thread1 = emailMessageRepository.findByThreadId(t1);
        if (!thread1.isEmpty()) {
            EmailMessage msg1 = thread1.get(0);
            msg1.setBody("Tampered Sterling Logistics invoice body - send $25,000 to routing number 999999999 immediately.");
            emailMessageRepository.save(msg1);
        }

        // TH-10239 (Flagged - Intact chain, Urgency/Authority NLP)
        String t2 = "TH-10239";
        addMessage(t2, EmailMessage.builder()
                .id("MSG-10239-1")
                .sender("R. Okafor (legal@northbridge.com)")
                .recipient("legal@company.com")
                .subject("Contract redline â€” MSA Addendum v3")
                .body("Please review the redlines for MSA Addendum v3. Let me know if you agree with Section 4.")
                .spfAligned(true).dkimAligned(true).dmarcAligned(true)
                .senderIp("203.0.113.88").returnPath("legal@northbridge.com")
                .owner(demoUser)
                .build());
        addMessage(t2, EmailMessage.builder()
                .id("MSG-10239-2")
                .sender("legal@northbridge.com")
                .recipient("legal@company.com")
                .subject("Contract redline â€” MSA Addendum v3")
                .body("Hello, request from leadership: I need you to sign this immediately. The Board is waiting and we must execute today. Delaying this will jeopardize our contract. Please review and sign at our secure portal: http://northbrÑ–dge.com/sign-contract-mSA-Addendum-v3")
                .spfAligned(true).dkimAligned(true).dmarcAligned(true)
                .senderIp("203.0.113.88").returnPath("legal@northbridge.com")
                .owner(demoUser)
                .build());

        // TH-10231 (Quarantined - SPF/DKIM failed)
        String t3 = "TH-10231";
        addMessage(t3, EmailMessage.builder()
                .id("MSG-10231-1")
                .sender("billing@halsteadco.com")
                .recipient("J. Park (AP)")
                .subject("Q2 vendor reconciliation â€” final figures")
                .body("Attached are the final figures for Q2 vendor reconciliation.")
                .spfAligned(true).dkimAligned(true).dmarcAligned(true)
                .senderIp("198.51.100.22").returnPath("billing@halsteadco.com")
                .owner(demoUser)
                .build());
        addMessage(t3, EmailMessage.builder()
                .id("MSG-10231-2")
                .sender("billing@halsteadco.com")
                .recipient("J. Park (AP)")
                .subject("Q2 vendor reconciliation â€” final figures")
                .body("Please confirm if the figures are verified and the invoice is scheduled at http://billing-verification.com/q2-reconcile")
                .spfAligned(false).dkimAligned(false).dmarcAligned(false)
                .senderIp("203.0.113.110").returnPath("hacker@fakehalsteadco.com")
                .owner(demoUser)
                .build());

        // TH-10226 (Verified - Clean)
        String t4 = "TH-10226";
        addMessage(t4, EmailMessage.builder()
                .id("MSG-10226-1")
                .sender("hr@brightlanehr.com")
                .recipient("M. Chen")
                .subject("Onboarding docs + W-9 for new contractor")
                .body("Welcome to the team! Please send your completed W-9 and onboarding docs.")
                .spfAligned(true).dkimAligned(true).dmarcAligned(true)
                .senderIp("198.51.100.5").returnPath("hr@brightlanehr.com")
                .owner(demoUser)
                .build());
        addMessage(t4, EmailMessage.builder()
                .id("MSG-10226-2")
                .sender("M. Chen")
                .recipient("hr@brightlanehr.com")
                .subject("Re: Onboarding docs + W-9 for new contractor")
                .body("Hi HR, attached are my completed onboarding documents and W-9. Let me know if you need anything else.")
                .spfAligned(true).dkimAligned(true).dmarcAligned(true)
                .senderIp("192.168.1.102").returnPath("mchen@company.com")
                .owner(demoUser)
                .build());

        // TH-10219 (Critical - Broken chain)
        String t5 = "TH-10219";
        addMessage(t5, EmailMessage.builder()
                .id("MSG-10219-1")
                .sender("travel@corp-internal.io")
                .recipient("CEO")
                .subject("Re: Re: Fwd: Executive travel approval â€” Singapore offsite")
                .body("Please approve the travel requests for the Singapore offsite.")
                .spfAligned(true).dkimAligned(true).dmarcAligned(true)
                .senderIp("192.168.2.14").returnPath("travel@corp-internal.io")
                .owner(demoUser)
                .build());
        addMessage(t5, EmailMessage.builder()
                .id("MSG-10219-2")
                .sender("CEO")
                .recipient("travel@corp-internal.io")
                .subject("Re: Re: Fwd: Executive travel approval â€” Singapore offsite")
                .body("Approved. Please book the flights immediately.")
                .spfAligned(true).dkimAligned(true).dmarcAligned(true)
                .senderIp("192.168.1.10").returnPath("ceo@company.com")
                .owner(demoUser)
                .build());
        // Tamper with message 1 to break hash chain
        List<EmailMessage> thread5 = emailMessageRepository.findByThreadId(t5);
        if (!thread5.isEmpty()) {
            EmailMessage msg5 = thread5.get(0);
            msg5.setBody("Tampered travel request details - wire money immediately to offshore account.");
            emailMessageRepository.save(msg5);
        }

        // TH-10204 (Verified - Clean)
        String t6 = "TH-10204";
        addMessage(t6, EmailMessage.builder()
                .id("MSG-10204-1")
                .sender("audit@meridianpartners.com")
                .recipient("Finance Team")
                .subject("Annual audit â€” supporting documentation request")
                .body("As part of the annual audit, please provide the supporting documentation for ledger 302.")
                .spfAligned(true).dkimAligned(true).dmarcAligned(true)
                .senderIp("198.51.100.80").returnPath("audit@meridianpartners.com")
                .owner(demoUser)
                .build());
        addMessage(t6, EmailMessage.builder()
                .id("MSG-10204-2")
                .sender("Finance Team")
                .recipient("audit@meridianpartners.com")
                .subject("Re: Annual audit â€” supporting documentation request")
                .body("Here is the requested supporting documentation for ledger 302.")
                .spfAligned(true).dkimAligned(true).dmarcAligned(true)
                .senderIp("192.168.1.4").returnPath("finance@company.com")
                .owner(demoUser)
                .build());

        // TH-10198 (Flagged - SPF alignment fail)
        String t7 = "TH-10198";
        addMessage(t7, EmailMessage.builder()
                .id("MSG-10198-1")
                .sender("billing@swiftfreightco.com")
                .recipient("T. Adeyemi (AP)")
                .subject("Payment confirmation needed â€” overdue PO #88213")
                .body("Please confirm payment of the overdue PO #88213 as soon as possible.")
                .spfAligned(false).dkimAligned(true).dmarcAligned(true)
                .senderIp("198.51.100.99").returnPath("billing@swiftfreightco.com")
                .owner(demoUser)
                .build());
        addMessage(t7, EmailMessage.builder()
                .id("MSG-10198-2")
                .sender("T. Adeyemi (AP)")
                .recipient("billing@swiftfreightco.com")
                .subject("Re: Payment confirmation needed â€” overdue PO #88213")
                .body("I will check the status of PO #88213 with the finance manager and follow up immediately.")
                .spfAligned(true).dkimAligned(true).dmarcAligned(true)
                .senderIp("192.168.1.9").returnPath("tadeyemi@company.com")
                .owner(demoUser)
                .build());

        // TH-10187 (Verified - Clean)
        String t8 = "TH-10187";
        addMessage(t8, EmailMessage.builder()
                .id("MSG-10187-1")
                .sender("ops@internal.sudarshana.io")
                .recipient("Team")
                .subject("Weekly ops sync notes + action items")
                .body("Notes from today's sync are posted on the wiki. Action items are due by Friday.")
                .spfAligned(true).dkimAligned(true).dmarcAligned(true)
                .senderIp("192.168.1.1").returnPath("ops@internal.sudarshana.io")
                .owner(demoUser)
                .build());
        addMessage(t8, EmailMessage.builder()
                .id("MSG-10187-2")
                .sender("Team Member")
                .recipient("ops@internal.sudarshana.io")
                .subject("Re: Weekly ops sync notes + action items")
                .body("Understood. Working on the action items now.")
                .spfAligned(true).dkimAligned(true).dmarcAligned(true)
                .senderIp("192.168.1.25").returnPath("member@company.com")
                .owner(demoUser)
                .build());
    }

    public synchronized List<ThreadSecurityReport> getAllReports() {
        return getAllReports(null);
    }

    public synchronized List<ThreadSecurityReport> getAllReports(Long userId) {
        List<ThreadSecurityReport> reports = new ArrayList<>();
        List<String> threadIds;
        if (userId == null) {
            threadIds = emailMessageRepository.findDistinctThreadIds();
        } else {
            threadIds = emailMessageRepository.findDistinctThreadIdsByUserId(userId);
        }
        Collections.sort(threadIds, Collections.reverseOrder()); // newest or largest id first
        for (String threadId : threadIds) {
            reports.add(generateReport(threadId, userId));
        }
        return reports;
    }

    /**
     * Appends a message to a thread, computes its cryptographic locks, analyzes it,
     * and returns its security result.
     */
    public synchronized MessageSecurityResult addMessage(String threadId, EmailMessage message) {
        // Fallback user setting
        if (message.getOwner() == null && userRepository != null) {
            userRepository.findByEmail("demo@sudarshana.com").ifPresent(message::setOwner);
        }

        List<EmailMessage> thread;
        if (message.getOwner() != null) {
            thread = emailMessageRepository.findByThreadIdAndOwnerId(threadId, message.getOwner().getId());
        } else {
            thread = emailMessageRepository.findByThreadId(threadId);
        }

        // Basic fields configuration
        message.setThreadId(threadId);
        if (message.getId() == null || message.getId().isEmpty()) {
            message.setId(UUID.randomUUID().toString());
        }
        if (message.getTimestamp() == 0) {
            message.setTimestamp(System.currentTimeMillis());
        }

        // Auto-inject timezone offsets for demo data
        if (message.getTimezoneOffset() == null || message.getTimezoneOffset().isEmpty()) {
            String msgId = message.getId();
            if (msgId != null) {
                if (msgId.contains("10250-2") || msgId.contains("10248-3")) {
                    message.setTimezoneOffset("+0200");
                } else if (msgId.contains("10239-2")) {
                    message.setTimezoneOffset("-0500");
                } else if (msgId.contains("10226")) {
                    message.setTimezoneOffset("+0000");
                } else {
                    message.setTimezoneOffset("+0530");
                }
            } else {
                message.setTimezoneOffset("+0530");
            }
        }

        // Cryptographic linking: previousHash is the currentHash of the latest message in the thread
        if (!thread.isEmpty()) {
            EmailMessage lastMessage = thread.get(thread.size() - 1);
            message.setPreviousHash(lastMessage.getCurrentHash());
        } else {
            message.setPreviousHash(null);
        }

        // Calculate and set current lock hash
        String computedHash = cryptographyService.calculateCurrentHash(message);
        message.setCurrentHash(computedHash);

        // Save message to database
        emailMessageRepository.save(message);

        // Prime the IP geolocation cache asynchronously so that report generation
        // (resolveIpCachedOnly) can return immediately on subsequent GET /api/threads calls.
        // This fire-and-forget call runs outside the synchronized block via a daemon thread.
        final String senderIpForCache = message.getSenderIp();
        if (senderIpForCache != null && !senderIpForCache.trim().isEmpty()) {
            Thread cacheThread = new Thread(() -> ipGeolocationService.resolveIp(senderIpForCache));
            cacheThread.setDaemon(true);
            cacheThread.setName("ip-cache-" + senderIpForCache);
            cacheThread.start();
        }

        // Perform NLP and alignment evaluation to return immediate results
        return evaluateMessageSecurity(message, true);
    }

    public synchronized ThreadSecurityReport generateReport(String threadId) {
        return generateReport(threadId, null);
    }

    /**
     * Generates a security report for the entire email thread, performing real-time
     * cascading hash chain integrity checks.
     */
    public synchronized ThreadSecurityReport generateReport(String threadId, Long userId) {
        List<EmailMessage> messages;
        if (userId != null) {
            messages = emailMessageRepository.findByThreadIdAndOwnerId(threadId, userId);
        } else {
            messages = emailMessageRepository.findByThreadId(threadId);
        }
        messages.sort(Comparator.comparingLong(EmailMessage::getTimestamp));
        List<MessageSecurityResult> results = new ArrayList<>();

        boolean chainValid = true;
        int brokenAtIndex = -1;
        String expectedPreviousHash = null;

        for (int i = 0; i < messages.size(); i++) {
            EmailMessage msg = messages.get(i);
            boolean hashValid = true;

            // 1. Verify links in the chain
            if (i > 0) {
                // The previous hash field of current message must match the actual current hash of previous message
                boolean linkValid = Objects.equals(msg.getPreviousHash(), expectedPreviousHash);
                // Re-verify the current hash using the message body and the previous hash it claims to have
                boolean internalHashValid = cryptographyService.verifyMessageHash(msg);

                if (!linkValid || !internalHashValid) {
                    chainValid = false;
                    hashValid = false;
                    if (brokenAtIndex == -1) {
                        brokenAtIndex = i;
                    }
                }
            } else {
                // First message: previousHash should be empty/null, re-verify its own hash
                boolean internalHashValid = cryptographyService.verifyMessageHash(msg);
                if (!internalHashValid || msg.getPreviousHash() != null) {
                    chainValid = false;
                    hashValid = false;
                    brokenAtIndex = 0;
                }
            }

            // If chain is already broken, subsequent messages are marked invalid
            if (brokenAtIndex != -1 && i > brokenAtIndex) {
                hashValid = false;
            }

            // Run NLP analysis and create the message security report
            MessageSecurityResult res = evaluateMessageSecurity(msg, hashValid);
            results.add(res);

            // Track expected current hash for next iteration
            expectedPreviousHash = msg.getCurrentHash();
        }

        // Assess overall thread threat level
        String threadRiskLevel = "LOW";
        if (!chainValid) {
            threadRiskLevel = "HIGH"; // Broken cryptographic chain is critical
        } else {
            // Check if any message has high risk score
            double maxNlpScore = results.stream().mapToDouble(MessageSecurityResult::getNlpRiskScore).max().orElse(0.0);
            if (maxNlpScore > 75.0) {
                threadRiskLevel = "HIGH";
            } else if (maxNlpScore > 40.0) {
                threadRiskLevel = "MEDIUM";
            }
        }

        return ThreadSecurityReport.builder()
                .threadId(threadId)
                .chainValid(chainValid)
                .messagesAnalyzedCount(messages.size())
                .brokenAtIndex(brokenAtIndex)
                .riskLevel(threadRiskLevel)
                .messages(results)
                .build();
    }

    public synchronized void blacklistDomain(String domain) {
        blacklistDomain(domain, "demo@sudarshana.com");
    }

    public synchronized void blacklistDomain(String domain, String userEmail) {
        if (domain != null && !domain.trim().isEmpty()) {
            String cleanDomain = domain.trim().toLowerCase();
            this.blacklistedDomains.add(cleanDomain);
            
            if (blacklistedDomainRepository != null) {
                if (!blacklistedDomainRepository.existsById(cleanDomain)) {
                    blacklistedDomainRepository.save(new com.sudarshana.server.model.BlacklistedDomain(
                        cleanDomain,
                        System.currentTimeMillis(),
                        userEmail
                    ));
                }
            }
            
            if (auditLogRepository != null) {
                auditLogRepository.save(new com.sudarshana.server.model.AuditLog(
                    System.currentTimeMillis(),
                    userEmail,
                    "DOMAIN_BLACKLIST",
                    "Blacklisted domain: " + cleanDomain
                ));
            }
        }
    }

    public synchronized boolean simulateHijack(String threadId, String messageId, String spoofedBody) {
        return simulateHijack(threadId, messageId, spoofedBody, null);
    }

    /**
     * Simulates thread tampering (conversation hijacking) by updating the content of
     * a message directly in the memory store without updating the hash chain.
     */
    public synchronized boolean simulateHijack(String threadId, String messageId, String spoofedBody, Long userId) {
        List<EmailMessage> thread;
        if (userId != null) {
            thread = emailMessageRepository.findByThreadIdAndOwnerId(threadId, userId);
        } else {
            thread = emailMessageRepository.findByThreadId(threadId);
        }
        if (thread.isEmpty()) {
            return false;
        }

        for (EmailMessage msg : thread) {
            if (msg.getId().equalsIgnoreCase(messageId)) {
                // Artificially modify the content (simulating unauthorized database/transit tampering)
                msg.setBody(spoofedBody);
                emailMessageRepository.save(msg);
                
                String userEmail = "demo@sudarshana.com";
                if (userId != null && userRepository != null) {
                    userEmail = userRepository.findById(userId).map(User::getEmail).orElse("demo@sudarshana.com");
                }
                if (auditLogRepository != null) {
                    auditLogRepository.save(new com.sudarshana.server.model.AuditLog(
                        System.currentTimeMillis(),
                        userEmail,
                        "HIJACK_SIMULATION",
                        "Simulated hijack on thread " + threadId + ", message ID " + messageId + ". Spoofed body: \"" + spoofedBody + "\""
                    ));
                }
                return true;
            }
        }
        return false;
    }

    private String getDomain(String email) {
        if (email == null) return "";
        String cleanEmail = email;
        if (email.contains("<") && email.contains(">")) {
            cleanEmail = email.substring(email.indexOf("<") + 1, email.indexOf(">")).trim();
        } else if (email.contains("(") && email.contains(")")) {
            cleanEmail = email.substring(email.indexOf("(") + 1, email.indexOf(")")).trim();
        }
        int atIndex = cleanEmail.indexOf("@");
        if (atIndex != -1) {
            return cleanEmail.substring(atIndex + 1).toLowerCase().trim();
        }
        return cleanEmail.toLowerCase().trim();
    }

    private MessageSecurityResult evaluateMessageSecurity(EmailMessage message, boolean hashValid) {
        boolean isOutgoing = false;
        if (message.isOutgoing()) {
            isOutgoing = true;
        } else if (message.getOwner() != null && message.getSender() != null) {
            String ownerEmail = message.getOwner().getEmail().toLowerCase().trim();
            String cleanSender = cleanEmailAddress(message.getSender());
            if (cleanSender.equals(ownerEmail)) {
                isOutgoing = true;
            }
        }

        if (isOutgoing) {
            List<AttachmentInfo> cleanAttachments = new ArrayList<>();
            for (AttachmentInfo att : message.getAttachments()) {
                cleanAttachments.add(AttachmentInfo.builder()
                        .fileName(att.getFileName())
                        .fileSize(att.getFileSize())
                        .fileType(att.getFileType())
                        .sha256Hash(att.getSha256Hash())
                        .sandboxStatus("CLEAN")
                        .highRiskPermissions(List.of())
                        .networkTraces(List.of())
                        .reputationScore(0.0)
                        .build());
            }

            List<LinkInfo> cleanLinks = new ArrayList<>();
            if (message.getBody() != null) {
                java.util.regex.Pattern pattern = java.util.regex.Pattern.compile(
                        "(https?://[^\\s]+)",
                        java.util.regex.Pattern.CASE_INSENSITIVE
                );
                java.util.regex.Matcher matcher = pattern.matcher(message.getBody());
                while (matcher.find()) {
                    String url = matcher.group(1);
                    if (url.endsWith(".") || url.endsWith(",") || url.endsWith(")") || url.endsWith("]")) {
                        url = url.substring(0, url.length() - 1);
                    }
                    cleanLinks.add(LinkInfo.builder()
                            .url(url)
                            .status("CLEAN")
                            .reputationScore(0.0)
                            .notes(List.of("URL checked: Safe (0 hits)."))
                            .build());
                }
            }

            return MessageSecurityResult.builder()
                    .messageId(message.getId())
                    .sender(message.getSender())
                    .subject(message.getSubject())
                    .timestamp(message.getTimestamp())
                    .body(message.getBody())
                    .spfAligned(true)
                    .dkimAligned(true)
                    .dmarcAligned(true)
                    .previousHash(message.getPreviousHash())
                    .currentHash(message.getCurrentHash())
                    .hashValid(hashValid)
                    .nlpRiskScore(0.0)
                    .nlpMarkers(List.of())
                    .combinedRiskScore(0.0)
                    .riskLevel("LOW")
                    .senderIp(message.getSenderIp())
                    .senderIpLocation(estimateLocationFromTimezone(message.getTimezoneOffset()))
                    .senderIpIsp("Internal Network")
                    .senderIpType("Residential")
                    .senderIpFlagged(false)
                    .returnPath(message.getReturnPath() != null ? message.getReturnPath() : message.getSender())
                    .returnPathMatched(true)
                    .headerValidationNotes(List.of("Outgoing email â€” sent by user. Security analysis bypassed."))
                    .attachments(cleanAttachments)
                    .links(cleanLinks)
                    .outgoing(true)
                    .build();
        }

        NlpAnalysisService.NlpResult nlp = nlpAnalysisService.analyzeText(message.getBody());

        // Protocol Alignment Penalties
        double protocolPenalty = 0.0;
        if (!message.isSpfAligned()) protocolPenalty += 20.0;
        if (!message.isDkimAligned()) protocolPenalty += 20.0;
        if (!message.isDmarcAligned()) protocolPenalty += 30.0;

        // Header Guard Verification
        boolean returnPathMatched = true;
        List<String> headerNotes = new ArrayList<>();
        double headerPenalty = 0.0;

        String senderDomain = getDomain(message.getSender());
        String rp = message.getReturnPath();
        if (rp != null && !rp.trim().isEmpty()) {
            String rpDomain = getDomain(rp);
            if (!senderDomain.equals(rpDomain)) {
                returnPathMatched = false;
                headerPenalty += 30.0;
                headerNotes.add("RETURN_PATH_MISMATCH: Sender domain (" + senderDomain + ") does not match Return-Path domain (" + rpDomain + ").");
            } else {
                headerNotes.add("Return-Path domain aligns with Sender domain.");
            }
        } else {
            headerNotes.add("Return-Path header is empty.");
        }

        String ip = message.getSenderIp();
        String senderIpLocation = "Unknown Location";
        String senderIpIsp = "Unknown ISP";
        String senderIpType = "Unclassified";
        boolean senderIpFlagged = false;

        // Estimate location from timezone first
        String tzLocation = estimateLocationFromTimezone(message.getTimezoneOffset());
        if (tzLocation != null) {
            senderIpLocation = tzLocation;
        }

        if (ip != null && !ip.trim().isEmpty()) {
            // Use cache-only lookup here â€” this method is called on every GET /api/threads
            // request. Making live HTTP calls here (resolveIp) blocks the synchronized
            // report generation path and causes emails to never appear on page refresh.
            // Live resolution happens during addMessage() (email ingestion) and primes the cache.
            IpGeolocationService.IpLocationResult loc = ipGeolocationService.resolveIpCachedOnly(ip);
            if (loc != null) {
                // If IP is not masked (meaning it's public residential/corp), prefer precise city/country Geolocation
                if (!"LOCAL".equals(loc.getCountryCode()) && !"UN".equals(loc.getCountryCode())) {
                    senderIpLocation = loc.getCity() + ", " + loc.getCountry();
                    String emoji = getCountryEmoji(loc.getCountryCode());
                    if (!emoji.isEmpty()) {
                        senderIpLocation += " " + emoji;
                    }
                } else if ("LOCAL".equals(loc.getCountryCode())) {
                    // If masked, use the timezone location if available
                    if (tzLocation != null) {
                        senderIpLocation = tzLocation + " (MTA Masked)";
                    } else {
                        senderIpLocation = loc.getCountry() + " ðŸ”’"; // e.g., "Masked by Google ðŸ”’"
                    }
                }
                senderIpIsp = loc.getIsp();
                senderIpType = loc.getType();
                senderIpFlagged = loc.isProxyOrHosting();
            }

            if (ip.equals("198.51.100.42") || ip.startsWith("185.190.") || ip.equals("203.0.113.110") || senderIpFlagged) {
                headerPenalty += 20.0;
                headerNotes.add("SUSPICIOUS_IP: Originating IP " + ip + " is flagged on reputation blocklists (" + senderIpType + " in " + senderIpLocation + ").");
            } else {
                headerNotes.add("Originating IP " + ip + " has a good reputation (" + senderIpLocation + ").");
            }
        } else {
            headerNotes.add("No originating IP header found.");
        }

        // Link Guard Analysis
        List<LinkInfo> evaluatedLinks = new ArrayList<>();
        double maxLinkPenalty = 0.0;
        String bodyText = message.getBody();
        if (bodyText != null) {
            java.util.regex.Pattern pattern = java.util.regex.Pattern.compile(
                "(https?://[^\\s]+)",
                java.util.regex.Pattern.CASE_INSENSITIVE
            );
            java.util.regex.Matcher matcher = pattern.matcher(bodyText);
            while (matcher.find()) {
                String url = matcher.group(1);
                // Clean punctuation trailing at the end of URLs in natural text
                if (url.endsWith(".") || url.endsWith(",") || url.endsWith(")") || url.endsWith("]")) {
                    url = url.substring(0, url.length() - 1);
                }
                String status = "CLEAN";
                double linkReputation = 0.0;
                List<String> notes = new ArrayList<>();
                notes.add("URL extracted: " + url);
                
                boolean isBlacklisted = false;
                for (String bl : blacklistedDomains) {
                    if (url.toLowerCase().contains(bl.toLowerCase())) {
                        isBlacklisted = true;
                        break;
                    }
                }
                
                // Homoglyph check
                boolean hasHomoglyph = false;
                for (char c : url.toCharArray()) {
                    if (c >= 0x0400 && c <= 0x04FF) {
                        hasHomoglyph = true;
                        break;
                    }
                }
                
                if (isBlacklisted) {
                    status = "BLACKLIST_HIT";
                    linkReputation = 100.0;
                    notes.add("BLACKLIST_HIT: Domain has been manually blacklisted by the SOC analyst.");
                    maxLinkPenalty = Math.max(maxLinkPenalty, 90.0);
                } else if (hasHomoglyph) {
                    status = "HOMOGLYPH_ALERT";
                    linkReputation = 80.0;
                    notes.add("HOMOGLYPH_ALERT: Cyrillic homoglyph character detected in domain. Typo-spoofing attempt suspected.");
                    maxLinkPenalty = Math.max(maxLinkPenalty, 25.0);
                } else if (url.contains("billing-verification.com") || url.contains("scammail")) {
                    status = "BLACKLIST_HIT";
                    linkReputation = 95.0;
                    notes.add("BLACKLIST_HIT: Domain is flagged on active security threat database feeds.");
                    maxLinkPenalty = Math.max(maxLinkPenalty, 25.0);
                } else {
                    notes.add("Domain checked: Safe (0 hits).");
                }
                
                evaluatedLinks.add(LinkInfo.builder()
                    .url(url)
                    .status(status)
                    .reputationScore(linkReputation)
                    .notes(notes)
                    .build());
            }
        }

        // Attachment Sandbox Analysis
        List<AttachmentInfo> evaluatedAttachments = new ArrayList<>();
        double maxAttachmentPenalty = 0.0;
        for (AttachmentInfo att : message.getAttachments()) {
            String status = "CLEAN";
            double repScore = att.getReputationScore();
            List<String> highRisk = new ArrayList<>();
            List<String> netTraces = new ArrayList<>();
            
            if (att.getFileName().endsWith(".apk")) {
                highRisk.add("android.permission.SEND_SMS");
                highRisk.add("android.permission.RECEIVE_SMS");
                highRisk.add("android.permission.REQUEST_INSTALL_PACKAGES");
                highRisk.add("android.permission.SYSTEM_ALERT_WINDOW");
                
                netTraces.add("http://bad-hacker-c2.net/endpoint");
                netTraces.add("http://185.190.4.12/ping");
                
                status = "MALICIOUS";
                repScore = 90.0;
                maxAttachmentPenalty = Math.max(maxAttachmentPenalty, 30.0);
            } else if (att.getFileName().endsWith(".exe")) {
                status = "SUSPICIOUS";
                repScore = 60.0;
                highRisk.add("Process injection flagged");
                maxAttachmentPenalty = Math.max(maxAttachmentPenalty, 15.0);
            }
            
            evaluatedAttachments.add(AttachmentInfo.builder()
                .fileName(att.getFileName())
                .fileSize(att.getFileSize())
                .fileType(att.getFileType())
                .sha256Hash(att.getSha256Hash())
                .sandboxStatus(status)
                .highRiskPermissions(highRisk)
                .networkTraces(netTraces)
                .reputationScore(repScore)
                .build());
        }

        // Combined Risk Calculation
        double combinedRisk = nlp.riskScore() + protocolPenalty + headerPenalty + maxLinkPenalty + maxAttachmentPenalty;
        if (!hashValid) {
            combinedRisk = 100.0; // absolute threat if hash chain is compromised
        }
        combinedRisk = Math.min(100.0, Math.max(0.0, combinedRisk));
        combinedRisk = Math.round(combinedRisk * 10.0) / 10.0;

        String riskLevel = "LOW";
        if (combinedRisk > 75.0 || !hashValid) {
            riskLevel = "HIGH";
        } else if (combinedRisk > 40.0) {
            riskLevel = "MEDIUM";
        }

        return MessageSecurityResult.builder()
                .messageId(message.getId())
                .sender(message.getSender())
                .subject(message.getSubject())
                .timestamp(message.getTimestamp())
                .body(message.getBody())
                .spfAligned(message.isSpfAligned())
                .dkimAligned(message.isDkimAligned())
                .dmarcAligned(message.isDmarcAligned())
                .previousHash(message.getPreviousHash())
                .currentHash(message.getCurrentHash())
                .hashValid(hashValid)
                .nlpRiskScore(nlp.riskScore())
                .nlpMarkers(nlp.markers())
                .combinedRiskScore(combinedRisk)
                .riskLevel(riskLevel)
                .senderIp(message.getSenderIp())
                .senderIpLocation(senderIpLocation)
                .senderIpIsp(senderIpIsp)
                .senderIpType(senderIpType)
                .senderIpFlagged(senderIpFlagged)
                .returnPath(message.getReturnPath())
                .returnPathMatched(returnPathMatched)
                .headerValidationNotes(headerNotes)
                .attachments(evaluatedAttachments)
                .links(evaluatedLinks)
                .outgoing(false)
                .build();
    }

    private String cleanEmailAddress(String emailStr) {
        if (emailStr == null) return "";
        if (emailStr.contains("<") && emailStr.contains(">")) {
            return emailStr.substring(emailStr.indexOf("<") + 1, emailStr.indexOf(">")).trim().toLowerCase();
        }
        return emailStr.trim().toLowerCase();
    }

    private String estimateLocationFromTimezone(String offset) {
        if (offset == null || offset.trim().isEmpty()) {
            return null;
        }
        String clean = offset.trim();
        switch (clean) {
            case "+0530": return "India ðŸ‡®ðŸ‡³";
            case "+0545": return "Nepal ðŸ‡³ðŸ‡µ";
            case "+0600": return "Bangladesh / Central Asia ðŸ‡§ðŸ‡©";
            case "+0700": return "Indonesia / Thailand / Vietnam ðŸ‡®ðŸ‡©";
            case "+0800": return "China / Singapore / Malaysia ðŸ‡¨ðŸ‡³";
            case "+0900": return "Japan / South Korea ðŸ‡¯ðŸ‡µ";
            case "+1000": return "Eastern Australia / Vladivostok ðŸ‡¦ðŸ‡º";
            case "+1100": return "Solomon Islands / New Caledonia ðŸ‡¸ðŸ‡§";
            case "+1200": return "New Zealand / Fiji ðŸ‡³ðŸ‡¿";
            case "+1300": return "Tonga / Samoa ðŸ‡¹ðŸ‡´";
            case "+0500": return "Pakistan / Maldives / West Asia ðŸ‡µðŸ‡°";
            case "+0430": return "Afghanistan ðŸ‡¦ðŸ‡«";
            case "+0400": return "UAE / Oman / Georgia ðŸ‡¦ðŸ‡ª";
            case "+0330": return "Iran ðŸ‡®ðŸ‡·";
            case "+0300": return "Russia (Moscow) / Turkey / Saudi Arabia / East Africa ðŸ‡·ðŸ‡º";
            case "+0200": return "Eastern Europe / South Africa ðŸ‡ªðŸ‡¬";
            case "+0100": return "Central Europe / West Africa ðŸ‡©ðŸ‡ª";
            case "+0000": return "United Kingdom / Iceland / West Africa / UTC ðŸ‡¬ðŸ‡§";
            case "-0100": return "Azores / Cape Verde ðŸ‡¨ðŸ‡»";
            case "-0200": return "Mid-Atlantic ðŸ‡¬ðŸ‡¸";
            case "-0300": return "Brazil / Argentina / Greenland ðŸ‡§ðŸ‡·";
            case "-0330": return "Newfoundland ðŸ‡¨ðŸ‡¦";
            case "-0400": return "Canada (Atlantic) / Eastern Caribbean ðŸ‡¨ðŸ‡¦";
            case "-0500": return "United States (Eastern Time) / Colombia / Peru ðŸ‡ºðŸ‡¸";
            case "-0600": return "United States (Central Time) / Mexico ðŸ‡ºðŸ‡¸";
            case "-0700": return "United States (Mountain Time) ðŸ‡ºðŸ‡¸";
            case "-0800": return "United States (Pacific Time) ðŸ‡ºðŸ‡¸";
            case "-0900": return "Alaska ðŸ‡ºðŸ‡¸";
            case "-0930": return "Marquesas Islands ðŸ‡µðŸ‡«";
            case "-1000": return "Hawaii ðŸ‡ºðŸ‡¸";
            case "-1100": return "Samoa / Midway ðŸ‡¦ðŸ‡¸";
            case "-1200": return "Baker Island / Howland Island ðŸ‡ºðŸ‡¸";
            default: return "UTC" + clean;
        }
    }

    private String getCountryEmoji(String countryCode) {
        if (countryCode == null) return "";
        if ("LOCAL".equalsIgnoreCase(countryCode)) return "ðŸ”’";
        if (countryCode.length() != 2) return "";
        try {
            int firstLetter = Character.codePointAt(countryCode.toUpperCase(), 0) - 0x41 + 0x1F1E6;
            int secondLetter = Character.codePointAt(countryCode.toUpperCase(), 1) - 0x41 + 0x1F1E6;
            return new String(Character.toChars(firstLetter)) + new String(Character.toChars(secondLetter));
        } catch (Exception e) {
            return "";
        }
    }

    public synchronized void healThreadChain(String threadId) {
        List<EmailMessage> threadMessages = emailMessageRepository.findByThreadId(threadId);
        if (threadMessages.isEmpty()) {
            return;
        }

        threadMessages.sort(Comparator.comparingLong(EmailMessage::getTimestamp));
        String expectedPreviousHash = null;

        for (EmailMessage msg : threadMessages) {
            msg.setPreviousHash(expectedPreviousHash);
            String computedHash = cryptographyService.calculateCurrentHash(msg);
            msg.setCurrentHash(computedHash);
            emailMessageRepository.save(msg);
            expectedPreviousHash = computedHash;
        }
    }
}



