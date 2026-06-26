package com.sudarshana.server.model;

import java.util.List;
import java.util.ArrayList;

public class MessageSecurityResult {
    private String messageId;
    private String sender;
    private String subject;
    private String body;
    private boolean spfAligned;
    private boolean dkimAligned;
    private boolean dmarcAligned;
    private long timestamp;
    private String previousHash;
    private String currentHash;
    private boolean hashValid;
    private double nlpRiskScore;
    private List<String> nlpMarkers;
    private double combinedRiskScore;
    private String riskLevel;
    private String senderIp;
    private String senderIpLocation;
    private String senderIpIsp;
    private String senderIpType;
    private boolean senderIpFlagged;
    private String returnPath;
    private boolean returnPathMatched;
    private List<String> headerValidationNotes;
    private List<AttachmentInfo> attachments = new ArrayList<>();
    private List<LinkInfo> links = new ArrayList<>();
    private boolean outgoing;

    public MessageSecurityResult() {}

    public MessageSecurityResult(String messageId, String sender, String subject, String body, boolean spfAligned, boolean dkimAligned,
                                 boolean dmarcAligned, long timestamp, String previousHash, String currentHash, boolean hashValid,
                                 double nlpRiskScore, List<String> nlpMarkers, double combinedRiskScore, String riskLevel,
                                 String senderIp, String returnPath, boolean returnPathMatched, List<String> headerValidationNotes,
                                 List<AttachmentInfo> attachments, List<LinkInfo> links) {
        this(messageId, sender, subject, body, spfAligned, dkimAligned, dmarcAligned, timestamp, previousHash, currentHash, hashValid, nlpRiskScore, nlpMarkers, combinedRiskScore, riskLevel, senderIp, returnPath, returnPathMatched, headerValidationNotes, attachments, links, false);
    }

    public MessageSecurityResult(String messageId, String sender, String subject, String body, boolean spfAligned, boolean dkimAligned,
                                 boolean dmarcAligned, long timestamp, String previousHash, String currentHash, boolean hashValid,
                                 double nlpRiskScore, List<String> nlpMarkers, double combinedRiskScore, String riskLevel,
                                 String senderIp, String returnPath, boolean returnPathMatched, List<String> headerValidationNotes,
                                 List<AttachmentInfo> attachments, List<LinkInfo> links, boolean outgoing) {
        this.messageId = messageId;
        this.sender = sender;
        this.subject = subject;
        this.body = body;
        this.spfAligned = spfAligned;
        this.dkimAligned = dkimAligned;
        this.dmarcAligned = dmarcAligned;
        this.timestamp = timestamp;
        this.previousHash = previousHash;
        this.currentHash = currentHash;
        this.hashValid = hashValid;
        this.nlpRiskScore = nlpRiskScore;
        this.nlpMarkers = nlpMarkers;
        this.combinedRiskScore = combinedRiskScore;
        this.riskLevel = riskLevel;
        this.senderIp = senderIp;
        this.returnPath = returnPath;
        this.returnPathMatched = returnPathMatched;
        this.headerValidationNotes = headerValidationNotes;
        this.attachments = attachments != null ? attachments : new ArrayList<>();
        this.links = links != null ? links : new ArrayList<>();
        this.outgoing = outgoing;
    }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
    public long getTimestamp() { return timestamp; }
    public void setTimestamp(long timestamp) { this.timestamp = timestamp; }

