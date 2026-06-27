package com.sudarshana.server.model;

import jakarta.persistence.*;

@Entity
@Table(name = "reports")
public class Report {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;
    private long generatedAt;
    private String name;
    private String type;
    private String period;
    private String format;
    private String size;
    private String status;

    @Column(columnDefinition = "TEXT")
    private String summary;

    @Column(columnDefinition = "TEXT")
    private String data;

    public Report() {}

    public Report(Long userId, long generatedAt, String name, String type, String period, String format, String size, String status, String summary, String data) {
        this.userId = userId;
        this.generatedAt = generatedAt;
        this.name = name;
        this.type = type;
        this.period = period;
        this.format = format;
        this.size = size;
        this.status = status;
        this.summary = summary;
        this.data = data;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public long getGeneratedAt() { return generatedAt; }
    public void setGeneratedAt(long generatedAt) { this.generatedAt = generatedAt; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getPeriod() { return period; }
    public void setPeriod(String period) { this.period = period; }

    public String getFormat() { return format; }
    public void setFormat(String format) { this.format = format; }

    public String getSize() { return size; }
    public void setSize(String size) { this.size = size; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }

    public String getData() { return data; }
    public void setData(String data) { this.data = data; }
}
