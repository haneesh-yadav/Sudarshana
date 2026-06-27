package com.sudarshana.server.model;

import jakarta.persistence.*;

@Entity
@Table(name = "notifications")
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;
    private long timestamp;
    private String icon;
    private String tone;
    private String title;

    @Column(columnDefinition = "TEXT")
    private String detail;

    private boolean read;

    public Notification() {}

    public Notification(Long userId, long timestamp, String icon, String tone, String title, String detail, boolean read) {
        this.userId = userId;
        this.timestamp = timestamp;
        this.icon = icon;
        this.tone = tone;
        this.title = title;
        this.detail = detail;
        this.read = read;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public long getTimestamp() { return timestamp; }
    public void setTimestamp(long timestamp) { this.timestamp = timestamp; }

    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }

    public String getTone() { return tone; }
    public void setTone(String tone) { this.tone = tone; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDetail() { return detail; }
    public void setDetail(String detail) { this.detail = detail; }

    public boolean isRead() { return read; }
    public void setRead(boolean read) { this.read = read; }
}