    public String getMessageId() { return messageId; }
    public void setMessageId(String messageId) { this.messageId = messageId; }
    public String getSender() { return sender; }
    public void setSender(String sender) { this.sender = sender; }
    public String getBody() { return body; }
    public void setBody(String body) { this.body = body; }
    public boolean isSpfAligned() { return spfAligned; }
    public void setSpfAligned(boolean spfAligned) { this.spfAligned = spfAligned; }
    public boolean isDkimAligned() { return dkimAligned; }
    public void setDkimAligned(boolean dkimAligned) { this.dkimAligned = dkimAligned; }
    public boolean isDmarcAligned() { return dmarcAligned; }
    public void setDmarcAligned(boolean dmarcAligned) { this.dmarcAligned = dmarcAligned; }
    public String getPreviousHash() { return previousHash; }
    public void setPreviousHash(String previousHash) { this.previousHash = previousHash; }
    public String getCurrentHash() { return currentHash; }
    public void setCurrentHash(String currentHash) { this.currentHash = currentHash; }
    public boolean isHashValid() { return hashValid; }
    public void setHashValid(boolean hashValid) { this.hashValid = hashValid; }
    public double getNlpRiskScore() { return nlpRiskScore; }
    public void setNlpRiskScore(double nlpRiskScore) { this.nlpRiskScore = nlpRiskScore; }
    public List<String> getNlpMarkers() { return nlpMarkers; }
    public void setNlpMarkers(List<String> nlpMarkers) { this.nlpMarkers = nlpMarkers; }
    public double getCombinedRiskScore() { return combinedRiskScore; }
    public void setCombinedRiskScore(double combinedRiskScore) { this.combinedRiskScore = combinedRiskScore; }
    public String getRiskLevel() { return riskLevel; }
    public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }
    public String getSenderIp() { return senderIp; }
    public void setSenderIp(String senderIp) { this.senderIp = senderIp; }
    public String getSenderIpLocation() { return senderIpLocation; }
    public void setSenderIpLocation(String senderIpLocation) { this.senderIpLocation = senderIpLocation; }
    public String getSenderIpIsp() { return senderIpIsp; }
    public void setSenderIpIsp(String senderIpIsp) { this.senderIpIsp = senderIpIsp; }
    public String getSenderIpType() { return senderIpType; }
    public void setSenderIpType(String senderIpType) { this.senderIpType = senderIpType; }
    public boolean isSenderIpFlagged() { return senderIpFlagged; }
    public void setSenderIpFlagged(boolean senderIpFlagged) { this.senderIpFlagged = senderIpFlagged; }
    public String getReturnPath() { return returnPath; }
    public void setReturnPath(String returnPath) { this.returnPath = returnPath; }
    public boolean isReturnPathMatched() { return returnPathMatched; }
    public void setReturnPathMatched(boolean returnPathMatched) { this.returnPathMatched = returnPathMatched; }
    public List<String> getHeaderValidationNotes() { return headerValidationNotes; }
    public void setHeaderValidationNotes(List<String> headerValidationNotes) { this.headerValidationNotes = headerValidationNotes; }
    public List<AttachmentInfo> getAttachments() { return attachments; }
    public void setAttachments(List<AttachmentInfo> attachments) { this.attachments = attachments; }
    public List<LinkInfo> getLinks() { return links; }
    public void setLinks(List<LinkInfo> links) { this.links = links; }
    public boolean isOutgoing() { return outgoing; }
    public void setOutgoing(boolean outgoing) { this.outgoing = outgoing; }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String messageId;
        private String sender;
        private String subject;
        private String body;
        private boolean spfAligned;
        private boolean dkimAligned;
        private boolean dmarcAligned;
        private long timestamp;
        private String previousHash;
        private String currentHash;
        private boolean hashValid;
        private double nlpRiskScore;
        private List<String> nlpMarkers;
        private double combinedRiskScore;
        private String riskLevel;
        private String senderIp;
        private String senderIpLocation;
        private String senderIpIsp;
        private String senderIpType;
        private boolean senderIpFlagged;
        private String returnPath;
        private boolean returnPathMatched;
        private List<String> headerValidationNotes;
        private List<AttachmentInfo> attachments = new ArrayList<>();
        private List<LinkInfo> links = new ArrayList<>();
        private boolean outgoing;

        public Builder messageId(String messageId) { this.messageId = messageId; return this; }
        public Builder sender(String sender) { this.sender = sender; return this; }
        public Builder subject(String subject) { this.subject = subject; return this; }
        public Builder body(String body) { this.body = body; return this; }
        public Builder spfAligned(boolean spfAligned) { this.spfAligned = spfAligned; return this; }
        public Builder dkimAligned(boolean dkimAligned) { this.dkimAligned = dkimAligned; return this; }
        public Builder dmarcAligned(boolean dmarcAligned) { this.dmarcAligned = dmarcAligned; return this; }
        public Builder timestamp(long timestamp) { this.timestamp = timestamp; return this; }
        public Builder previousHash(String previousHash) { this.previousHash = previousHash; return this; }
        public Builder currentHash(String currentHash) { this.currentHash = currentHash; return this; }
        public Builder hashValid(boolean hashValid) { this.hashValid = hashValid; return this; }
        public Builder nlpRiskScore(double nlpRiskScore) { this.nlpRiskScore = nlpRiskScore; return this; }
        public Builder nlpMarkers(List<String> nlpMarkers) { this.nlpMarkers = nlpMarkers; return this; }
        public Builder combinedRiskScore(double combinedRiskScore) { this.combinedRiskScore = combinedRiskScore; return this; }
        public Builder riskLevel(String riskLevel) { this.riskLevel = riskLevel; return this; }
        public Builder senderIp(String senderIp) { this.senderIp = senderIp; return this; }
        public Builder senderIpLocation(String senderIpLocation) { this.senderIpLocation = senderIpLocation; return this; }
        public Builder senderIpIsp(String senderIpIsp) { this.senderIpIsp = senderIpIsp; return this; }
        public Builder senderIpType(String senderIpType) { this.senderIpType = senderIpType; return this; }
        public Builder senderIpFlagged(boolean senderIpFlagged) { this.senderIpFlagged = senderIpFlagged; return this; }
        public Builder returnPath(String returnPath) { this.returnPath = returnPath; return this; }
        public Builder returnPathMatched(boolean returnPathMatched) { this.returnPathMatched = returnPathMatched; return this; }
        public Builder headerValidationNotes(List<String> headerValidationNotes) { this.headerValidationNotes = headerValidationNotes; return this; }
        public Builder attachments(List<AttachmentInfo> attachments) { this.attachments = attachments; return this; }
        public Builder links(List<LinkInfo> links) { this.links = links; return this; }
        public Builder outgoing(boolean outgoing) { this.outgoing = outgoing; return this; }

        public MessageSecurityResult build() {
            MessageSecurityResult res = new MessageSecurityResult(messageId, sender, subject, body, spfAligned, dkimAligned, dmarcAligned, timestamp, previousHash, currentHash, hashValid, nlpRiskScore, nlpMarkers, combinedRiskScore, riskLevel, senderIp, returnPath, returnPathMatched, headerValidationNotes, attachments, links, outgoing);
            res.setSenderIpLocation(senderIpLocation);
            res.setSenderIpIsp(senderIpIsp);
            res.setSenderIpType(senderIpType);
            res.setSenderIpFlagged(senderIpFlagged);
            return res;
        }
    }
}

