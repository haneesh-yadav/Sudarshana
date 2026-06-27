package com.sudarshana.server.model;

import jakarta.persistence.*;

@Entity
@Table(name = "blocked_senders")
public class BlockedSender {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String senderEmail;

    @Column(nullable = false)
    private String action;

    private long createdAt;
    private String createdBy;

    public BlockedSender() {}

    public BlockedSender(String senderEmail, String action, long createdAt, String createdBy) {
        this.senderEmail = senderEmail;
        this.action = action;
        this.createdAt = createdAt;
        this.createdBy = createdBy;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getSenderEmail() { return senderEmail; }
    public void setSenderEmail(String senderEmail) { this.senderEmail = senderEmail; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public long getCreatedAt() { return createdAt; }
    public void setCreatedAt(long createdAt) { this.createdAt = createdAt; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
}
