package com.sudarshana.server.model;

import jakarta.persistence.*;
import java.util.List;
import java.util.ArrayList;

@Entity
@Table(name = "email_messages")
public class EmailMessage {
    @Id
    private String id;
    private String threadId;
    private String sender;
    private String recipient;
    private String subject;
    
    @Column(columnDefinition = "TEXT")
    private String body;
    
    private boolean spfAligned;
    private boolean dkimAligned;
    private boolean dmarcAligned;
    private long timestamp;
    private String previousHash;
    private Boolean outgoing = false;
    private String currentHash;
    private String senderIp;
    private String returnPath;
    private String timezoneOffset;
    
    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JoinColumn(name = "message_id")
    private List<AttachmentInfo> attachments = new ArrayList<>();
    
    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JoinColumn(name = "message_id")
    private List<LinkInfo> links = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User owner;

    public EmailMessage() {}

    public User getOwner() { return owner; }
    public void setOwner(User owner) { this.owner = owner; }

    public EmailMessage(String id, String threadId, String sender, String recipient, String subject, String body,
                        boolean spfAligned, boolean dkimAligned, boolean dmarcAligned, long timestamp,
                        String previousHash, String currentHash, String senderIp, String returnPath,
                        List<AttachmentInfo> attachments, List<LinkInfo> links) {
        this.id = id;
        this.threadId = threadId;
        this.sender = sender;
        this.recipient = recipient;
        this.subject = subject;
        this.body = body;
        this.spfAligned = spfAligned;
        this.dkimAligned = dkimAligned;
        this.dmarcAligned = dmarcAligned;
        this.timestamp = timestamp;
        this.previousHash = previousHash;
        this.currentHash = currentHash;
        this.senderIp = senderIp;
        this.returnPath = returnPath;
        this.attachments = attachments != null ? attachments : new ArrayList<>();
        this.links = links != null ? links : new ArrayList<>();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getThreadId() { return threadId; }
    public void setThreadId(String threadId) { this.threadId = threadId; }
    public String getSender() { return sender; }
    public void setSender(String sender) { this.sender = sender; }
    public String getRecipient() { return recipient; }
    public void setRecipient(String recipient) { this.recipient = recipient; }
    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
    public String getBody() { return body; }
    public void setBody(String body) { this.body = body; }
    public boolean isSpfAligned() { return spfAligned; }
    public void setSpfAligned(boolean spfAligned) { this.spfAligned = spfAligned; }
    public boolean isDkimAligned() { return dkimAligned; }
    public void setDkimAligned(boolean dkimAligned) { this.dkimAligned = dkimAligned; }
    public boolean isDmarcAligned() { return dmarcAligned; }
    public void setDmarcAligned(boolean dmarcAligned) { this.dmarcAligned = dmarcAligned; }
    public boolean isOutgoing() { return outgoing != null && outgoing; }
    public void setOutgoing(Boolean outgoing) { this.outgoing = outgoing; }
    public long getTimestamp() { return timestamp; }
    public void setTimestamp(long timestamp) { this.timestamp = timestamp; }
    public String getPreviousHash() { return previousHash; }
    public void setPreviousHash(String previousHash) { this.previousHash = previousHash; }
    public String getCurrentHash() { return currentHash; }
    public void setCurrentHash(String currentHash) { this.currentHash = currentHash; }
    public String getSenderIp() { return senderIp; }
    public void setSenderIp(String senderIp) { this.senderIp = senderIp; }
    public String getReturnPath() { return returnPath; }
    public void setReturnPath(String returnPath) { this.returnPath = returnPath; }
    public String getTimezoneOffset() { return timezoneOffset; }
    public void setTimezoneOffset(String timezoneOffset) { this.timezoneOffset = timezoneOffset; }
    public List<AttachmentInfo> getAttachments() { return attachments; }
    public void setAttachments(List<AttachmentInfo> attachments) { this.attachments = attachments; }
    public List<LinkInfo> getLinks() { return links; }
    public void setLinks(List<LinkInfo> links) { this.links = links; }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String id;
        private String threadId;
        private String sender;
        private String recipient;
        private String subject;
        private String body;
        private boolean spfAligned;
        private boolean dkimAligned;
        private boolean dmarcAligned;
        private long timestamp;
        private Boolean outgoing = false;
        private String previousHash;
        private String currentHash;
        private String senderIp;
        private String returnPath;
        private String timezoneOffset;
        private List<AttachmentInfo> attachments = new ArrayList<>();
        private List<LinkInfo> links = new ArrayList<>();
        private User owner;

        public Builder id(String id) { this.id = id; return this; }
        public Builder threadId(String threadId) { this.threadId = threadId; return this; }
        public Builder sender(String sender) { this.sender = sender; return this; }
        public Builder recipient(String recipient) { this.recipient = recipient; return this; }
        public Builder subject(String subject) { this.subject = subject; return this; }
        public Builder body(String body) { this.body = body; return this; }
        public Builder spfAligned(boolean spfAligned) { this.spfAligned = spfAligned; return this; }
        public Builder dkimAligned(boolean dkimAligned) { this.dkimAligned = dkimAligned; return this; }
        public Builder dmarcAligned(boolean dmarcAligned) { this.dmarcAligned = dmarcAligned; return this; }
        public Builder timestamp(long timestamp) { this.timestamp = timestamp; return this; }
        public Builder outgoing(Boolean outgoing) { this.outgoing = outgoing; return this; }
        public Builder previousHash(String previousHash) { this.previousHash = previousHash; return this; }
        public Builder currentHash(String currentHash) { this.currentHash = currentHash; return this; }
        public Builder senderIp(String senderIp) { this.senderIp = senderIp; return this; }
        public Builder returnPath(String returnPath) { this.returnPath = returnPath; return this; }
        public Builder timezoneOffset(String timezoneOffset) { this.timezoneOffset = timezoneOffset; return this; }
        public Builder attachments(List<AttachmentInfo> attachments) { this.attachments = attachments; return this; }
        public Builder links(List<LinkInfo> links) { this.links = links; return this; }
        public Builder owner(User owner) { this.owner = owner; return this; }

        public EmailMessage build() {
            EmailMessage msg = new EmailMessage(id, threadId, sender, recipient, subject, body, spfAligned, dkimAligned, dmarcAligned, timestamp, previousHash, currentHash, senderIp, returnPath, attachments, links);
            msg.setOwner(owner);
            msg.setTimezoneOffset(timezoneOffset);
            msg.setOutgoing(outgoing);
            return msg;
        }
    }
}

