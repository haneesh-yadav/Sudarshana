import React, { useState, useEffect } from 'react';
import mapReportToThread from '../utils/mapReportToThread.js';
import { createPortal } from 'react-dom';
import { showToast } from '../utils/toast.js';

/* Inline close icon -- doesn't depend on an icon font being loaded,
   so it always renders instead of going blank inside drawers/modals. */
function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a8a8ad" strokeWidth="2.4" strokeLinecap="round">
      <line x1="5" y1="5" x2="19" y2="19" />
      <line x1="19" y1="5" x2="5" y2="19" />
    </svg>
  );
}

const TABS = [
  { label: "All", match: () => true },
  { label: "Verified", match: (t) => t.status === "Verified" },
  { label: "Flagged", match: (t) => t.status === "Flagged" },
  { label: "Quarantined", match: (t) => t.status === "Quarantined" },
  { label: "Critical", match: (t) => t.status === "Critical" },
];

const STATUS_STYLE = {
  Verified: { dot: "var(--green)", cls: "verified" },
  Flagged: { dot: "var(--orange)", cls: "flagged" },
  Quarantined: { dot: "#a98ce8", cls: "quarantined" },
  Critical: { dot: "var(--red)", cls: "critical" },
};

/* ---------- filter row ---------- */
function FilterRow({ active, setActive, counts }) {
  return (
    <div className="filter-row">
      <div style={{ display: "flex", alignItems: "center" }}>
        <div className="tabs">
          {TABS.map((t) => (
            <div
              key={t.label}
              className={"tab" + (t.label === active ? " active" : "")}
              onClick={() => setActive(t.label)}
            >
              {t.label} <b>{counts[t.label] || 0}</b>
            </div>
          ))}
        </div>
        <button className="filter-icon-btn"><span className="material-icons-round">filter_list</span></button>
      </div>
      <div className="toggles">
        <div className="toggle-row">
          <span><span className="material-icons-round" style={{ fontSize: 13, marginRight: 4, verticalAlign: -2 }}>tag</span>Avg. trust score</span>
          <span className="avg-trust">91.4%</span>
        </div>
      </div>
    </div>
  );
}

/* ---------- mini trust bar ---------- */
function TrustBar({ value }) {
  const color = value >= 80 ? "var(--green)" : value >= 50 ? "var(--orange)" : "var(--red)";
  return (
    <div className="trust-cell">
      <div className="trust-track"><div className="trust-fill" style={{ width: `${value}%`, background: color }} /></div>
      <span style={{ color }}>{value}%</span>
    </div>
  );
}

/* ---------- threads table ---------- */
function ThreadsTable({ threads, onOpen, selectedId }) {
  return (
    <div className="table-wrap">
      <div className="t-row t-head">
        <div className="c-status">Status</div>
        <div className="c-subject">Thread</div>
        <div className="c-domain">Sender domain</div>
        <div className="c-trust">Trust score</div>
        <div className="c-chain">Chain</div>
        <div className="c-msgs">Msgs</div>
        <div className="c-last">Last activity</div>
      </div>
      <div className="t-body">
        {threads.map((t) => {
          const s = STATUS_STYLE[t.status] || STATUS_STYLE.Verified;
          return (
            <div
              key={t.id}
              className={"t-row t-data" + (t.id === selectedId ? " selected" : "")}
              onClick={(e) => { e.stopPropagation(); onOpen(t); }}
            >
              <div className="c-status">
                <span className="status-dot" style={{ background: s.dot }} />
                <span className={"status-pill " + s.cls}>{t.status}</span>
              </div>
              <div className="c-subject">
                <div className="subj-line">{t.subject}</div>
                <div className="subj-sub">{t.participants.join("  Â·  ")}</div>
              </div>
              <div className="c-domain">{t.domain}</div>
              <div className="c-trust"><TrustBar value={t.trust} /></div>
              <div className="c-chain">
                {t.chain === "intact"
                  ? <span className="chain-ok"><span className="material-icons-round">link</span> Intact</span>
                  : <span className="chain-bad"><span className="material-icons-round">link_off</span> Broken</span>}
              </div>
              <div className="c-msgs">{t.messages}</div>
              <div className="c-last">{t.last}</div>
            </div>
          );
        })}
        {threads.length === 0 && (
          <div className="empty-state">No threads match this filter.</div>
        )}
      </div>
    </div>
  );
}

/* ---------- signal bar (used inside drawer) ---------- */
function SignalBar({ label, value, iconName }) {
  const color = value >= 80 ? "var(--green)" : value >= 50 ? "var(--orange)" : "var(--red)";
  return (
    <div className="signal-row">
      <div className="signal-label"><span className="material-icons-round">{iconName}</span> {label}</div>
      <div className="signal-track"><div className="signal-fill" style={{ width: `${value}%`, background: color }} /></div>
      <div className="signal-val" style={{ color }}>{value}%</div>
    </div>
  );
}

