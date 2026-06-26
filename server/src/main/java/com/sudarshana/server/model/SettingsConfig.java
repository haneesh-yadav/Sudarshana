package com.sudarshana.server.model;

import jakarta.persistence.*;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "user_settings")
public class SettingsConfig {

    @Id
    @Column(name = "user_id")
    private Long userId;

    private String name;
    private String email;
    private String timezone;
    private String dmarcMode;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_settings_dmarc_exceptions", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "exception")
    private List<String> dmarcExceptions;

    private int combinedRiskThreshold;
    private int nlpRiskThreshold;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_settings_integrations", joinColumns = @JoinColumn(name = "user_id"))
    @MapKeyColumn(name = "integration_name")
    @Column(name = "status")
    private Map<String, String> integrationStatuses;

    public SettingsConfig() {}

    public SettingsConfig(Long userId, String name, String email, String timezone, String dmarcMode,
                          List<String> dmarcExceptions, int combinedRiskThreshold, int nlpRiskThreshold,
                          Map<String, String> integrationStatuses) {
        this.userId = userId;
        this.name = name;
        this.email = email;
        this.timezone = timezone;
        this.dmarcMode = dmarcMode;
        this.dmarcExceptions = dmarcExceptions;
        this.combinedRiskThreshold = combinedRiskThreshold;
        this.nlpRiskThreshold = nlpRiskThreshold;
        this.integrationStatuses = integrationStatuses;
    }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getTimezone() { return timezone; }
    public void setTimezone(String timezone) { this.timezone = timezone; }

    public String getDmarcMode() { return dmarcMode; }
    public void setDmarcMode(String dmarcMode) { this.dmarcMode = dmarcMode; }

    public List<String> getDmarcExceptions() { return dmarcExceptions; }
    public void setDmarcExceptions(List<String> dmarcExceptions) { this.dmarcExceptions = dmarcExceptions; }

    public int getCombinedRiskThreshold() { return combinedRiskThreshold; }
    public void setCombinedRiskThreshold(int combinedRiskThreshold) { this.combinedRiskThreshold = combinedRiskThreshold; }

    public int getNlpRiskThreshold() { return nlpRiskThreshold; }
    public void setNlpRiskThreshold(int nlpRiskThreshold) { this.nlpRiskThreshold = nlpRiskThreshold; }

    public Map<String, String> getIntegrationStatuses() { return integrationStatuses; }
    public void setIntegrationStatuses(Map<String, String> integrationStatuses) { this.integrationStatuses = integrationStatuses; }
}

