package com.sudarshana.server.model;

import jakarta.persistence.*;

@Entity
@Table(name = "blacklisted_domains")
public class BlacklistedDomain {
    @Id
    private String domain;

    private long blacklistedAt;
    private String blacklistedBy;

    public BlacklistedDomain() {}

    public BlacklistedDomain(String domain, long blacklistedAt, String blacklistedBy) {
        this.domain = domain;
        this.blacklistedAt = blacklistedAt;
        this.blacklistedBy = blacklistedBy;
    }

    public String getDomain() { return domain; }
    public void setDomain(String domain) { this.domain = domain; }

    public long getBlacklistedAt() { return blacklistedAt; }
    public void setBlacklistedAt(long blacklistedAt) { this.blacklistedAt = blacklistedAt; }

    public String getBlacklistedBy() { return blacklistedBy; }
    public void setBlacklistedBy(String blacklistedBy) { this.blacklistedBy = blacklistedBy; }
}

