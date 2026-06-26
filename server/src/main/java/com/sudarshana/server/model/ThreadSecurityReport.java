package com.sudarshana.server.model;

import java.util.List;

public class ThreadSecurityReport {
    private String threadId;
    private boolean chainValid;
    private int messagesAnalyzedCount;
    private String riskLevel;
    private int brokenAtIndex;
    private List<MessageSecurityResult> messages;

    public ThreadSecurityReport() {}

    public ThreadSecurityReport(String threadId, boolean chainValid, int messagesAnalyzedCount, String riskLevel,
                                int brokenAtIndex, List<MessageSecurityResult> messages) {
        this.threadId = threadId;
        this.chainValid = chainValid;
        this.messagesAnalyzedCount = messagesAnalyzedCount;
        this.riskLevel = riskLevel;
        this.brokenAtIndex = brokenAtIndex;
        this.messages = messages;
    }

    public String getThreadId() { return threadId; }
    public void setThreadId(String threadId) { this.threadId = threadId; }
    public boolean isChainValid() { return chainValid; }
    public void setChainValid(boolean chainValid) { this.chainValid = chainValid; }
    public int getMessagesAnalyzedCount() { return messagesAnalyzedCount; }
    public void setMessagesAnalyzedCount(int messagesAnalyzedCount) { this.messagesAnalyzedCount = messagesAnalyzedCount; }
    public String getRiskLevel() { return riskLevel; }
    public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }
    public int getBrokenAtIndex() { return brokenAtIndex; }
    public void setBrokenAtIndex(int brokenAtIndex) { this.brokenAtIndex = brokenAtIndex; }
    public List<MessageSecurityResult> getMessages() { return messages; }
    public void setMessages(List<MessageSecurityResult> messages) { this.messages = messages; }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String threadId;
        private boolean chainValid;
        private int messagesAnalyzedCount;
        private String riskLevel;
        private int brokenAtIndex;
        private List<MessageSecurityResult> messages;

        public Builder threadId(String threadId) { this.threadId = threadId; return this; }
        public Builder chainValid(boolean chainValid) { this.chainValid = chainValid; return this; }
        public Builder messagesAnalyzedCount(int messagesAnalyzedCount) { this.messagesAnalyzedCount = messagesAnalyzedCount; return this; }
        public Builder riskLevel(String riskLevel) { this.riskLevel = riskLevel; return this; }
        public Builder brokenAtIndex(int brokenAtIndex) { this.brokenAtIndex = brokenAtIndex; return this; }
        public Builder messages(List<MessageSecurityResult> messages) { this.messages = messages; return this; }

        public ThreadSecurityReport build() {
            return new ThreadSecurityReport(threadId, chainValid, messagesAnalyzedCount, riskLevel, brokenAtIndex, messages);
        }
    }
}

