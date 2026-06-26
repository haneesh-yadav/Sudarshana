package com.sudarshana.server.model;

import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "attachments")
public class AttachmentInfo {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String fileName;
    private String fileSize;
    private String fileType;
    private String sha256Hash;
    private String sandboxStatus; // CLEAN, SUSPICIOUS, MALICIOUS

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "attachment_permissions", joinColumns = @JoinColumn(name = "attachment_id"))
    @Column(name = "permission")
    private List<String> highRiskPermissions;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "attachment_network_traces", joinColumns = @JoinColumn(name = "attachment_id"))
    @Column(name = "trace")
    private List<String> networkTraces;

    private double reputationScore;

    public AttachmentInfo() {}

    public AttachmentInfo(String fileName, String fileSize, String fileType, String sha256Hash,
                          String sandboxStatus, List<String> highRiskPermissions, List<String> networkTraces,
                          double reputationScore) {
        this.fileName = fileName;
        this.fileSize = fileSize;
        this.fileType = fileType;
        this.sha256Hash = sha256Hash;
        this.sandboxStatus = sandboxStatus;
        this.highRiskPermissions = highRiskPermissions;
        this.networkTraces = networkTraces;
        this.reputationScore = reputationScore;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public String getFileSize() { return fileSize; }
    public void setFileSize(String fileSize) { this.fileSize = fileSize; }

    public String getFileType() { return fileType; }
    public void setFileType(String fileType) { this.fileType = fileType; }

    public String getSha256Hash() { return sha256Hash; }
    public void setSha256Hash(String sha256Hash) { this.sha256Hash = sha256Hash; }

    public String getSandboxStatus() { return sandboxStatus; }
    public void setSandboxStatus(String sandboxStatus) { this.sandboxStatus = sandboxStatus; }

    public List<String> getHighRiskPermissions() { return highRiskPermissions; }
    public void setHighRiskPermissions(List<String> highRiskPermissions) { this.highRiskPermissions = highRiskPermissions; }

    public List<String> getNetworkTraces() { return networkTraces; }
    public void setNetworkTraces(List<String> networkTraces) { this.networkTraces = networkTraces; }

    public double getReputationScore() { return reputationScore; }
    public void setReputationScore(double reputationScore) { this.reputationScore = reputationScore; }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String fileName;
        private String fileSize;
        private String fileType;
        private String sha256Hash;
        private String sandboxStatus;
        private List<String> highRiskPermissions;
        private List<String> networkTraces;
        private double reputationScore;

        public Builder fileName(String fileName) { this.fileName = fileName; return this; }
        public Builder fileSize(String fileSize) { this.fileSize = fileSize; return this; }
        public Builder fileType(String fileType) { this.fileType = fileType; return this; }
        public Builder sha256Hash(String sha256Hash) { this.sha256Hash = sha256Hash; return this; }
        public Builder sandboxStatus(String sandboxStatus) { this.sandboxStatus = sandboxStatus; return this; }
        public Builder highRiskPermissions(List<String> highRiskPermissions) { this.highRiskPermissions = highRiskPermissions; return this; }
        public Builder networkTraces(List<String> networkTraces) { this.networkTraces = networkTraces; return this; }
        public Builder reputationScore(double reputationScore) { this.reputationScore = reputationScore; return this; }

        public AttachmentInfo build() {
            return new AttachmentInfo(fileName, fileSize, fileType, sha256Hash, sandboxStatus, highRiskPermissions, networkTraces, reputationScore);
        }
    }
}

