package com.sudarshana.server.model;

import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "links")
public class LinkInfo {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String url;
    private String status; // CLEAN, HOMOGLYPH_ALERT, TYPOSQUATTING, BLACKLIST_HIT
    private double reputationScore;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "link_notes", joinColumns = @JoinColumn(name = "link_id"))
    @Column(name = "note")
    private List<String> notes;

    public LinkInfo() {}

    public LinkInfo(String url, String status, double reputationScore, List<String> notes) {
        this.url = url;
        this.status = status;
        this.reputationScore = reputationScore;
        this.notes = notes;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public double getReputationScore() { return reputationScore; }
    public void setReputationScore(double reputationScore) { this.reputationScore = reputationScore; }

    public List<String> getNotes() { return notes; }
    public void setNotes(List<String> notes) { this.notes = notes; }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String url;
        private String status;
        private double reputationScore;
        private List<String> notes;

        public Builder url(String url) { this.url = url; return this; }
        public Builder status(String status) { this.status = status; return this; }
        public Builder reputationScore(double reputationScore) { this.reputationScore = reputationScore; return this; }
        public Builder notes(List<String> notes) { this.notes = notes; return this; }

        public LinkInfo build() {
            return new LinkInfo(url, status, reputationScore, notes);
        }
    }
}

