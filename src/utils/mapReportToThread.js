function formatRelativeTime(timestamp) {
  if (!timestamp) return "Just now";
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  const diffWeek = Math.floor(diffDay / 7);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  if (diffWeek < 4) return `${diffWeek}w ago`;
  return new Date(timestamp).toLocaleDateString();
}

export default function mapReportToThread(report) {
  const lastMsg = report.messages[report.messages.length - 1];

  let status = "Verified";
  if (!report.chainValid) {
    status = "Critical";
  } else if (report.riskLevel === "HIGH") {
    status = "Critical";
  } else if (report.riskLevel === "MEDIUM") {
    status = "Flagged";
  } else if (report.messages.some(m => !m.spfAligned || !m.dkimAligned || !m.dmarcAligned || m.returnPathMatched === false || (m.headerValidationNotes && m.headerValidationNotes.some(note => note.includes("SUSPICIOUS_IP"))))) {
    status = "Quarantined";
  }

  const participantsSet = new Set();
  report.messages.forEach(m => {
    participantsSet.add(m.sender);
  });
  const participants = Array.from(participantsSet);

  let domain = "";
  if (lastMsg && lastMsg.sender) {
    const parts = lastMsg.sender.split("@");
    domain = parts[parts.length - 1];
  }

  const maxRisk = report.messages.reduce((max, m) => Math.max(max, m.combinedRiskScore), 0);
  const trust = Math.round(100 - maxRisk);

  const maxNlpRisk = report.messages.reduce((max, m) => Math.max(max, m.nlpRiskScore), 0);
  const nlp = Math.round(100 - maxNlpRisk);

  let header = 100;
  if (lastMsg) {
    let penalty = 0;
    if (!lastMsg.spfAligned) penalty += 20;
    if (!lastMsg.dkimAligned) penalty += 20;
    if (!lastMsg.dmarcAligned) penalty += 30;
    if (lastMsg.returnPathMatched === false) penalty += 30;
    if (lastMsg.headerValidationNotes && lastMsg.headerValidationNotes.some(note => note.includes("SUSPICIOUS_IP"))) penalty += 20;

    header = Math.max(10, 100 - penalty);
  }

  let maxLinkRisk = 0;
  report.messages.forEach(m => {
    if (m.links) {
      m.links.forEach(l => {
        maxLinkRisk = Math.max(maxLinkRisk, l.reputationScore);
      });
    }
  });
  const linkGuard = Math.round(100 - maxLinkRisk);

  let maxAttRisk = 0;
  report.messages.forEach(m => {
    if (m.attachments) {
      m.attachments.forEach(a => {
        maxAttRisk = Math.max(maxAttRisk, a.reputationScore);
      });
    }
  });
  const attachmentSandbox = Math.round(100 - maxAttRisk);

  const last = formatRelativeTime(lastMsg?.timestamp);

  let flag = null;
  if (!report.chainValid) {
    flag = "Cryptographic chain validation failed.";
  }

  return {
    id: report.threadId,
    subject: lastMsg ? lastMsg.subject || "Subject" : "Subject",
    participants: participants,
    domain: domain,
    status: status,
    trust: trust,
    nlp: nlp,
    header: header,
    linkGuard: linkGuard,
    attachmentSandbox: attachmentSandbox,
    chain: report.chainValid ? "intact" : "broken",
    messages: report.messages.length,
    last: last,
    flag: flag,
    rawReport: report
  };
}
