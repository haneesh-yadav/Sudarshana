package com.sudarshana.server.service;

import com.sudarshana.server.model.AttachmentInfo;
import com.sudarshana.server.model.EmailMessage;
import com.sudarshana.server.model.User;
import com.sudarshana.server.repository.EmailMessageRepository;
import com.sudarshana.server.repository.UserRepository;
import jakarta.mail.*;
import jakarta.mail.internet.MimeMultipart;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.security.MessageDigest;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class EmailSyncService {

    private static final Logger logger = LoggerFactory.getLogger(EmailSyncService.class);

    private final UserRepository userRepository;
    private final EmailMessageRepository emailMessageRepository;
    private final SudarshanaService SudarshanaService;
    private final GoogleOauthService googleOauthService;

    @Value("${sudarshana.sync.limit:100}")
    private int syncLimit;

    @Autowired
    public EmailSyncService(UserRepository userRepository,
                            EmailMessageRepository emailMessageRepository,
                            SudarshanaService SudarshanaService,
                            GoogleOauthService googleOauthService) {
        this.userRepository = userRepository;
        this.emailMessageRepository = emailMessageRepository;
        this.SudarshanaService = SudarshanaService;
        this.googleOauthService = googleOauthService;
    }

    // Disabled PostConstruct to prevent deleting cached emails on every server startup.
    // This allows the local cache to persist and avoids slow full IMAP re-syncs.
    public void clearUserEmailsOnStartup() {
        logger.info("Clearing local cached emails for re-sync on startup to apply new IP parser rules...");
        try {
            Optional<User> demoUserOpt = userRepository.findByEmail("demo@sudarshana.com");
            if (demoUserOpt.isPresent()) {
                Long demoUserId = demoUserOpt.get().getId();
                List<EmailMessage> all = emailMessageRepository.findAll();
                for (EmailMessage msg : all) {
                    if (msg.getOwner() != null && !msg.getOwner().getId().equals(demoUserId)) {
                        emailMessageRepository.delete(msg);
                    }
                }
            } else {
                List<EmailMessage> all = emailMessageRepository.findAll();
                for (EmailMessage msg : all) {
                    if (msg.getOwner() != null) {
                        emailMessageRepository.delete(msg);
                    }
                }
            }
        } catch (Exception e) {
            logger.error("Failed to clear cached user emails on startup: {}", e.getMessage(), e);
        }
    }

    /**
     * Runs every 30 seconds to fetch emails for all users with configured IMAP credentials.
     */
    @Scheduled(fixedDelay = 30000)
    public void syncEmails() {
        List<User> users = userRepository.findAll();
        for (User user : users) {
            boolean hasPassword = user.getEmailPassword() != null && !user.getEmailPassword().isEmpty();
            boolean hasOauth = user.getOauth2RefreshToken() != null && !user.getOauth2RefreshToken().isEmpty();

            if (!hasPassword && !hasOauth) {
                continue; // Skip user if not configured
            }

            if (user.getImapHost() == null || user.getImapHost().isEmpty() ||
                user.getEmailUser() == null || user.getEmailUser().isEmpty()) {
                continue; 
            }

            try {
                syncUserEmails(user);
            } catch (Exception e) {
                logger.error("Failed to sync emails for user {}: {}", user.getEmail(), e.getMessage(), e);
            }
        }
    }

    private void syncUserEmails(User user) throws Exception {
        logger.debug("Starting email sync for user: {}", user.getEmail());

        Properties properties = new Properties();
        properties.put("mail.store.protocol", "imaps");
        properties.put("mail.imaps.host", user.getImapHost());
        properties.put("mail.imaps.port", String.valueOf(user.getImapPort()));
        properties.put("mail.imaps.ssl.enable", "true");
        properties.put("mail.imaps.connectiontimeout", "5000");
        properties.put("mail.imaps.timeout", "5000");

        boolean useOauth = user.getOauth2RefreshToken() != null && !user.getOauth2RefreshToken().isEmpty();
        String authSecret;

        if (useOauth) {
            authSecret = googleOauthService.getAccessToken(user.getOauth2RefreshToken());
            properties.put("mail.imaps.sasl.enable", "true");
            properties.put("mail.imaps.sasl.mechanisms", "XOAUTH2");
            properties.put("mail.imaps.auth.login.disable", "true");
            properties.put("mail.imaps.auth.plain.disable", "true");
        } else {
            authSecret = user.getEmailPassword();
        }

        Session emailSession = Session.getInstance(properties);
        Store store = null;
        Folder inbox = null;

        try {
            store = emailSession.getStore("imaps");
            store.connect(user.getImapHost(), user.getImapPort(), user.getEmailUser(), authSecret);

            try {
                String folderName = "INBOX";
                if (user.getImapHost() != null && user.getImapHost().toLowerCase().contains("gmail.com")) {
                    folderName = "[Gmail]/All Mail";
                }
                inbox = store.getFolder(folderName);
                inbox.open(Folder.READ_ONLY);
            } catch (FolderNotFoundException fnfe) {
                logger.warn("Gmail All Mail folder not found or not exposed in IMAP. Falling back to INBOX.");
                inbox = store.getFolder("INBOX");
                inbox.open(Folder.READ_ONLY);
            }

            int messageCount = inbox.getMessageCount();
            if (messageCount == 0) {
                return;
            }

            // Sync the last N messages for a quick sync (configurable limit)
            int start = Math.max(1, messageCount - (syncLimit - 1));
            int end = messageCount;
            Message[] messages = inbox.getMessages(start, end);

            // Pre-fetch basic header metadata for all fetched messages in a single IMAP call.
            // This eliminates the N+1 network request overhead during the synchronization loop.
            FetchProfile fp = new FetchProfile();
            fp.add(FetchProfile.Item.ENVELOPE);
            fp.add("Message-ID");
            fp.add("Authentication-Results");
            fp.add("Received");
            fp.add("Date");
            fp.add("Return-Path");
            inbox.fetch(messages, fp);

            Set<String> activeMessageIds = new HashSet<>();
            for (Message msg : messages) {
                try {
                    String[] messageIdHeaders = msg.getHeader("Message-ID");
                    String messageId = (messageIdHeaders != null && messageIdHeaders.length > 0) ? messageIdHeaders[0] : null;
                    if (messageId == null || messageId.isEmpty()) {
                        messageId = "INGEST-" + Math.abs((msg.getSubject() + "_" + msg.getSentDate()).hashCode());
                    }
                    activeMessageIds.add(messageId);
                    processMessage(user, msg);
                } catch (Exception e) {
                    logger.error("Error processing individual message for user {}: {}", user.getEmail(), e.getMessage(), e);
                }
            }

            // Sync deleted/shifted emails:
            // Find all emails currently stored in the DB for this user
            List<EmailMessage> stored = emailMessageRepository.findByOwnerId(user.getId());
            List<EmailMessage> toDelete = new ArrayList<>();
            Set<String> affectedThreads = new HashSet<>();

            for (EmailMessage dbMsg : stored) {
                // Never delete outgoing replies or sent emails from the dashboard!
                if (dbMsg.isOutgoing()) {
                    continue;
                }
                if (!activeMessageIds.contains(dbMsg.getId())) {
                    toDelete.add(dbMsg);
                    affectedThreads.add(dbMsg.getThreadId());
                }
            }

            if (!toDelete.isEmpty()) {
                emailMessageRepository.deleteAll(toDelete);
                logger.info("Deleted {} orphaned/deleted emails from local DB for user {}", toDelete.size(), user.getEmail());

                // Heal the cryptographic chains for all affected threads
                for (String threadId : affectedThreads) {
                    SudarshanaService.healThreadChain(threadId);
                }
            }

        } finally {
            if (inbox != null && inbox.isOpen()) {
                inbox.close(false);
            }
            if (store != null) {
                store.close();
            }
        }
    }

    private void processMessage(User user, Message msg) throws Exception {
        // Extract or generate Message-ID
        String[] messageIdHeaders = msg.getHeader("Message-ID");
        String messageId = (messageIdHeaders != null && messageIdHeaders.length > 0) ? messageIdHeaders[0] : null;
        if (messageId == null || messageId.isEmpty()) {
            // Fallback unique ID based on hash of details to keep it deterministic if rerun
            messageId = "INGEST-" + Math.abs((msg.getSubject() + "_" + msg.getSentDate()).hashCode());
        }

        // Check if already exists in DB
        if (emailMessageRepository.existsById(messageId)) {
            return;
        }

        logger.info("Ingesting new email for user {}: Message-ID={}", user.getEmail(), messageId);

        String subject = msg.getSubject();
        if (subject == null) {
            subject = "(No Subject)";
        }

        Address[] senders = msg.getFrom();
        String sender = (senders != null && senders.length > 0) ? senders[0].toString() : "unknown";

        Address[] recipients = msg.getRecipients(Message.RecipientType.TO);
        String recipient = (recipients != null && recipients.length > 0) ? recipients[0].toString() : user.getEmail();

        Date sentDate = msg.getSentDate();
        long timestamp = (sentDate != null) ? sentDate.getTime() : System.currentTimeMillis();

        // Extract body text
        String body = getTextFromMessage(msg);
        body = stripReplyQuotes(body);

        // Security Alignment Details (Authentication-Results header)
        boolean spfAligned = true;
        boolean dkimAligned = true;
        boolean dmarcAligned = true;

        String[] authResults = msg.getHeader("Authentication-Results");
        if (authResults != null && authResults.length > 0) {
            String authHeader = String.join(" ", authResults).toLowerCase();
            if (authHeader.contains("spf=fail") || authHeader.contains("spf=softfail")) {
                spfAligned = false;
            }
            if (authHeader.contains("dkim=fail")) {
                dkimAligned = false;
            }
            if (authHeader.contains("dmarc=fail")) {
                dmarcAligned = false;
            }
        }

        // Extract sender IP
        String[] receivedHeaders = msg.getHeader("Received");
        String senderIp = extractOriginatingIp(receivedHeaders);

        // Timezone Offset from Date header
        String[] dateHeaders = msg.getHeader("Date");
        String timezoneOffset = extractTimezoneOffset(dateHeaders);

        // Return Path
        String returnPath = "";
        String[] returnPathHeaders = msg.getHeader("Return-Path");
        if (returnPathHeaders != null && returnPathHeaders.length > 0) {
            returnPath = returnPathHeaders[0];
            if (returnPath.startsWith("<") && returnPath.endsWith(">")) {
                returnPath = returnPath.substring(1, returnPath.length() - 1).trim();
            }
        }

        // Extract attachments
        List<AttachmentInfo> attachments = new ArrayList<>();
        if (msg.getContent() instanceof MimeMultipart) {
            extractAttachments((MimeMultipart) msg.getContent(), attachments);
        }

        // Resolve external contact to find or create the thread
        String cleanSender = cleanEmailAddress(sender);
        String cleanRecipient = cleanEmailAddress(recipient);
        String userEmail = user.getEmail().toLowerCase().trim();

        // Contact is the external person
        String contact = cleanSender.equals(userEmail) ? cleanRecipient : cleanSender;

        List<EmailMessage> existingMessages = emailMessageRepository.findByUserAndContact(user.getId(), contact);
        String threadId;
        if (!existingMessages.isEmpty()) {
            threadId = existingMessages.get(0).getThreadId();
        } else {
            // Create a brand new Thread ID
            threadId = "TH-" + (10000 + new Random().nextInt(90000));
        }

        // Build email object
        EmailMessage emailMessage = EmailMessage.builder()
                .id(messageId)
                .sender(sender)
                .recipient(recipient)
                .subject(subject)
                .body(body)
                .spfAligned(spfAligned)
                .dkimAligned(dkimAligned)
                .dmarcAligned(dmarcAligned)
                .timestamp(timestamp)
                .senderIp(senderIp)
                .returnPath(returnPath)
                .timezoneOffset(timezoneOffset)
                .attachments(attachments)
                .owner(user)
                .outgoing(cleanSender.equals(userEmail))
                .build();

        // Add message to SudarshanaService (it handles hashing chain link and evaluations)
        SudarshanaService.addMessage(threadId, emailMessage);
    }

    private String cleanEmailAddress(String emailStr) {
        if (emailStr == null) return "";
        if (emailStr.contains("<") && emailStr.contains(">")) {
            return emailStr.substring(emailStr.indexOf("<") + 1, emailStr.indexOf(">")).trim().toLowerCase();
        }
        return emailStr.trim().toLowerCase();
    }

    private String getTextFromMessage(Message message) throws Exception {
        if (message.isMimeType("text/plain")) {
            return message.getContent().toString();
        } else if (message.isMimeType("text/html")) {
            return htmlToText(message.getContent().toString());
        } else if (message.isMimeType("multipart/*")) {
            MimeMultipart mimeMultipart = (MimeMultipart) message.getContent();
            return getTextFromMimeMultipart(mimeMultipart);
        }
        return "";
    }

    private String getTextFromMimeMultipart(MimeMultipart mimeMultipart) throws Exception {
        // If it's multipart/alternative, we should only extract one preferred format to prevent duplication
        if (mimeMultipart.getContentType().toLowerCase().contains("multipart/alternative")) {
            // Prefer HTML, fall back to plain text
            String htmlContent = null;
            String plainContent = null;
            int count = mimeMultipart.getCount();
            for (int i = 0; i < count; i++) {
                BodyPart part = mimeMultipart.getBodyPart(i);
                if (part.isMimeType("text/html")) {
                    htmlContent = part.getContent().toString();
                } else if (part.isMimeType("text/plain")) {
                    plainContent = part.getContent().toString();
                }
            }
            if (htmlContent != null) {
                return htmlToText(htmlContent);
            } else if (plainContent != null) {
                return plainContent;
            }
            return "";
        }

        StringBuilder result = new StringBuilder();
        int count = mimeMultipart.getCount();
        for (int i = 0; i < count; i++) {
            BodyPart bodyPart = mimeMultipart.getBodyPart(i);
            if (bodyPart.isMimeType("text/plain")) {
                result.append(bodyPart.getContent().toString());
            } else if (bodyPart.isMimeType("text/html")) {
                result.append(htmlToText(bodyPart.getContent().toString()));
            } else if (bodyPart.getContent() instanceof MimeMultipart) {
                result.append(getTextFromMimeMultipart((MimeMultipart) bodyPart.getContent()));
            }
        }
        return result.toString();
    }

    private String htmlToText(String html) {
        if (html == null) return "";
        
        // Remove style blocks
        html = Pattern.compile("<style[^>]*>[\\s\\S]*?</style>", Pattern.CASE_INSENSITIVE).matcher(html).replaceAll("");
        
        // Remove script blocks
        html = Pattern.compile("<script[^>]*>[\\s\\S]*?</script>", Pattern.CASE_INSENSITIVE).matcher(html).replaceAll("");
        
        // Remove head section entirely if present
        html = Pattern.compile("<head[^>]*>[\\s\\S]*?</head>", Pattern.CASE_INSENSITIVE).matcher(html).replaceAll("");
        
        // Insert newlines for block-level elements
        html = Pattern.compile("<br\\s*/?>", Pattern.CASE_INSENSITIVE).matcher(html).replaceAll("\n");
        html = Pattern.compile("</p>", Pattern.CASE_INSENSITIVE).matcher(html).replaceAll("\n");
        html = Pattern.compile("</div>", Pattern.CASE_INSENSITIVE).matcher(html).replaceAll("\n");
        html = Pattern.compile("</tr>", Pattern.CASE_INSENSITIVE).matcher(html).replaceAll("\n");
        html = Pattern.compile("</h[1-6]>", Pattern.CASE_INSENSITIVE).matcher(html).replaceAll("\n");
        
        // Strip remaining HTML tags
        String text = html.replaceAll("<[^>]*>", " ");
        
        // Replace common HTML entities
        text = text.replace("&nbsp;", " ")
                   .replace("&amp;", "&")
                   .replace("&lt;", "<")
                   .replace("&gt;", ">")
                   .replace("&quot;", "\"")
                   .replace("&#39;", "'");
        
        // Normalize whitespace but preserve newlines
        String[] lines = text.split("\\r?\\n");
        StringBuilder sb = new StringBuilder();
        for (String line : lines) {
            String trimmed = line.replaceAll("[ \\t]+", " ").trim();
            if (!trimmed.isEmpty()) {
                sb.append(trimmed).append("\n");
            }
        }
        
        return sb.toString().trim();
    }

    private String stripReplyQuotes(String text) {
        if (text == null) return "";
        
        // Pattern 1: On <date>, <sender> wrote:
        Pattern pattern1 = Pattern.compile("(?i)(?:^|\\r?\\n|\\s)On\\s+(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|\\d{1,2}|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[\\s\\S]*?\\s+wrote\\s*:");
        Matcher matcher1 = pattern1.matcher(text);
        if (matcher1.find()) {
            text = text.substring(0, matcher1.start());
        }

        // Pattern 2: -----Original Message-----
        Pattern pattern2 = Pattern.compile("(?i)(?:^|\\r?\\n|\\s)-+\\s*Original\\s+Message\\s*-+");
        Matcher matcher2 = pattern2.matcher(text);
        if (matcher2.find()) {
            text = text.substring(0, matcher2.start());
        }

        // Pattern 3: From: ... To: ... Sent: ... Subject: ...
        Pattern pattern3 = Pattern.compile("(?i)(?:^|\\r?\\n|\\s)From\\s*:\\s*.*?(?:\\r?\\n|\\s)To\\s*:\\s*", Pattern.DOTALL);
        Matcher matcher3 = pattern3.matcher(text);
        if (matcher3.find()) {
            text = text.substring(0, matcher3.start());
        }

        // Pattern 4: Outlook style separator line
        Pattern pattern4 = Pattern.compile("(?i)(?:^|\\r?\\n|\\s)________________________________");
        Matcher matcher4 = pattern4.matcher(text);
        if (matcher4.find()) {
            text = text.substring(0, matcher4.start());
        }

        return text.trim();
    }

    private void extractAttachments(MimeMultipart mimeMultipart, List<AttachmentInfo> attachments) throws Exception {
        int count = mimeMultipart.getCount();
        for (int i = 0; i < count; i++) {
            BodyPart bodyPart = mimeMultipart.getBodyPart(i);
            if (Part.ATTACHMENT.equalsIgnoreCase(bodyPart.getDisposition()) ||
                (bodyPart.getFileName() != null && !bodyPart.getFileName().trim().isEmpty())) {

                String fileName = bodyPart.getFileName();
                String fileType = getFileExtension(fileName);
                int size = bodyPart.getSize();
                String fileSizeStr = formatSize(size);

                byte[] bytes;
                try (InputStream is = bodyPart.getInputStream();
                     ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
                    byte[] buffer = new byte[4096];
                    int len;
                    while ((len = is.read(buffer)) != -1) {
                        baos.write(buffer, 0, len);
                    }
                    bytes = baos.toByteArray();
                }
                String sha256 = calculateSha256(bytes);

                attachments.add(AttachmentInfo.builder()
                        .fileName(fileName)
                        .fileSize(fileSizeStr)
                        .fileType(fileType)
                        .sha256Hash(sha256)
                        .reputationScore(50.0)
                        .build());
            } else if (bodyPart.getContent() instanceof MimeMultipart) {
                extractAttachments((MimeMultipart) bodyPart.getContent(), attachments);
            }
        }
    }

    private String getFileExtension(String fileName) {
        if (fileName == null || !fileName.contains(".")) return "UNKNOWN";
        return fileName.substring(fileName.lastIndexOf(".") + 1).toUpperCase();
    }

    private String formatSize(int bytes) {
        if (bytes < 1024) return bytes + " B";
        int exp = (int) (Math.log(bytes) / Math.log(1024));
        char pre = "KMGTPE".charAt(exp - 1);
        return String.format(Locale.US, "%.1f %cB", bytes / Math.pow(1024, exp), pre);
    }

    private String calculateSha256(byte[] data) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(data);
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            return "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
        }
    }

    private String extractOriginatingIp(String[] receivedHeaders) {
        if (receivedHeaders == null || receivedHeaders.length == 0) {
            return "";
        }
        
        // Loop from oldest (last) to newest (first) Received header
        for (int i = receivedHeaders.length - 1; i >= 0; i--) {
            String header = receivedHeaders[i];
            List<String> ips = extractIps(header);
            for (String ip : ips) {
                if (isPublicIp(ip)) {
                    return ip;
                }
            }
        }
        
        // Fallback: return the first IP found anywhere in the oldest headers
        for (int i = receivedHeaders.length - 1; i >= 0; i--) {
            List<String> ips = extractIps(receivedHeaders[i]);
            if (!ips.isEmpty()) {
                return ips.get(0);
            }
        }
        
        return "";
    }

    private List<String> extractIps(String text) {
        List<String> ips = new ArrayList<>();
        // Strict IPv4 regex rejecting leading zeros to prevent matching timezone/date timestamps like 06.23.06.17
        Pattern pattern = Pattern.compile("\\b(?:(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)\\.){3}(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)\\b");
        Matcher matcher = pattern.matcher(text);
        while (matcher.find()) {
            ips.add(matcher.group());
        }
        return ips;
    }

    private boolean isPublicIp(String ip) {
        try {
            String[] parts = ip.split("\\.");
            if (parts.length != 4) return false;
            int p1 = Integer.parseInt(parts[0]);
            int p2 = Integer.parseInt(parts[1]);
            
            // Loopback / localhost
            if (p1 == 127) return false;
            // Class A private
            if (p1 == 10) return false;
            // Class B private (172.16.0.0 - 172.31.255.255)
            if (p1 == 172 && (p2 >= 16 && p2 <= 31)) return false;
            // Class C private (192.168.0.0 - 192.168.255.255)
            if (p1 == 192 && p2 == 168) return false;
            
            return true;
        } catch (NumberFormatException e) {
            return false;
        }
    }

    private String extractTimezoneOffset(String[] dateHeaders) {
        if (dateHeaders == null || dateHeaders.length == 0) {
            return null;
        }
        String dateHeader = dateHeaders[0];
        Pattern p = Pattern.compile("([+-]\\d{4})");
        Matcher m = p.matcher(dateHeader);
        if (m.find()) {
            return m.group(1);
        }
        if (dateHeader.contains("UT") || dateHeader.contains("GMT") || dateHeader.contains("Z")) {
            return "+0000";
        }
        return null;
    }
}



