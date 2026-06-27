package com.sudarshana.server.model;

import java.util.List;

public class HijackScenario {
    private String id;
    private String name;
    private String description;
    private String sender;
    private String subject;
    private String body;

    public HijackScenario() {}

    public HijackScenario(String id, String name, String description, String sender, String subject, String body) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.sender = sender;
        this.subject = subject;
        this.body = body;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getSender() { return sender; }
    public void setSender(String sender) { this.sender = sender; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public String getBody() { return body; }
    public void setBody(String body) { this.body = body; }

    public static List<HijackScenario> defaults() {
        return List.of(
            new HijackScenario(
                "wire-fraud",
                "Wire Fraud / Payment Diversion",
                "Attacker spoofs a trusted vendor and redirects an invoice payment to a fraudulent account.",
                "accounting@trusted-vendor.com",
                "URGENT: Updated Payment Details for Invoice #INV-2847",
                "Hi,\n\nPlease note that our banking details have changed effective immediately. All future payments should be sent to:\n\nBank: First National\nAccount: 4829-1037-4455\nRouting: 021000089\n\nThis change is due to our recent merger. Please update your records and confirm receipt.\n\nRegards,\nAccounts Payable"
            ),
            new HijackScenario(
                "ceo-fraud",
                "CEO / BEC Fraud",
                "Attacker impersonates the CEO requesting an urgent confidential wire transfer.",
                "ceo@company.com",
                "Confidential - Immediate Action Required",
                "I need you to process an urgent wire transfer of $48,500 to the attached account details. This is time-sensitive and confidential — do not discuss with anyone else. I'm in meetings all day so please handle this directly.\n\nLet me know once it's done.\n\nThanks,\nCEO"
            ),
            new HijackScenario(
                "account-takeover",
                "Account Takeover",
                "Compromised employee account sends malicious requests to colleagues.",
                "hr-manager@company.com",
                "Employee Verification - Action Required",
                "Hi Team,\n\nWe're conducting an urgent employee verification audit. Please click the link below to confirm your details:\n\nhttps://verify-company-portal.com/employee-check?token=x8k2m9\n\nThis must be completed by end of day. Failure to comply will result in temporary account suspension.\n\nThank you,\nHR Department"
            ),
            new HijackScenario(
                "malware",
                "Malware Distribution",
                "Infected attachment disguised as a routine document.",
                "ops@internal.sudarshana.io",
                "Monthly Financial Report - October",
                "Team,\n\nPlease find attached the monthly financial summary for your review.\n\nKey highlights:\n- Revenue: $2.4M (up 12%)\n- Operating costs: $1.8M\n- Net margin: 25%\n\nThe full breakdown is in the attached spreadsheet. Please review before Friday's board meeting.\n\nBest,\nFinance Team"
            )
        );
    }
}