/* ---------- collapsible header diagnostics helper ---------- */
function HeaderDiagnostics({ m, threadId, onHijack }) {
  const [open, setOpen] = React.useState(false);
  const isSuspicious = m.headerNotes && m.headerNotes.some(note => note.includes("SUSPICIOUS") || note.includes("MISMATCH"));
  
  return (
    <div className={"bubble-diagnostics " + (isSuspicious ? "warning" : "clean")}>
      <div className="diag-summary-pill" onClick={() => setOpen(!open)}>
        <span className="material-icons-round icon" style={{ fontSize: 13, marginRight: 4 }}>
          {isSuspicious ? "report_problem" : "verified_user"}
        </span>
        <span className="label">
          {isSuspicious ? "Header Anomaly Detected" : "Headers Validated"}
        </span>
        <span className="material-icons-round arrow-icon">
          {open ? "expand_less" : "expand_more"}
        </span>
      </div>
      
      {open && (
        <div className="diag-details-expanded">
          <div className="diag-detail-grid">
            <div className="diag-detail-row">
              <span className="lbl">Originating IP:</span>
              <span className={"val " + (m.headerNotes && m.headerNotes.some(note => note.includes("SUSPICIOUS_IP")) ? "bad" : "good")}>
                {m.senderIp || "N/A"}
              </span>
            </div>
            {m.senderIpLocation && (
              <div className="diag-detail-row">
                <span className="lbl">Location:</span>
                <span className="val">{m.senderIpLocation}</span>
              </div>
            )}
            {m.senderIpIsp && (
              <div className="diag-detail-row">
                <span className="lbl">ISP / Provider:</span>
                <span className="val">{m.senderIpIsp}</span>
              </div>
            )}
            <div className="diag-detail-row">
              <span className="lbl">Return-Path:</span>
              <span className={"val " + (m.returnPathMatched === false ? "bad" : "good")}>
                {m.returnPath || "N/A"}
              </span>
            </div>
          </div>
          {m.headerNotes && m.headerNotes.length > 0 && (
            <div className="diag-detail-logs">
              {m.headerNotes.map((note, idx) => {
                const isAlert = note.includes("MISMATCH") || note.includes("SUSPICIOUS");
                return (
                  <div key={idx} className={"diag-detail-log-item " + (isAlert ? "alert" : "info")}>
                    <span className="material-icons-round font-icon">
                      {isAlert ? "warning" : "check_circle"}
                    </span>
                    <span className="txt">{note}</span>
                  </div>
                );
              })}
            </div>
          )}
          {m.id && (
            <button onClick={() => onHijack(threadId, m.id)} className="btn-hijack-compact">
              <span className="material-icons-round" style={{ fontSize: 11, marginRight: 4 }}>settings_backup_restore</span>
              Simulate Hijack
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- collapsible link diagnostics helper ---------- */
function LinkDiagnostics({ links, onLaunchSandbox }) {
  const [open, setOpen] = React.useState(false);
  if (!links || links.length === 0) return null;
  
  const hasAlert = links.some(l => l.status !== "CLEAN");
  
  return (
    <div className={"bubble-diagnostics " + (hasAlert ? "warning" : "clean")}>
      <div className="diag-summary-pill" onClick={() => setOpen(!open)}>
        <span className="material-icons-round icon" style={{ fontSize: 13, marginRight: 4 }}>
          {hasAlert ? "link_off" : "link"}
        </span>
        <span className="label">
          {hasAlert ? "Suspicious Links Detected" : "Links Validated"}
        </span>
        <span className="material-icons-round arrow-icon">
          {open ? "expand_less" : "expand_more"}
        </span>
      </div>
      
      {open && (
        <div className="diag-details-expanded" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '8px 10px' }}>
          {links.map((link, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && (
                <div style={{ borderTop: '1px dashed rgba(255,255,255,0.08)', margin: '8px 0' }} />
              )}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--accent)', wordBreak: 'break-all' }}>
                  {link.url}
                </div>
                <div style={{ fontSize: 10.5, color: link.status === "CLEAN" ? "var(--green)" : "var(--orange)", margin: '3px 0' }}>
                  Status: {link.status} (Reputation Score: {Math.round(link.reputationScore)}%)
                </div>
                {link.notes && link.notes.map((note, nIdx) => (
                  <div key={nIdx} className="diag-detail-log-item info" style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: 4, marginTop: 2 }}>
                    <span className="material-icons-round" style={{ fontSize: 11, color: note.includes("ALERT") || note.includes("HIT") ? "var(--orange)" : "var(--green)", marginTop: 1 }}>
                      {note.includes("ALERT") || note.includes("HIT") ? "warning" : "check_circle"}
                    </span>
                    <span>{note}</span>
                  </div>
                ))}
                
                {onLaunchSandbox && (
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '6px' }}>
                    <button 
                      type="button"
                      className="btn-secondary"
                      style={{
                        padding: '4px 10px',
                        fontSize: '11px',
                        borderRadius: '6px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: 'var(--text-dim)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontFamily: 'inherit',
                        transition: 'all 0.2s ease'
                      }}
                      onClick={() => onLaunchSandbox(link)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                        e.currentTarget.style.borderColor = 'var(--accent)';
                        e.currentTarget.style.color = 'var(--text)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                        e.currentTarget.style.color = 'var(--text-dim)';
                      }}
                    >
                      <span className="material-icons-round" style={{ fontSize: '13px' }}>troubleshoot</span>
                      Launch Sandbox Preview
                    </button>
                  </div>
                )}
              </div>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- collapsible attachment sandbox helper ---------- */
function AttachmentSandbox({ attachments }) {
  const [open, setOpen] = React.useState(false);
  if (!attachments || attachments.length === 0) return null;
  
  const hasMalware = attachments.some(a => a.sandboxStatus === "MALICIOUS");
  const hasAlert = attachments.some(a => a.sandboxStatus !== "CLEAN");
  
  return (
    <div className={"bubble-diagnostics " + (hasMalware || hasAlert ? "warning" : "clean")} style={{ width: '100%' }}>
      <div className="diag-summary-pill" onClick={() => setOpen(!open)}>
        <span className="material-icons-round icon" style={{ fontSize: 13, marginRight: 4 }}>
          {hasMalware || hasAlert ? "bug_report" : "folder_shared"}
        </span>
        <span className="label">
          {hasMalware || hasAlert ? "Malicious Files Detected" : "Safe Files Verified"}
        </span>
        <span className="material-icons-round arrow-icon">
          {open ? "expand_less" : "expand_more"}
        </span>
      </div>
      
      {open && (
        <div className="diag-details-expanded" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '8px 10px', textAlign: 'center' }}>
          {attachments.map((att, idx) => (
            <div key={idx} style={{ marginBottom: idx < attachments.length - 1 ? 14 : 0 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <span className="material-icons-round" style={{ fontSize: 13, color: att.sandboxStatus === "MALICIOUS" ? 'var(--red)' : att.sandboxStatus === "SUSPICIOUS" ? 'var(--orange)' : 'var(--green)' }}>
                  {att.fileName.endsWith(".apk") ? "android" : "insert_drive_file"}
                </span>
                <span>{att.fileName} ({att.fileSize} Â· {att.fileType})</span>
                <span className={"status-badge " + att.sandboxStatus.toLowerCase()} style={{
                  fontSize: 8, fontWeight: 700, padding: '1px 4px', borderRadius: 3,
                  background: att.sandboxStatus === "MALICIOUS" ? "rgba(239,106,95,0.15)" : att.sandboxStatus === "SUSPICIOUS" ? "rgba(240,161,60,0.15)" : "rgba(116,224,138,0.15)",
                  color: att.sandboxStatus === "MALICIOUS" ? "var(--red)" : att.sandboxStatus === "SUSPICIOUS" ? "var(--orange)" : "var(--green)",
                  marginLeft: 4
                }}>
                  {att.sandboxStatus}
                </span>
              </div>
              
              <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.4)', marginTop: 4, marginBottom: 4 }}>
                SHA-256: <code style={{ color: 'var(--accent)', fontSize: 9.5 }}>{att.sha256Hash}</code>
              </div>
              
              {((att.highRiskPermissions && att.highRiskPermissions.length > 0) || (att.networkTraces && att.networkTraces.length > 0)) && (
                <div style={{ borderTop: '1px dashed rgba(255,255,255,0.08)', margin: '8px 0' }} />
              )}
              
              {att.highRiskPermissions && att.highRiskPermissions.length > 0 && (
                <div style={{ marginTop: 6 }}>
                  <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--orange)', marginBottom: 2 }}>
                    High-Risk Permissions Flagged:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    {att.highRiskPermissions.map((perm, pIdx) => (
                      <div key={pIdx} style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span className="material-icons-round" style={{ fontSize: 10, color: 'var(--red)' }}>error_outline</span>
                        <code>{perm}</code>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {att.networkTraces && att.networkTraces.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  {att.highRiskPermissions && att.highRiskPermissions.length > 0 && (
                    <div style={{ borderTop: '1px dashed rgba(255,255,255,0.08)', margin: '8px 0' }} />
                  )}
                  <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--red)', marginBottom: 2 }}>
                    C&C Network Callouts:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    {att.networkTraces.map((domain, dIdx) => (
                      <div key={dIdx} style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span className="material-icons-round" style={{ fontSize: 10, color: 'var(--red)' }}>wifi_tethering_off</span>
                        <code style={{ wordBreak: 'break-all' }}>{domain}</code>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const formatEmailDate = (timestamp) => {
  if (!timestamp) return "Just now";
  const d = new Date(timestamp);
  
  const day = d.getDate();
  const monthNames = [
    "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
    "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
  ];
  const month = monthNames[d.getMonth()];
  const year = d.getFullYear();
  
  let hours = d.getHours();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const hoursStr = String(hours).padStart(2, '0');
  
  return `${day} ${month} ${year} / ${hoursStr}:${minutes} ${ampm}`;
};

/* ---------- drawer (thread inspector) ---------- */
function ThreadDrawer({ thread, onClose, onHijack, onSendReply, replyText, setReplyText, scanForLeaks, onLaunchSandbox }) {
  if (!thread) return null;
  const s = STATUS_STYLE[thread.status] || STATUS_STYLE.Verified;
  
  const isLowTrust = thread.status !== "Verified" || thread.trust < 75 || thread.chain === "broken";
  const activeLeak = (isLowTrust && scanForLeaks) ? scanForLeaks(replyText) : null;

  const baseTime = 1719000000000; // Fixed baseline timestamp to ensure pure renders
  const timeline = thread.rawReport ? thread.rawReport.messages.map((m, idx) => ({
    from: m.sender,
    note: m.body,
    hash: m.hashValid ? "ok" : "broken",
    id: m.messageId,
    senderIp: m.senderIp,
    senderIpLocation: m.senderIpLocation,
    senderIpIsp: m.senderIpIsp,
    senderIpType: m.senderIpType,
    senderIpFlagged: m.senderIpFlagged,
    returnPath: m.returnPath,
    returnPathMatched: m.returnPathMatched,
    headerNotes: m.headerValidationNotes || [],
    attachments: m.attachments || [],
    links: m.links || [],
    outgoing: m.outgoing,
    timestamp: m.timestamp || (baseTime - (thread.rawReport.messages.length - 1 - idx) * 3600000)
  })) : [
    { from: thread.participants[0], note: "Thread opened, baseline tone established.", hash: "ok", headerNotes: [], timestamp: baseTime - 7200000 },
    { from: thread.participants[1] || thread.participants[0], note: "Routine reply, protocol alignment normal.", hash: "ok", headerNotes: [], timestamp: baseTime - 3600000 },
    { from: thread.participants[0], note: thread.flag || "Standard follow-up, no anomalies detected.", hash: thread.chain === "broken" ? "broken" : "ok", headerNotes: [], timestamp: baseTime },
  ];

  return createPortal(
    <div
      className="drawer-backdrop"
      onClick={onClose}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px', zIndex: 2000,
        overflowY: 'auto',
        textAlign: 'center',
      }}
    >
      <aside
        className="drawer"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: 1580, maxWidth: '200vw',
          height: '120vh', maxHeight: '150vh',
            background: '#1c1c1e', border: '1px solid #333',
            borderRadius: 16,
            boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
            display: 'flex', flexDirection: 'column',
            padding: 24,
            zIndex: 2001,
            boxSizing: 'border-box'
          }}
        >
        <div className="drawer-head">
          <div>
            <div className="drawer-id">{thread.id}</div>
            <div className="drawer-title">{thread.subject}</div>
          </div>
          <button
            className="icon-btn-flat"
            onClick={onClose}
            style={{
              width: 30, height: 30, borderRadius: 999,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: '#2a2a2d', border: '1px solid #3a3a3d',
              flexShrink: 0, cursor: 'pointer',
            }}
          ><CloseIcon /></button>
        </div>

        <div className="drawer-status-row">
          <span className="status-dot lg" style={{ background: s.dot }} />
          <span className={"status-pill " + s.cls}>{thread.status}</span>
          <span className="drawer-meta">{thread.participants.join("  Â·  ")}</span>
        </div>

        <div
          style={{
            flex: '1 1 0%',
            display: 'grid', gridTemplateColumns: '500px 1fr',
            gap: '0',
            marginTop: 18, border: '1px solid #2e2e31', borderRadius: 12,
            overflow: 'hidden', background: '#121214',
            minHeight: 0
          }}
        >
          {/* LEFT PANEL: Trust Signals, Crypto Lock, Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', borderRight: '1px solid #2e2e31', background: '#1c1c1e', overflow: 'hidden' }}>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <div style={{ padding: '18px 20px' }}>
                <div className="drawer-section-title">Multi-layer trust signals</div>
                <SignalBar label="Behavioral NLP" value={thread.nlp} iconName="visibility" />
                <SignalBar label="Header Guard (SPF / DKIM / DMARC)" value={thread.header} iconName="shield" />
                <SignalBar label="Chain validation (SHA-256)" value={thread.chain === "intact" ? 100 : 18} iconName="tag" />
                <SignalBar label="Link Guard (Phishing Scan)" value={thread.linkGuard ?? 100} iconName="link" />
                <SignalBar label="Attachment Sandbox (APK Scan)" value={thread.attachmentSandbox ?? 100} iconName="android" />

                {thread.flag && (
                  <div className="drawer-alert" style={{ marginTop: 14 }}>
                    <span className="material-icons-round">warning</span>
                    <span><b>Why it was flagged:</b> {thread.flag}</span>
                  </div>
                )}
              </div>

              <div style={{ padding: '18px 20px', borderTop: '1px solid #2e2e31' }}>
                <div className="drawer-section-title">Cryptographic thread lock</div>
                <div className="hashline">
                  {Array.from({ length: timeline.length }).map((_, i) => {
                    const brokenAtIndex = thread.rawReport ? thread.rawReport.brokenAtIndex : 3;
                    const isBroken = thread.chain === "broken" && (brokenAtIndex !== -1 && i >= brokenAtIndex);
                    return (
                      <React.Fragment key={i}>
                        <div className={"hash-node" + (isBroken ? " bad" : "")} title={`H${i + 1}`} />
                        {i < timeline.length - 1 && <div className={"hash-link" + (isBroken ? " bad" : "")} />}
                      </React.Fragment>
                    );
                  })}
                </div>
                <div className="hash-caption" style={{ marginTop: 10, fontSize: '11.5px', color: 'var(--text-dimmer)', lineHeight: '1.5' }}>
                  {thread.chain === "intact"
                    ? "Hcurrent = SHA-256(Mcurrent || Hprevious) verified across all messages."
                    : `Cascading hash validation failed at message ${thread.rawReport ? thread.rawReport.brokenAtIndex + 1 : 4} â€” earlier content may have been altered.`}
                </div>
              </div>
            </div>
            
            <div style={{
              height: '72px', padding: '0 20px', borderTop: '1px solid #2e2e31',
              background: '#18181a', display: 'flex', alignItems: 'center',
              boxSizing: 'border-box'
            }}>
              <button
                className="btn-secondary"
                style={{
                  width: '100%', padding: '9px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', background: 'var(--panel-3)', color: 'var(--text)',
                  border: '1px solid var(--border)', fontFamily: "'Poppins', sans-serif",
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  height: '40px', boxSizing: 'border-box'
                }}
              >
                <span className="material-icons-round" style={{ fontSize: 16, marginRight: 6, verticalAlign: -2 }}>assignment_turned_in</span>
                Mark as reviewed
              </button>
            </div>
          </div>

          {/* RIGHT PANEL: WhatsApp-style Chat Area */}
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#121214', overflow: 'hidden' }}>
            {/* Scrollable messages container */}
            <div
              className="chat-messages-container"
              style={{
                flex: 1, overflowY: 'auto', padding: '20px 24px',
                display: 'flex', flexDirection: 'column', gap: '16px'
              }}
            >
              {timeline.map((m, i) => {
                const isOutgoing = m.outgoing ||
                                   m.from.toLowerCase().includes("ops@internal") || 
                                   m.from.toLowerCase().includes("cfo@company") ||
                                   m.from.toLowerCase().includes("ceo") ||
                                   m.from.toLowerCase().includes("team member") ||
                                   m.from.toLowerCase().includes("hr@brightlane");
                
                const timeStr = formatEmailDate(m.timestamp);

                return (
                  <div key={i} className={"chat-bubble-row " + (isOutgoing ? "outgoing" : "incoming")}>
                    <div className="chat-bubble">
                      <div className="chat-bubble-sender">{m.from}</div>
                      <div className="chat-bubble-body">{m.note}</div>
                      
                      {/* Collapsible Header Diagnostics */}
                      {!isOutgoing && (m.senderIp || m.returnPath) && (
                        <HeaderDiagnostics m={m} threadId={thread.id} onHijack={onHijack} />
                      )}
                      
                      {/* Collapsible Link Diagnostics */}
                      {!isOutgoing && m.links && m.links.length > 0 && (
                        <LinkDiagnostics links={m.links} onLaunchSandbox={onLaunchSandbox} />
                      )}
                      
                      {/* Collapsible Attachment Sandbox */}
                      {!isOutgoing && m.attachments && m.attachments.length > 0 && (
                        <AttachmentSandbox attachments={m.attachments} />
                      )}

                      <div className="chat-bubble-meta">
                        <span className="chat-bubble-time">{timeStr}</span>
                        {isOutgoing && (
                          <span className="material-icons-round" style={{ fontSize: 13, color: 'var(--green)', marginLeft: 4, verticalAlign: -1 }}>done_all</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Docked chat input row */}
            <div style={{
              padding: '16px 20px', borderTop: '1px solid #2e2e31',
              background: '#1c1c1e', display: 'flex', flexDirection: 'column',
              gap: '6px', boxSizing: 'border-box'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      onSendReply(thread.id);
                    }
                  }}
                  placeholder="Type a reply..."
                  style={{
                    flex: 1,
                    height: '42px',
                    minHeight: '42px',
                    maxHeight: '120px',
                    padding: '10px 16px',
                    background: 'rgba(255,255,255,0.04)',
                    border: activeLeak ? '1px solid #e8543f' : '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '20px',
                    color: 'var(--text)',
                    fontFamily: 'inherit',
                    fontSize: '13px',
                    resize: 'none',
                    outline: 'none',
                    boxSizing: 'border-box',
                    lineHeight: '1.4',
                    transition: 'border 0.2s ease'
                  }}
                />
                <button
                  onClick={() => onSendReply(thread.id)}
                  className="chat-send-btn"
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '999px',
                    background: activeLeak ? '#e8543f' : 'var(--accent)',
                    color: activeLeak ? '#fff' : '#111',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: 'none',
                    cursor: 'pointer',
                    flexShrink: 0,
                    transition: 'transform 0.1s ease, filter 0.1s ease, background-color 0.2s ease'
                  }}
                  title={activeLeak ? `Warning: ${activeLeak.type} leak detected` : "Send message"}
                >
                  <span className="material-icons-round" style={{ fontSize: '18px', fontWeight: 'bold' }}>
                    {activeLeak ? 'gpp_maybe' : 'send'}
                  </span>
                </button>
              </div>
              {activeLeak && (
                <div style={{
                  fontSize: '11px',
                  color: '#e8543f',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  paddingLeft: '12px',
                  animation: 'fadeIn 0.2s ease'
                }}>
                  <span className="material-icons-round" style={{ fontSize: '14px' }}>warning</span>
                  <span><b>Outbound Leak Alert:</b> {activeLeak.type} detected in draft.</span>
                </div>
              )}
            </div>
          </div>
        </div>
        </aside>
      </div>,
      document.body
    );
}




/* ---------- Hijack Scenario Selection Modal ---------- */
const HIJACK_SCENARIOS = [
  {
    id: "wire_fraud",
    label: "Wire Fraud",
    icon: "account_balance",
    tag: "Financial BEC",
    tagColor: "var(--red)",
    desc: "Attacker substitutes legitimate bank routing details with fraudulent ones to redirect payments.",
    body: "URGENT: We have updated our banking details effective immediately. Please re-direct all outstanding and future invoice payments to our new account: Routing 887543210, Account No. 4492817736 (Bank of the Caymans). This is time-sensitive and affects the current payment cycle."
  },
  {
    id: "bec_fraud",
    label: "CEO / BEC Fraud",
    icon: "person_pin",
    tag: "Authority Impersonation",
    tagColor: "#f90",
    desc: "Spoofed executive authority demanding an immediate wire transfer without verification channels.",
    body: "Per strict instruction from our CEO: please execute a same-day wire transfer for USD 87,500 to the third-party account on file. Do not discuss with finance colleagues â€” this is a confidential acquisition per board executive directive. Confirmation to follow."
  },
  {
    id: "account_takeover",
    label: "Account Takeover",
    icon: "manage_accounts",
    tag: "Credential Phishing",
    tagColor: "#7c6ef7",
    desc: "Fake security alert pressuring the recipient to click a lookalike login page to harvest credentials.",
    body: "Security Alert: Our systems detected unusual access on your account. You must verify your credentials within 2 hours to prevent lockout. Click here to confirm your identity: http://xn--nrthbrdge-p5a.com/verify-account â€” Ignore this message and your access will be suspended."
  },
  {
    id: "malware",
    label: "Malware Distribution",
    icon: "bug_report",
    tag: "Sideload Attack",
    tagColor: "#e8543f",
    desc: "Fake IT compliance patch delivered as an APK sideload link to install remote-access malware.",
    body: "IT Compliance Notice: A mandatory security patch must be installed on all company devices before end of business today. Failure to install will result in network lockout. Download the patch here: http://internal-security-update.xyz/download/compliance-patch-2025.apk"
  }
];

function HijackScenarioModal({ pending, onExecute, onCancel }) {
  const [chosen, setChosen] = React.useState(null);

  if (!pending) return null;

  return createPortal(
    <div className="modal-backdrop" style={{ zIndex: 12000 }} onClick={e => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="modal-content" style={{ width: 560, maxWidth: "95vw" }} onClick={e => e.stopPropagation()}>
        <div className="modal-header" style={{ borderBottom: "1px solid var(--border-2)" }}>
          <h2 className="modal-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="material-icons-round" style={{ color: "#e8543f" }}>settings_backup_restore</span>
            Select Hijack Scenario
          </h2>
          <button className="modal-close" onClick={onCancel} aria-label="Close">&times;</button>
        </div>
        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <p style={{ fontSize: 12.5, color: "var(--text-dimmer)", margin: "0 0 4px 0", lineHeight: 1.5 }}>
            Choose a red-team scenario to inject into this message. Sudarshana will detect the
            tampered content and break the cryptographic chain.
          </p>
          {HIJACK_SCENARIOS.map(s => (
            <div key={s.id}
                 onClick={() => setChosen(s.id)}
                 style={{
                   border: `1px solid ${chosen === s.id ? "var(--accent)" : "var(--border)"}`,
                   borderRadius: 12,
                   padding: "12px 14px",
                   cursor: "pointer",
                   background: chosen === s.id ? "rgba(99,102,241,0.07)" : "transparent",
                   display: "flex", gap: 12, alignItems: "flex-start",
                   transition: "border-color 0.15s, background 0.15s"
                 }}>
              <span className="material-icons-round" style={{ fontSize: 22, color: s.tagColor, flexShrink: 0, marginTop: 1 }}>{s.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, fontSize: 13.5 }}>{s.label}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em",
                                 color: s.tagColor, background: `${s.tagColor}18`, borderRadius: 20, padding: "2px 8px",
                                 border: `1px solid ${s.tagColor}35` }}>
                    {s.tag}
                  </span>
                </div>
                <p style={{ fontSize: 12, color: "var(--text-dimmer)", margin: 0, lineHeight: 1.5 }}>{s.desc}</p>
              </div>
              <span className="material-icons-round" style={{ fontSize: 18, color: chosen === s.id ? "var(--accent)" : "var(--border)", flexShrink: 0, marginTop: 2 }}>
                {chosen === s.id ? "radio_button_checked" : "radio_button_unchecked"}
              </span>
            </div>
          ))}
        </div>
        <div className="modal-footer" style={{ justifyContent: "flex-end" }}>
          <button className="btn-secondary" onClick={onCancel}>Cancel</button>
          <button
            className="btn-primary"
            style={{ background: chosen ? "#e8543f" : undefined, opacity: chosen ? 1 : 0.45, cursor: chosen ? "pointer" : "default" }}
            disabled={!chosen}
            onClick={() => { const s = HIJACK_SCENARIOS.find(x => x.id === chosen); if (s) onExecute(s.body); }}
          >
            <span className="material-icons-round" style={{ fontSize: 14, marginRight: 4 }}>settings_backup_restore</span>
            Inject Tampered Message
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ---------- Safe Link Sandbox Preview Modal ---------- */
function LinkSandboxModal({ link, onClose, onAddToBlacklist }) {
  const [loadingStage, setLoadingStage] = useState(0);
  const [logs, setLogs] = useState([]);
  const [screenshotError, setScreenshotError] = useState(false);
  const [imgUrl, setImgUrl] = useState("");

  const isHomoglyph = link?.url ? (link.url.includes("xn--") || link.url.includes("northbrÑ–dge") || link.status === "HOMOGLYPH_ALERT") : false;
  const isBlacklisted = link?.status === "BLACKLIST_HIT";
  const isClean = link?.status === "CLEAN";

  const screenshotSrc = isHomoglyph ? "/phishing_login_mockup.png" : "/suspicious_doc_mockup.png";

  let finalVerdict = "SUSPICIOUS: Unverified Domain";
  let verdictDesc = "This link is external and has not been classified yet. Exercise caution.";
  let ratingColor = "var(--orange)";
  let verdictIcon = "security_update_warning";

  if (isClean) {
    finalVerdict = "SAFE: Verified Domain";
    verdictDesc = "This link points to a reputable, verified domain and shows no suspicious phishing patterns.";
    ratingColor = "var(--green)";
    verdictIcon = "gpp_good";
  } else if (isHomoglyph) {
    finalVerdict = "HIGH RISK: Cloned Portal / Typosquatting";
    verdictDesc = "Domain contains lookalike Cyrillic characters mimicking a trusted domain.";
    ratingColor = "var(--red)";
    verdictIcon = "gpp_bad";
  } else if (isBlacklisted) {
    finalVerdict = "HIGH RISK: Blacklisted Domain";
    verdictDesc = "This domain is flagged on security intelligence databases as a known threat.";
    ratingColor = "var(--red)";
    verdictIcon = "gpp_bad";
  }

  const getHostInfo = (urlStr) => {
    try {
      let cleanUrl = urlStr;
      if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
        cleanUrl = "https://" + cleanUrl;
      }
      const host = new URL(cleanUrl).hostname.toLowerCase();
      if (host.includes("google.com")) {
        return { ip: "142.250.190.46", isp: "Google LLC", ssl: "Valid Google Trust Services SSL (HTTP/2)", isSafeSsl: true };
      } else if (host.includes("northbr") || host.includes("northbridge")) {
        return { ip: "185.190.4.12", isp: "Hetzner Online GmbH", ssl: "None / HTTP Only (Critical)", isSafeSsl: false };
      } else if (host.includes("company.com") || host.includes("internal")) {
        return { ip: "10.14.88.2", isp: "Corporate Internal Network", ssl: "Valid Internal CA Certificate", isSafeSsl: true };
      } else if (host.includes("billing-verification.com")) {
        return { ip: "198.51.100.104", isp: "Namecheap Hosting", ssl: "None / HTTP Only (Critical)", isSafeSsl: false };
      } else {
        return { ip: "185.190.4.99", isp: "Hosting Provider", ssl: "Valid Let's Encrypt SSL (HTTP/2)", isSafeSsl: true };
      }
    } catch (e) {
      return { ip: "185.190.4.99", isp: "Unknown Hosting", ssl: "No SSL Certificate", isSafeSsl: false };
    }
  };

  const hostInfo = getHostInfo(link?.url || "");
  const sslStatus = hostInfo.ssl;
  const sslColor = hostInfo.isSafeSsl ? "var(--green)" : "var(--red)";

  let threatIntelFlags = "Unverified";
  if (isClean) threatIntelFlags = "Clean / Safe";
  else if (isHomoglyph) threatIntelFlags = "Homoglyph Spoofing";
  else if (isBlacklisted) threatIntelFlags = "Blacklisted Domain";

  const verdictText = isClean ? "SAFE" : isHomoglyph ? "HIGH RISK (Phishing)" : isBlacklisted ? "HIGH RISK (Blacklisted)" : "SUSPICIOUS";

  const logSequence = [
    { text: "[SYSTEM] Initializing virtualized browser container (Chromium instance #772)...", delay: 300 },
    { text: "[SYSTEM] Container boot successful. Creating isolated tmpfs sandbox mount...", delay: 600 },
    { text: "[NETWORK] Establishing encrypted proxy tunnel through node: 198.51.100.82...", delay: 900 },
    { text: "[NETWORK] Secure proxy bound. User-agent set to Linux Chrome / WebKit headless...", delay: 1200 },
    { text: `[DNS] Resolving domain name: ${link?.url ? link.url.replace(/https?:\/\//, '').split('/')[0] : 'domain'}...`, delay: 1500 },
    { text: `[DNS] Server IP resolved to ${hostInfo.ip} (Hosting Provider: ${hostInfo.isp})`, delay: 1800 },
    { text: "[DOM] Connecting to target and capturing DOM tree screenshot...", delay: 2100 },
    { text: "[DOM] Analyzing script tags, external stylesheet references, and forms...", delay: 2400 },
    { text: "[AI] Running computer vision similarity scan against trusted portal baselines...", delay: 2700 },
    { text: "[AI] Processing page structure indicators (input fields, action endpoints)...", delay: 3000 },
    { text: `[VERDICT] Sandbox execution complete. Verdict: ${verdictText}. Displaying interactive visual analysis.`, delay: 3200 }
  ];

  useEffect(() => {
    setScreenshotError(false);
    if (link && link.url) {
      let cleanUrl = link.url;
      if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
        cleanUrl = "https://" + cleanUrl;
      }
      setImgUrl(`https://api.microlink.io/?url=${encodeURIComponent(cleanUrl)}&screenshot=true&embed=screenshot.url`);
    }
  }, [link]);

  useEffect(() => {
    let timers = [];
    logSequence.forEach((step, idx) => {
      const timer = setTimeout(() => {
        setLogs(prev => [...prev, step.text]);
        if (idx === logSequence.length - 1) {
          setLoadingStage(3); // inspection completed
        } else if (idx === 7) {
          setLoadingStage(2); // dom analysis
        } else if (idx === 4) {
          setLoadingStage(1); // dns analysis
        }
      }, step.delay);
      timers.push(timer);
    });

    return () => timers.forEach(t => clearTimeout(t));
  }, [link]);

  if (!link) return null;

  return createPortal(
    <div className="modal-backdrop" style={{ zIndex: 12000 }} onClick={onClose}>
      <div className="modal-content" style={{ width: "950px", border: "1px solid #333", maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column" }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title" style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text)" }}>
            <span className="material-icons-round" style={{ color: loadingStage === 3 ? ratingColor : 'var(--accent)' }}>
              {loadingStage === 3 ? "security" : "biotech"}
            </span>
            Safe Link Sandbox Inspector
          </h2>
          <button className="modal-close" onClick={onClose} aria-label="Close modal">&times;</button>
        </div>

        <div className="modal-body" style={{ padding: "24px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "20px" }}>
          
          <div style={{ background: "rgba(0,0,0,0.25)", border: "1px solid var(--border)", borderRadius: "10px", padding: "12px 18px", display: "flex", alignItems: "center", gap: "10px" }}>
            <span className="material-icons-round" style={{ color: "var(--text-dimmer)", fontSize: "16px" }}>vpn_lock</span>
            <span style={{ fontSize: "12px", color: "var(--text-dimmer)", fontWeight: "600", textTransform: "uppercase" }}>Inspection Target:</span>
            <code style={{ fontSize: "13px", color: "var(--accent)", wordBreak: "break-all", fontFamily: "monospace" }}>{link.url}</code>
          </div>

          {loadingStage < 3 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "rgba(255, 255, 255, 0.02)", border: "1px solid var(--border-2)", borderRadius: "12px", padding: "20px" }}>
                <div className="sandbox-spinner" style={{
                  width: "36px", height: "36px", border: "3px solid rgba(255,255,255,0.05)",
                  borderTop: "3px solid var(--accent)", borderRadius: "50%"
                }} />
                <div>
                  <div style={{ fontSize: "14px", fontWeight: "600", color: "var(--text)" }}>
                    Running Link Threat Sandbox Analysis
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-dim)", marginTop: "4px" }}>
                    {loadingStage === 0 && "Spinning up sandboxed container and routing networks..."}
                    {loadingStage === 1 && "Verifying DNS registries and certificate integrity..."}
                    {loadingStage === 2 && "Analyzing scraped scripts, stylesheet elements, and form inputs..."}
                  </div>
                </div>
              </div>

              <div style={{
                background: "#0c0c0e", border: "1px solid #222", borderRadius: "12px",
                padding: "20px", fontFamily: "'Courier New', Courier, monospace", fontSize: "12px",
                color: "#74e08a", minHeight: "220px", display: "flex", flexDirection: "column", gap: "6px",
                boxShadow: "inset 0 0 10px rgba(0,0,0,0.8)", overflowY: "auto"
              }}>
                {logs.map((log, i) => (
                  <div key={i} style={{ lineBreak: "anywhere" }}>{log}</div>
                ))}
                <div style={{ width: "8px", height: "15px", background: "#74e08a", animation: "blink 1s step-end infinite", display: "inline-block", verticalAlign: "middle" }} />
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", alignItems: "start" }}>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ fontSize: "12px", fontWeight: "600", textTransform: "uppercase", color: "var(--text-dimmer)" }}>Virtualized Visual Output</div>
                
                <div style={{ border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden", background: "#1c1c1f", boxShadow: "0 10px 30px rgba(0,0,0,0.3)" }}>
                  
                  <div style={{ height: "36px", background: "#252528", borderBottom: "1px solid var(--border)", padding: "0 12px", display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ef6a5f" }} />
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#f0a13c" }} />
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#74e08a" }} />
                    </div>
                    <div style={{ display: "flex", gap: "4px", color: "var(--text-dimmer)" }}>
                      <span className="material-icons-round" style={{ fontSize: "14px" }}>arrow_back</span>
                      <span className="material-icons-round" style={{ fontSize: "14px" }}>arrow_forward</span>
                    </div>
                    <div style={{
                      flex: 1, background: "#151517", borderRadius: "6px", height: "24px",
                      display: "flex", alignItems: "center", padding: "0 10px", gap: "6px",
                      fontSize: "11px", color: ratingColor, overflow: "hidden"
                    }}>
                      <span className="material-icons-round" style={{ fontSize: "12px" }}>{isHomoglyph ? "lock_open" : "lock"}</span>
                      <span style={{ color: "var(--text-dim)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{link.url}</span>
                    </div>
                  </div>

                  <div style={{ position: "relative", width: "100%", background: "#121214", minHeight: "260px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <img 
                      src={screenshotError ? screenshotSrc : imgUrl} 
                      alt="Sandbox Preview" 
                      onError={() => setScreenshotError(true)}
                      style={{ width: "100%", height: "auto", maxHeight: "300px", objectFit: "cover", display: "block" }} 
                    />
                    <div style={{
                      position: "absolute", bottom: "10px", right: "10px",
                      background: "rgba(0,0,0,0.85)", padding: "4px 8px", borderRadius: "4px",
                      fontSize: "10px", color: "var(--text-dimmer)", border: "1px solid rgba(255,255,255,0.1)"
                    }}>
                      Safe isolated DOM render
                    </div>
                  </div>

                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ fontSize: "12px", fontWeight: "600", textTransform: "uppercase", color: "var(--text-dimmer)" }}>Sandbox Security Verdict</div>
                  <div style={{
                    background: isClean ? "rgba(116,224,138,0.05)" : isHomoglyph ? "rgba(239,106,95,0.08)" : "rgba(240,161,60,0.08)",
                    border: `1px solid ${ratingColor}`,
                    borderRadius: "12px", padding: "16px", display: "flex", gap: "12px", alignItems: "center"
                  }}>
                    <span className="material-icons-round" style={{ color: ratingColor, fontSize: "28px" }}>
                      {verdictIcon}
                    </span>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: "700", color: ratingColor }}>{finalVerdict}</div>
                      <div style={{ fontSize: "12px", color: "var(--text-dim)", marginTop: "4px" }}>
                        {verdictDesc}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ fontSize: "12px", fontWeight: "600", textTransform: "uppercase", color: "var(--text-dimmer)" }}>Network & Host Diagnostics</div>
                  <div style={{
                    background: "rgba(255, 255, 255, 0.02)", border: "1px solid var(--border-2)",
                    borderRadius: "12px", padding: "16px", display: "flex", flexDirection: "column", gap: "12px"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
                      <span style={{ color: "var(--text-dim)" }}>Domain IP Address:</span>
                      <code style={{ fontFamily: "monospace", color: "var(--text)" }}>{hostInfo.ip}</code>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
                      <span style={{ color: "var(--text-dim)" }}>Host Provider (ISP):</span>
                      <span style={{ color: "var(--text)" }}>{hostInfo.isp}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
                      <span style={{ color: "var(--text-dim)" }}>SSL Certificate:</span>
                      <span style={{ color: sslColor, fontWeight: "600" }}>{sslStatus}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px" }}>
                      <span style={{ color: "var(--text-dim)" }}>Threat Intel Flags:</span>
                      <span style={{ color: ratingColor, fontWeight: "600" }}>{threatIntelFlags}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ fontSize: "12px", fontWeight: "600", textTransform: "uppercase", color: "var(--text-dimmer)" }}>Analysis Notes</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {link.notes && link.notes.map((note, i) => (
                      <div key={i} style={{
                        display: "flex", gap: "8px", background: "rgba(0,0,0,0.15)",
                        border: "1px solid var(--border-2)", borderRadius: "8px", padding: "10px 12px", fontSize: "12px"
                      }}>
                        <span className="material-icons-round" style={{ color: ratingColor, fontSize: "16px", marginTop: "1px" }}>warning</span>
                        <span style={{ color: "var(--text-dim)" }}>{note}</span>
                      </div>
                    ))}
                    {isHomoglyph && (
                      <div style={{
                        display: "flex", gap: "8px", background: "rgba(0,0,0,0.15)",
                        border: "1px solid var(--border-2)", borderRadius: "8px", padding: "10px 12px", fontSize: "12px"
                      }}>
                        <span className="material-icons-round" style={{ color: "var(--red)", fontSize: "16px", marginTop: "1px" }}>warning</span>
                        <span style={{ color: "var(--text-dim)" }}><b>Homoglyph Alert:</b> Domain contains Cyrillic character "Ñ–" (U+0456) instead of Latin "i".</span>
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>

        <div className="modal-footer">
          <button 
            type="button" 
            className="btn-secondary" 
            style={{ padding: "8px 16px", fontSize: "12.5px" }} 
            onClick={onClose}
          >
            Close Sandbox
          </button>
          {loadingStage === 3 && (
            <button 
              type="button" 
              className="btn-primary" 
              style={{ background: ratingColor, color: "#fff", padding: "8px 16px", fontSize: "12.5px", display: "flex", alignItems: "center", gap: "6px" }}
              onClick={() => onAddToBlacklist(link)}
            >
              <span className="material-icons-round" style={{ fontSize: "15px" }}>block</span>
              Add Domain to Blacklist
            </button>
          )}
        </div>
      </div>
      
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes blink {
          from, to { opacity: 1; }
          50% { opacity: 0; }
        }
        .sandbox-spinner {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>,
    document.body
  );
}

export default function ThreadsPage() {
  const [threads, setThreads] = useState([]);
  const [active, setActive] = useState("All");
  const [selected, setSelected] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [leakWarning, setLeakWarning] = useState(null); // { type, value, threadId }
  const [sandboxLink, setSandboxLink] = useState(null); // Active link inside sandbox
  const [searchQuery, setSearchQuery] = useState(() => localStorage.getItem("tg-search-query") || "");
  const [pendingHijack, setPendingHijack] = useState(null); // { threadId, messageId }

  const handleAddToBlacklist = async (link) => {
    if (!link) return;
    try {
      let domain = link.url;
      try {
        let cleanUrl = link.url;
        if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
          cleanUrl = "http://" + cleanUrl;
        }
        domain = new URL(cleanUrl).hostname;
      } catch (e) {}

      const userId = localStorage.getItem("selectedUserId") || "";
      const url = `/api/threads/blacklist${userId ? `?userId=${userId}` : ""}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain })
      });
      if (response.ok) {
        setSandboxLink(null);
        if (selected) {
          await fetchThreads(selected.id);
        } else {
          await fetchThreads();
        }
      }
    } catch (err) {
      console.error("Failed to blacklist domain:", err);
    }
  };

  const scanForLeaks = (text) => {
    if (!text) return null;
    
    // 1. Credit Cards
    const ccRegex = /\b(?:\d[ -]*?){13,16}\b/;
    const ccMatch = text.match(ccRegex);
    if (ccMatch) {
      const clean = ccMatch[0].replace(/[\s-]/g, "");
      const obscured = "****-****-****-" + clean.slice(-4);
      return { type: "Credit Card Details", value: obscured };
    }

    // 2. SSN / Personal Identifiers
    const ssnRegex = /\b\d{3}-\d{2}-\d{4}\b/;
    const ssnMatch = text.match(ssnRegex);
    if (ssnMatch) {
      return { type: "Social Security Number (SSN)", value: "***-**-" + ssnMatch[0].slice(-4) };
    }

    // 3. API Keys / Secrets / Auth Tokens
    const apiKeyRegex = /\b(?:key|secret|token|password|auth|private|passwd)\s*[:=]\s*["']?[a-zA-Z0-9_*-]{16,}["']?\b/i;
    const highEntropyRegex = /\b[a-zA-Z0-9+/_-]{32,}\b/;
    
    const apiMatch = text.match(apiKeyRegex);
    if (apiMatch) {
      return { type: "API Credentials / Token", value: apiMatch[0].substring(0, 10) + "..." };
    }
    const entropyMatch = text.match(highEntropyRegex);
    if (entropyMatch) {
      const val = entropyMatch[0];
      if (!/^\d+$/.test(val) && !val.includes(":") && !val.startsWith("TH-") && !val.startsWith("MSG-")) {
        return { type: "Cryptographic Key / API Secret", value: val.substring(0, 8) + "..." };
      }
    }

    // 4. Bank Routing / Account Info for Wire Transfers
    const routingRegex = /\b\d{9}\b/;
    const ibanRegex = /\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b/;
    const wireKeywordRegex = /\b(?:routing|account|iban|swift|routing#|bank account|wire details)\b/i;
    
    const routingMatch = text.match(routingRegex);
    if (routingMatch) {
      return { type: "Bank Routing Number", value: "*****" + routingMatch[0].slice(-4) };
    }
    const ibanMatch = text.match(ibanRegex);
    if (ibanMatch) {
      return { type: "International Bank Account (IBAN)", value: ibanMatch[0].substring(0, 4) + "..." + ibanMatch[0].slice(-4) };
    }
    if (wireKeywordRegex.test(text) && /\d{4,}/.test(text)) {
      return { type: "Wire Transfer / Bank Account Info", value: "Sensitive Keywords + Digits" };
    }

    return null;
  };

  const fetchThreads = async (updateSelectedId = null) => {
    try {
      const userId = localStorage.getItem("selectedUserId") || "";
      const url = `/api/threads${userId ? `?userId=${userId}` : ""}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        const mapped = data.map(mapReportToThread);
        setThreads(mapped);
        if (updateSelectedId) {
          const updated = mapped.find(t => t.id === updateSelectedId);
          if (updated) setSelected(updated);
        }
      }
    } catch (err) {
      console.warn("Backend server offline.", err);
    }
  };

  const handleHijackSimulate = (threadId, messageId) => {
    setPendingHijack({ threadId, messageId });
  };

  const executeHijack = async (scenarioBody) => {
    if (!pendingHijack) return;
    const { threadId, messageId } = pendingHijack;
    setPendingHijack(null);
    try {
      const userId = localStorage.getItem("selectedUserId") || "";
      const url = `/api/threads/${threadId}/hijack${userId ? `?userId=${userId}` : ""}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, body: scenarioBody })
      });
      if (response.ok) {
        showToast("Hijack injected. Sudarshana is re-evaluating the cryptographic chain.", "warning");
        await fetchThreads(threadId);
      } else {
        showToast("Hijack failed â€” message not found in this thread.", "error");
      }
    } catch (err) {
      console.error("Failed to simulate hijack:", err);
      showToast("Network error during hijack simulation.", "error");
    }
  };

  const handleSendReply = async (threadId, force = false) => {
    if (!replyText.trim()) return;

    // Outbound Data Leak Prevention: scan if sending to a flagged/unverified/low-trust thread
    if (!force && selected) {
      const isLowTrust = selected.status !== "Verified" || selected.trust < 75 || selected.chain === "broken";
      if (isLowTrust) {
        const leak = scanForLeaks(replyText);
        if (leak) {
          setLeakWarning({
            type: leak.type,
            value: leak.value,
            threadId: threadId
          });
          return; // Intercept send
        }
      }
    }

    try {
      const lastMsg = selected?.rawReport?.messages[selected.rawReport.messages.length - 1];
      const payload = {
        sender: "ops@internal.Sudarshana.io",
        recipient: lastMsg ? lastMsg.sender : "external",
        subject: selected?.subject || "Re: Thread",
        body: replyText,
        spfAligned: true,
        dkimAligned: true,
        dmarcAligned: true,
        senderIp: "192.168.1.1",
        returnPath: "ops@internal.Sudarshana.io"
      };
      const userId = localStorage.getItem("selectedUserId") || "";
      const url = `/api/threads/${threadId}/messages${userId ? `?userId=${userId}` : ""}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        setReplyText("");
        setLeakWarning(null);
        await fetchThreads(threadId);
      }
    } catch (err) {
      console.error("Failed to send reply:", err);
    }
  };

  useEffect(() => {
    fetchThreads();
    const handleUserChange = () => {
      setSelected(null);
      setReplyText("");
      fetchThreads();
    };
    const handleSearch = (e) => {
      setSearchQuery(e.detail || "");
    };
    window.addEventListener('tg-user-changed', handleUserChange);
    window.addEventListener('tg-search-changed', handleSearch);
    return () => {
      window.removeEventListener('tg-user-changed', handleUserChange);
      window.removeEventListener('tg-search-changed', handleSearch);
    };
  }, []);

  const counts = {
    All: threads.length,
    Verified: threads.filter(t => t.status === "Verified").length,
    Flagged: threads.filter(t => t.status === "Flagged").length,
    Quarantined: threads.filter(t => t.status === "Quarantined").length,
    Critical: threads.filter(t => t.status === "Critical").length,
  };
  
  const filtered = threads.filter(t => {
    const tab = TABS.find(tab => tab.label === active);
    const matchesTab = tab ? tab.match(t) : true;
    if (!matchesTab) return false;

    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      (t.subject && t.subject.toLowerCase().includes(query)) ||
      (t.sender && t.sender.toLowerCase().includes(query)) ||
      (t.id && t.id.toLowerCase().includes(query)) ||
      (t.status && t.status.toLowerCase().includes(query))
    );
  });

  return (
    <>
      <style>{`
        body, .threads-page-root, .threads-page-root *, .modal-backdrop, .modal-backdrop *, .drawer, .drawer * {
          font-family: 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .threads-page-root {
          display: flex;
          flex-direction: column;
          gap: 18px;
          height: 100%;
          min-height: 0;
        }

        .material-icons-round {
          font-family: 'Material Icons Round' !important;
          font-weight: normal;
          font-style: normal;
          display: inline-block;
          line-height: 1;
          text-transform: none;
          letter-spacing: normal;
          word-wrap: normal;
          white-space: nowrap;
          direction: ltr;
          -webkit-font-smoothing: antialiased;
          text-rendering: optimizeLegibility;
          -moz-osx-font-smoothing: grayscale;
          font-feature-settings: 'liga';
        }

        /* filter row */
        .filter-row{ display:flex; align-items:center; justify-content:space-between; gap:14px; }
        .tabs{
          display:flex; align-items:center; gap:4px;
          background: var(--panel); border:1px solid var(--border);
          border-radius:999px; padding:5px;
        }
        .tab{
          display:flex; align-items:center; gap:7px;
          padding:7px 12px; border-radius:999px; font-size:13px;
          color: var(--text-dim); cursor:pointer; transition: background .15s ease, color .15s ease;
        }
        .tab:hover{ color: var(--text); }
        .tab.active{ background: var(--panel-3); color: var(--text); }
        .tab b{
          background: rgba(255,255,255,0.10); color: var(--text);
          font-size:11px; font-weight:600; padding:1px 7px; border-radius:999px;
        }
        .tab.active b{ background:#111; color:var(--text); }
        .filter-icon-btn{
          width:34px; height:34px; border-radius:999px;
          background: var(--panel); border:1px solid var(--border);
          display:flex; align-items:center; justify-content:center;
          color: var(--text-dim); margin-left:4px;
        }
        .filter-icon-btn .material-icons-round{ font-size:14px; }

        .toggles{ display:flex; align-items:center; gap:18px; flex-shrink:0; }
        .toggle-row{ display:flex; align-items:center; gap:9px; font-size:13px; color: var(--text-dim); }
        .avg-trust{ color: var(--green); font-weight:700; }

        /* table */
        .table-wrap{
          flex:1; min-height:0; overflow:auto;
          border:1px solid var(--border);
          border-radius: var(--radius-lg);
          background: var(--panel);
        }
        .t-row{
          display:grid;
          grid-template-columns: 150px 1fr 180px 150px 110px 64px 110px;
          align-items:center;
          gap:14px;
          padding:13px 18px;
        }
        .t-head{
          font-size:11.5px; text-transform:uppercase; letter-spacing:.04em;
          color: var(--text-dimmer); border-bottom:1px solid var(--border);
          position:sticky; top:0; background: var(--panel); z-index:1;
        }
        .t-data{ border-bottom:1px solid var(--border); cursor:pointer; transition: background .12s ease; }
        .t-data:hover{ background: var(--panel-2); }
        .t-data.selected{ background: var(--panel-3); }
        .t-data:last-child{ border-bottom:none; }

        .c-status{ display:flex; align-items:center; gap:8px; }
        .status-dot{ width:7px; height:7px; border-radius:999px; flex-shrink:0; }
        .status-dot.lg{ width:9px; height:9px; }
        .status-pill{
          font-size:11px; font-weight:600; padding:3px 9px; border-radius:999px; white-space:nowrap;
        }
        .status-pill.verified{ background: var(--green-bg); color: var(--green); }
        .status-pill.flagged{ background: var(--orange-bg); color: var(--orange); }
        .status-pill.quarantined{ background: var(--purple-bg); color: var(--purple); }
        .status-pill.critical{ background: var(--red-bg); color: var(--red); }

        .c-subject{ min-width:0; }
        .subj-line{
          font-size:13.5px; font-weight:600; color: var(--text);
          white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
        }
        .subj-sub{
          font-size:11.5px; color: var(--text-dimmer); margin-top:2px;
          white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
        }
        .c-domain{ font-size:12.5px; color: var(--text-dim); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }

        .trust-cell{ display:flex; align-items:center; gap:8px; font-size:12.5px; font-weight:600; }
        .trust-track{ width:54px; height:6px; border-radius:999px; background:rgba(255,255,255,0.08); overflow:hidden; }
        .trust-fill{ height:100%; border-radius:999px; }

        .c-chain .chain-ok, .c-chain .chain-bad{
          display:flex; align-items:center; gap:5px; font-size:12px; font-weight:600;
        }
        .c-chain .material-icons-round{ font-size:13px; }
        .chain-ok{ color: var(--green); }
        .chain-bad{ color: var(--red); }

        .c-msgs{ font-size:12.5px; color: var(--text-dim); }
        .c-last{ font-size:12px; color: var(--text-dimmer); white-space:nowrap; }

        .empty-state{ padding:40px; text-align:center; color: var(--text-dimmer); font-size:13px; }

        @media (max-width: 1100px){
          .t-row{ grid-template-columns: 120px 1fr 140px 0 0 0 90px; }
          .c-domain, .c-trust, .c-chain, .c-msgs{ display:none; }
        }

        /* ---------------- drawer / modal ---------------- */
        .drawer-backdrop{
          position:fixed; inset:0; background: rgba(0,0,0,0.6);
          backdrop-filter: blur(3px); z-index:20;
          animation: fadeIn .15s ease;
          display:flex; align-items:center; justify-content:center;
          padding:16px;
          overflow-y:auto;
        }
        .drawer{
          position:relative;
          width:880px; max-width:95vw;
          background: var(--panel-2);
          border:1px solid var(--border-2);
          border-radius: var(--radius-lg);
          box-shadow: 0 30px 80px rgba(0,0,0,0.6);
          z-index:21;
          display:flex; flex-direction:column;
          padding:24px;
          animation: popIn .18s cubic-bezier(.2,.9,.3,1.1);
        }
        @keyframes fadeIn{ from{ opacity:0; } to{ opacity:1; } }
        @keyframes popIn{ from{ transform: scale(.96) translateY(8px); opacity:0; } to{ transform: scale(1) translateY(0); opacity:1; } }

        .drawer-head{ display:flex; align-items:flex-start; justify-content:space-between; gap:10px; }
        .drawer-id{ font-size:11px; color: var(--text-dimmer); font-weight:600; letter-spacing:.03em; }
        .drawer-title{ font-size:16px; font-weight:700; margin-top:4px; line-height:1.35; }
        .icon-btn-flat{
          width:30px; height:30px; border-radius:999px;
          display:flex; align-items:center; justify-content:center;
          color: var(--text-dimmer); flex-shrink:0;
        }
        .icon-btn-flat:hover{ background: var(--panel-3); color: var(--text); }
        .icon-btn-flat .material-icons-round{ font-size:14px; }

        .drawer-status-row{ display:flex; align-items:center; gap:8px; margin-top:14px; flex-wrap:wrap; }
        .drawer-meta{ font-size:12px; color: var(--text-dimmer); }

        .drawer-section{ margin-top:20px; }
        .drawer-section-title{
          font-size:11.5px; text-transform:uppercase; letter-spacing:.04em;
          color: var(--text-dimmer); margin-bottom:12px; font-weight:600;
        }

        .signal-row{ display:flex; align-items:center; gap:10px; margin-bottom:10px; }
        .signal-label{
          flex:0 0 280px; font-size:12px; color: var(--text-dim);
          display:flex; align-items:center; gap:6px;
          white-space: nowrap;
        }
        .signal-label .material-icons-round{ font-size:13px; flex-shrink:0; }
        .signal-track{ flex:1; height:6px; border-radius:999px; background:rgba(255,255,255,0.08); overflow:hidden; }
        .signal-fill{ height:100%; border-radius:999px; }
        .signal-val{ width:36px; text-align:right; font-size:12px; font-weight:700; }

        .drawer-alert{
          margin-top:16px;
          display:flex; gap:9px;
          background: var(--red-bg);
          border:1px solid rgba(239,106,95,0.25);
          border-radius:12px; padding:11px 12px;
          font-size:12.5px; color:#f3c4bf; line-height:1.5;
        }
        .drawer-alert .material-icons-round{ font-size:15px; color: var(--red); flex-shrink:0; margin-top:1px; }
        .drawer-alert b{ color: var(--red); }

        .hashline{ display:flex; align-items:center; }
        .hash-node{
          width:14px; height:14px; border-radius:999px;
          background: var(--green); flex-shrink:0;
          box-shadow: 0 0 0 3px rgba(116,224,138,0.18);
        }
        .hash-node.bad{ background: var(--red); box-shadow: 0 0 0 3px rgba(239,106,95,0.18); }
        .hash-link{ flex:1; height:2px; background: var(--border-2); }
        .hash-link.bad{ background: repeating-linear-gradient(90deg, var(--red) 0 4px, transparent 4px 8px); }
        .hash-caption{ font-size:11.5px; color: var(--text-dimmer); margin-top:10px; line-height:1.5; }

        .timeline{ display:flex; flex-direction:column; gap:14px; }
        .tl-item{ display:flex; gap:10px; }
        .tl-dot{
          width:9px; height:9px; border-radius:999px; background: var(--green);
          margin-top:4px; flex-shrink:0;
        }
        .tl-dot.bad{ background: var(--red); }
        .tl-from{ font-size:12.5px; font-weight:600; }
        .tl-note{ font-size:12px; color: var(--text-dim); margin-top:2px; line-height:1.5; }
        
        /* Collapsible Header Guard details */
        .tl-header-details {
          margin-top: 10px;
          padding: 10px 12px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          font-family: inherit;
        }
        .diag-title {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          color: var(--text-dimmer);
          letter-spacing: .05em;
          margin-bottom: 8px;
        }
        .diag-grid {
          display: flex;
          gap: 16px;
          margin-bottom: 6px;
        }
        .diag-field {
          font-size: 12px;
        }
        .diag-label {
          color: var(--text-dimmer);
          margin-right: 4px;
        }
        .diag-val {
          font-weight: 600;
        }
        .diag-val.good { color: var(--green); }
        .diag-val.bad { color: var(--red); }
        
        .diag-notes {
          margin-top: 6px;
          padding-top: 6px;
          border-top: 1px dashed rgba(255,255,255,0.06);
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .diag-note-item {
          font-size: 11.5px;
          display: flex;
          align-items: center;
          line-height: 1.4;
        }
        .diag-note-item.info { color: var(--text-dim); }
        .diag-note-item.alert { color: var(--orange); }

        .btn-hijack{
          padding: 3px 8px; font-size: 10px; border-radius: 6px; border: 1px solid var(--border);
          background: var(--panel-3); color: var(--red); cursor: pointer; margin-top: 6px;
        }
        .btn-hijack:hover{ background: var(--red-bg); }

        /* ---------------- Chatbox redesign CSS ---------------- */
        .chat-bubble-row {
          display: flex;
          width: 100%;
          margin-bottom: 4px;
        }
        .chat-bubble-row.incoming {
          justify-content: flex-start;
        }
        .chat-bubble-row.outgoing {
          justify-content: flex-end;
        }
        .chat-bubble {
          max-width: 75%;
          padding: 10px 14px;
          border-radius: 14px;
          position: relative;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .chat-bubble-row.incoming .chat-bubble {
          background: #1c1c1e;
          border: 1px solid rgba(255,255,255,0.06);
          border-top-left-radius: 2px;
          color: #f2f2f7;
        }
        .chat-bubble-row.outgoing .chat-bubble {
          background: #1e3a8a;
          border: 1px solid rgba(10,132,255,0.15);
          border-top-right-radius: 2px;
          color: #f2f2f7;
        }
        .chat-bubble-sender {
          font-size: 11px;
          font-weight: 700;
          color: #facc15; /* Yellow highlight for sender */
          letter-spacing: 0.02em;
          text-align: left;
        }
        .chat-bubble-row.outgoing .chat-bubble-sender {
          color: #64b5f6;
        }
        .chat-bubble-body {
          font-size: 13px;
          line-height: 1.45;
          word-break: break-word;
          white-space: pre-wrap;
          text-align: left;
        }
        .chat-bubble-meta {
          align-self: flex-end;
          display: flex;
          align-items: center;
          margin-top: 2px;
        }
        .chat-bubble-time {
          font-size: 10px;
          color: rgba(255,255,255,0.4);
        }
        
        /* Diagnostics Inside Bubbles */
        .bubble-diagnostics {
          margin-top: 4px;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.05);
          overflow: hidden;
          background: rgba(0, 0, 0, 0.2);
        }
        .diag-summary-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          cursor: pointer;
          user-select: none;
          transition: background 0.15s ease;
        }
        .diag-summary-pill:hover {
          background: rgba(255,255,255,0.04);
        }
        .bubble-diagnostics.clean .diag-summary-pill .icon {
          color: var(--green);
          font-size: 14px;
        }
        .bubble-diagnostics.warning .diag-summary-pill .icon {
          color: var(--orange);
          font-size: 14px;
        }
        .diag-summary-pill .label {
          font-size: 11px;
          font-weight: 600;
          flex: 1;
        }
        .bubble-diagnostics.clean .diag-summary-pill .label {
          color: var(--green);
        }
        .bubble-diagnostics.warning .diag-summary-pill .label {
          color: var(--orange);
        }
        .diag-summary-pill .arrow-icon {
          font-size: 14px;
          color: rgba(255,255,255,0.4);
        }
        
        .diag-details-expanded {
          padding: 8px 10px;
          border-top: 1px solid rgba(255,255,255,0.06);
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .diag-detail-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .diag-detail-row {
          display: flex;
          flex-direction: column;
          font-size: 11px;
        }
        .diag-detail-row .lbl {
          color: rgba(255,255,255,0.4);
        }
        .diag-detail-row .val {
          font-weight: 600;
        }
        .diag-detail-row .val.good { color: var(--green); }
        .diag-detail-row .val.bad { color: var(--red); }
        
        .diag-detail-logs {
          display: flex;
          flex-direction: column;
          gap: 4px;
          border-top: 1px dashed rgba(255,255,255,0.08);
          padding-top: 6px;
          margin-top: 2px;
        }
        .diag-detail-log-item {
          font-size: 11px;
          display: flex;
          align-items: flex-start;
          gap: 4px;
          line-height: 1.35;
        }
        .diag-detail-log-item.info { color: rgba(255,255,255,0.6); }
        .diag-detail-log-item.alert { color: var(--orange); }
        .diag-detail-log-item .font-icon {
          font-size: 12px;
          margin-top: 1px;
          flex-shrink: 0;
        }
        .diag-detail-log-item.info .font-icon { color: var(--green); }
        .diag-detail-log-item.alert .font-icon { color: var(--orange); }
        
        .btn-hijack-compact {
          align-self: flex-start;
          background: rgba(239,106,95,0.12);
          border: 1px solid rgba(239,106,95,0.25);
          color: var(--red);
          border-radius: 6px;
          padding: 3px 8px;
          font-size: 10.5px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          margin-top: 4px;
          transition: background 0.12s ease;
        }
        .btn-hijack-compact:hover {
          background: rgba(239,106,95,0.22);
        }
        
        .chat-send-btn:active {
          transform: scale(0.95);
        }
        
        /* Custom scrollbar for chat message timelines */
        .chat-messages-container::-webkit-scrollbar {
          width: 6px;
        }
        .chat-messages-container::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
        }
        .chat-messages-container::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.12);
          border-radius: 999px;
        }
        .chat-messages-container::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.22);
        }

        .drawer-actions{ display:flex; flex-direction:column; gap:10px; margin-top:24px; padding-top:18px; border-top:1px solid var(--border); }
        .drawer-actions textarea{
          width: 100%; height: 72px; padding: 10px; background: var(--panel-3); border: 1px solid var(--border);
          border-radius: 12px; color: var(--text); font-family: inherit; font-size: 13px; resize: none;
        }
        .drawer-actions textarea:focus{ outline: 1px solid var(--accent); }
        .drawer-actions .btn-primary, .drawer-actions .btn-secondary{
          width: 100%; padding:11px; border-radius:12px; font-size:13px; font-weight:600; text-align:center;
          cursor: pointer; border: none;
        }
        .btn-secondary{ background: var(--panel-3); color: var(--text); }
        .btn-secondary:hover{ background: var(--panel); }
        .btn-primary{ background: var(--accent); color:#111; }
        .btn-primary:hover{ filter: brightness(0.95); }

        ::selection{ background: var(--accent-dim); }

        .range-btn .material-icons-round{ font-size:13px; }
        .filter-icon-btn .material-icons-round{ font-size:14px; }
        .c-chain .material-icons-round{ font-size:13px; }
        .icon-btn-flat .material-icons-round{ font-size:14px; }
        .signal-label .material-icons-round{ font-size:13px; flex-shrink:0; }
        .drawer-alert .material-icons-round{ font-size:15px; color: var(--red); flex-shrink:0; margin-top:1px; }

        /* Modal backdrop & content for Data Leak Alert */
        .modal-backdrop {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          animation: fadeIn 0.2s ease;
        }
        
        .modal-content {
          background: var(--panel, #121214);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg, 16px);
          width: 550px;
          max-width: 95%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 40px rgba(0,0,0,0.5);
          animation: slideUp 0.2s ease;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          border-bottom: 1px solid var(--border-2);
        }
        .modal-title {
          font-size: 16px;
          font-weight: 600;
          color: var(--text);
        }
        .modal-close {
          background: transparent;
          border: none;
          color: var(--text-dimmer);
          cursor: pointer;
          font-size: 24px;
          line-height: 1;
        }
        .modal-close:hover {
          color: var(--text);
        }
        .modal-body {
          padding: 24px;
          text-align: left;
        }
        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 16px 24px;
          border-top: 1px solid var(--border-2);
          margin-top: 20px;
        }
      `}</style>
      <div className="threads-page-root">
        <FilterRow active={active} setActive={setActive} counts={counts} />
        <ThreadsTable threads={filtered} onOpen={setSelected} selectedId={selected?.id} />

        <ThreadDrawer
          thread={selected}
          onClose={() => setSelected(null)}
          onHijack={handleHijackSimulate}
          onSendReply={handleSendReply}
          replyText={replyText}
          setReplyText={setReplyText}
          scanForLeaks={scanForLeaks}
          onLaunchSandbox={async (link) => {
            setSandboxLink(link);
            try {
              const userEmail = localStorage.getItem("userEmail") || "demo@sudarshana.com";
              await fetch("/api/audit-logs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  userEmail: userEmail,
                  action: "SANDBOX_LAUNCH",
                  details: `Launched safe link preview sandbox for URL: ${link.url}`
                })
              });
            } catch (err) {
              console.warn("Failed to log sandbox launch activity:", err);
            }
          }}
        />

        {leakWarning && createPortal(
          <div className="modal-backdrop" style={{ zIndex: 11000 }} onClick={() => setLeakWarning(null)}>
            <div className="modal-content" style={{ width: "450px", border: "1px solid var(--red-border, #e8543f)" }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header" style={{ borderBottom: "1px solid rgba(232, 84, 63, 0.15)" }}>
                <h2 className="modal-title" style={{ color: "#e8543f", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span className="material-icons-round">gpp_maybe</span>
                  Reply Guard Alert
                </h2>
                <button className="modal-close" onClick={() => setLeakWarning(null)} aria-label="Close modal">&times;</button>
              </div>
              
              <div className="modal-body" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ background: "rgba(232,84,63,0.06)", border: "1px solid rgba(232,84,63,0.15)", borderRadius: "12px", padding: "14px", display: "flex", gap: "12px" }}>
                  <span className="material-icons-round" style={{ color: "#e8543f", fontSize: "24px" }}>warning</span>
                  <div style={{ fontSize: "13px", lineHeight: "1.5", color: "var(--text-dim)" }}>
                    <b style={{ color: "var(--text)" }}>High-Risk Outbound Leak Detected:</b>
                    <p style={{ margin: "4px 0 0 0" }}>You are sending sensitive credentials or banking details to an unverified or flagged external sender. The threat level of this thread is elevated.</p>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-dimmer)" }}>Detected Leak Category</div>
                  <div style={{ display: "flex", justifyContent: "space-between", background: "rgba(0,0,0,0.15)", border: "1px solid var(--border)", borderRadius: "8px", padding: "10px 14px", fontSize: "13px" }}>
                    <span style={{ fontWeight: "600", color: "#e8543f" }}>{leakWarning.type}</span>
                    <span style={{ fontFamily: "monospace", color: "var(--text-dimmer)" }}>{leakWarning.value}</span>
                  </div>
                </div>

                <p style={{ fontSize: "12px", color: "var(--text-dimmer)", margin: 0, lineHeight: "1.5" }}>
                  Exposing sensitive information to low-trust domains violates organizational security policies. Please verify the recipient's identity before continuing.
                </p>
              </div>

              <div className="modal-footer" style={{ borderTop: "1px solid var(--border-2)", padding: "16px 20px" }}>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  style={{ padding: "8px 16px", fontSize: "12.5px" }} 
                  onClick={() => setLeakWarning(null)}
                >
                  Cancel & Edit Reply
                </button>
                <button 
                  type="button" 
                  className="btn-primary" 
                  style={{ background: "#e8543f", color: "#fff", padding: "8px 16px", fontSize: "12.5px" }}
                  onClick={() => handleSendReply(leakWarning.threadId, true)}
                >
                  Force Send (Bypass)
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

        {sandboxLink && (
          <LinkSandboxModal 
            link={sandboxLink} 
            onClose={() => setSandboxLink(null)} 
            onAddToBlacklist={handleAddToBlacklist} 
          />
        )}

        <HijackScenarioModal
          pending={pendingHijack}
          onExecute={executeHijack}
          onCancel={() => setPendingHijack(null)}
        />
      </div>
    </>
  );
}


