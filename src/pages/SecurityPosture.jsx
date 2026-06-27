import React, { useState, useEffect } from 'react';
import mapReportToThread from '../utils/mapReportToThread.js';

/* Inline close icon -- doesn't depend on an icon font being loaded,
   so it always renders instead of going blank inside drawers/modals. */
function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <line x1="5" y1="5" x2="19" y2="19" />
      <line x1="19" y1="5" x2="5" y2="19" />
    </svg>
  );
}

/**
 * SecurityPosturePage
 * Consolidated "Security Posture" view for Sudarshana.
 * Absorbs: Header Guard + Chain Validation + Senders & Domains.
 * One page, three tabs:
 *   - Auth Health   (SPF / DKIM / DMARC pass-rate audit)
 *   - Chain Audit   (cryptographic hash-break feed)
 *   - Senders       (directory + behavioral baselines)
 *
 * Usage:
 *   import SecurityPosturePage from './SecurityPosturePage';
 *   <SecurityPosturePage />
 *
 * Same design system as ThreadsPage.jsx / Home.jsx -- reuses the same
 * CSS custom properties (--panel, --border, --text, --green, --red, etc.)
 * defined globally in App.css, so no variables are redeclared here.
 */

/* ============================================================
   style constants (not data)
   ============================================================ */

const AUTH_TABS = [
  { label: "All", match: () => true },
  { label: "Failing", match: (d) => d.spf === "fail" || d.dkim === "fail" || d.dmarc === "reject" },
  { label: "Partial", match: (d) => [d.spf, d.dkim, d.dmarc].includes("softfail") || d.dmarc === "quarantine" || d.dmarc === "none" },
  { label: "Healthy", match: (d) => d.spf === "pass" && d.dkim === "pass" && d.dmarc === "pass" },
];

const AUTH_RESULT_STYLE = {
  pass: { cls: "pass", label: "Pass" },
  softfail: { cls: "warn", label: "Soft-fail" },
  fail: { cls: "fail", label: "Fail" },
  none: { cls: "warn", label: "None" },
  quarantine: { cls: "warn", label: "Quarantine" },
  reject: { cls: "fail", label: "Reject" },
};

const CHAIN_SEVERITY_STYLE = {
  Critical: { dot: "var(--red)", cls: "critical" },
  High: { dot: "var(--orange)", cls: "flagged" },
  Medium: { dot: "#a98ce8", cls: "quarantined" },
};

const SENDER_TABS = [
  { label: "All", match: () => true },
  { label: "High risk", match: (s) => s.risk === "high" },
  { label: "Medium risk", match: (s) => s.risk === "medium" },
  { label: "Low risk", match: (s) => s.risk === "low" },
];

const RISK_STYLE = {
  low: { dot: "var(--green)", cls: "verified", label: "Low" },
  medium: { dot: "var(--orange)", cls: "flagged", label: "Medium" },
  high: { dot: "var(--red)", cls: "critical", label: "High" },
};

/* ============================================================
   shared bits
   ============================================================ */

function PageHeader({ sub, dateRange, setDateRange, showRangeMenu, setShowRangeMenu, rangeMenuRef }) {
  return (
    <div className="page-header">
      <div className="page-sub">{sub}</div>
      <div ref={rangeMenuRef} style={{ position: "relative" }}>
        <button className="range-btn" onClick={() => setShowRangeMenu(p => !p)}>
          <span className="material-icons-round">calendar_today</span> {dateRange.label} <span className="material-icons-round">keyboard_arrow_down</span>
        </button>
        {showRangeMenu && (
          <div style={{
            position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 100,
            background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 12,
            boxShadow: "0 12px 32px rgba(0,0,0,0.4)", overflow: "hidden", minWidth: 160,
          }}>
            {RANGE_OPTIONS.map(opt => (
              <div key={opt.label}
                onClick={() => { setDateRange(opt); setShowRangeMenu(false); }}
                style={{
                  padding: "10px 16px", fontSize: 13, cursor: "pointer",
                  background: opt.label === dateRange.label ? "var(--panel-3)" : "transparent",
                  color: opt.label === dateRange.label ? "var(--text)" : "var(--text-dim)",
                  fontWeight: opt.label === dateRange.label ? 600 : 400,
                }}
              >
                {opt.label}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SectionTabs({ active, setActive }) {
  const SECTIONS = [
    { key: "auth", label: "Auth Health", iconName: "verified_user" },
    { key: "chain", label: "Chain Audit", iconName: "link" },
    { key: "senders", label: "Senders", iconName: "groups" },
  ];
  return (
    <div className="section-tabs">
      {SECTIONS.map((s) => (
        <div
          key={s.key}
          className={"section-tab" + (active === s.key ? " active" : "")}
          onClick={() => setActive(s.key)}
        >
          <span className="material-icons-round">{s.iconName}</span> {s.label}
        </div>
      ))}
    </div>
  );
}

function FilterRow({ tabs, active, setActive, counts, rightSlot }) {
  return (
    <div className="filter-row">
      <div style={{ display: "flex", alignItems: "center" }}>
        <div className="tabs">
          {tabs.map((t) => (
            <div
              key={t.label}
              className={"tab" + (t.label === active ? " active" : "")}
              onClick={() => setActive(t.label)}
            >
              {t.label} <b>{counts[t.label]}</b>
            </div>
          ))}
        </div>
        <button className="filter-icon-btn"><span className="material-icons-round">filter_list</span></button>
      </div>
      {rightSlot}
    </div>
  );
}

/* ============================================================
   Auth Health tab
   ============================================================ */

function AuthResultPill({ value }) {
  const s = AUTH_RESULT_STYLE[value];
  return <span className={"auth-pill " + s.cls}>{s.label}</span>;
}

function AuthHealthTable({ rows, onOpen, selectedDomain }) {
  return (
    <div className="table-wrap">
      <div className="t-row auth-head t-head">
        <div>Domain</div>
        <div>SPF</div>
        <div>DKIM</div>
        <div>DMARC</div>
        <div>Volume (7d)</div>
        <div>Trend</div>
      </div>
      <div className="t-body">
        {rows.map((d) => (
          <div
            key={d.domain}
            className={"t-row auth-row t-data" + (d.domain === selectedDomain ? " selected" : "")}
            onClick={(e) => { e.stopPropagation(); onOpen(d); }}
          >
            <div className="c-domain-main">{d.domain}</div>
            <div><AuthResultPill value={d.spf} /></div>
            <div><AuthResultPill value={d.dkim} /></div>
            <div><AuthResultPill value={d.dmarc} /></div>
            <div className="c-msgs">{d.volume}</div>
            <div className="c-trend">
              {d.trend === "up" && <span className="trend-up"><span className="material-icons-round">trending_up</span></span>}
              {d.trend === "down" && <span className="trend-down"><span className="material-icons-round">trending_down</span></span>}
              {d.trend === "flat" && <span className="trend-flat"><span className="material-icons-round">trending_flat</span></span>}
            </div>
          </div>
        ))}
        {rows.length === 0 && <div className="empty-state">No domains match this filter.</div>}
      </div>
    </div>
  );
}

function AuthDrawer({ domain, onClose }) {
  if (!domain) return null;
  return (
    <>
      <div
        className="drawer-backdrop"
        onClick={onClose}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24, zIndex: 2000,
        }}
      >
        <aside
          className="drawer"
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'relative',
            width: 640, maxWidth: '100%',
            maxHeight: 'calc(100vh - 48px)',
            background: 'var(--panel)', border: '1px solid var(--border)',
            borderRadius: 16,
            boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
            display: 'flex', flexDirection: 'column',
            padding: 24, overflowY: 'auto',
            zIndex: 2001,
          }}
        >
        <div className="drawer-head">
          <div>
            <div className="drawer-id">DOMAIN AUTH RECORD</div>
            <div className="drawer-title">{domain.domain}</div>
          </div>
          <button className="icon-btn-flat" onClick={onClose}><CloseIcon /></button>
        </div>

        <div className="drawer-status-row">
          <AuthResultPill value={domain.spf} />
          <AuthResultPill value={domain.dkim} />
          <AuthResultPill value={domain.dmarc} />
          <span className="drawer-meta">{domain.volume} messages, last 7 days</span>
        </div>

        <div className="drawer-section">
          <div className="drawer-section-title">Authentication breakdown</div>
          <div className="signal-row">
            <div className="signal-label"><span className="material-icons-round">dns</span> SPF (Sender Policy Framework)</div>
            <div className="signal-val-text"><AuthResultPill value={domain.spf} /></div>
          </div>
          <div className="signal-row">
            <div className="signal-label"><span className="material-icons-round">key</span> DKIM (DomainKeys Identified Mail)</div>
            <div className="signal-val-text"><AuthResultPill value={domain.dkim} /></div>
          </div>
          <div className="signal-row">
            <div className="signal-label"><span className="material-icons-round">policy</span> DMARC policy</div>
            <div className="signal-val-text"><AuthResultPill value={domain.dmarc} /></div>
          </div>
        </div>

        {domain.note && (
          <div className="drawer-alert">
            <span className="material-icons-round">warning</span>
            <span><b>Why it matters:</b> {domain.note}</span>
          </div>
        )}

        <div className="drawer-actions">
          <button className="btn-secondary">View threads</button>
          <button className="btn-primary">Enforce DMARC reject</button>
        </div>
        </aside>
      </div>
    </>
  );
}

function AuthHealthTab({ threads }) {
  const [active, setActive] = useState("All");
  const [selected, setSelected] = useState(null);

  const liveAuthDomains = [];
  threads.forEach(t => {
    if (!t.domain) return;
    let existing = liveAuthDomains.find(d => d.domain === t.domain);
    if (!existing) {
      existing = {
        domain: t.domain,
        spf: "pass",
        dkim: "pass",
        dmarc: "pass",
        volume: 0,
        trend: "flat",
        note: null,
      };
      liveAuthDomains.push(existing);
    }
    existing.volume += t.messages;
    if (t.rawReport?.messages) {
      t.rawReport.messages.forEach(m => {
        if (!m.spfAligned) existing.spf = "fail";
        if (!m.dkimAligned) existing.dkim = "fail";
        if (!m.dmarcAligned) existing.dmarc = "reject";
      });
    }
  });

  const domains = liveAuthDomains;
  const counts = AUTH_TABS.reduce((acc, t) => {
    acc[t.label] = domains.filter(t.match).length;
    return acc;
  }, {});
  const filtered = domains.filter(AUTH_TABS.find((t) => t.label === active).match);
  const healthyPct = domains.length > 0
    ? Math.round((domains.filter((d) => d.spf === "pass" && d.dkim === "pass" && d.dmarc === "pass").length / domains.length) * 100)
    : 0;

  return (
    <>
      <FilterRow
        tabs={AUTH_TABS}
        active={active}
        setActive={setActive}
        counts={counts}
        rightSlot={
          <div className="toggles">
            <div className="toggle-row">
              <span><span className="material-icons-round" style={{ fontSize: 13, marginRight: 4, verticalAlign: -2 }}>verified_user</span>Fully authenticated</span>
              <span className="avg-trust">{healthyPct}%</span>
            </div>
          </div>
        }
      />
      <AuthHealthTable rows={filtered} onOpen={setSelected} selectedDomain={selected?.domain} />
      <AuthDrawer domain={selected} onClose={() => setSelected(null)} />
    </>
  );
}

/* ============================================================
   Chain Audit tab
   ============================================================ */

function ChainHashline({ totalMsgs, brokeAt }) {
  const n = Math.min(totalMsgs, 8);
  return (
    <div className="hashline sm">
      {Array.from({ length: n }).map((_, i) => {
        const msgNum = i + 1;
        const bad = msgNum === brokeAt;
        return (
          <React.Fragment key={i}>
            <div className={"hash-node sm" + (bad ? " bad" : "")} title={`Message ${msgNum}`} />
            {i < n - 1 && <div className={"hash-link" + (msgNum >= brokeAt ? " bad" : "")} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function ChainAuditTable({ rows, onOpen, selectedId }) {
  return (
    <div className="table-wrap">
      <div className="t-row chain-head t-head">
        <div>Severity</div>
        <div>Thread</div>
        <div>Sender domain</div>
        <div>Hash chain</div>
        <div>Broke at</div>
        <div>Detected</div>
      </div>
      <div className="t-body">
        {rows.map((c) => {
          const s = CHAIN_SEVERITY_STYLE[c.severity];
          return (
            <div
              key={c.id}
              className={"t-row chain-row t-data" + (c.id === selectedId ? " selected" : "")}
              onClick={(e) => { e.stopPropagation(); onOpen(c); }}
            >
              <div className="c-status">
                <span className="status-dot" style={{ background: s.dot }} />
                <span className={"status-pill " + s.cls}>{c.severity}</span>
              </div>
              <div className="c-domain-main">{c.id}</div>
              <div className="c-domain">{c.domain}</div>
              <div><ChainHashline totalMsgs={c.totalMsgs} brokeAt={c.brokeAt} /></div>
              <div className="c-msgs">Msg {c.brokeAt} / {c.totalMsgs}</div>
              <div className="c-last">{c.when}</div>
            </div>
          );
        })}
        {rows.length === 0 && <div className="empty-state">No chain breaks in this window.</div>}
      </div>
    </div>
  );
}

function ChainDrawer({ event, onClose }) {
  if (!event) return null;
  const s = CHAIN_SEVERITY_STYLE[event.severity];
  return (
    <>
      <div
        className="drawer-backdrop"
        onClick={onClose}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24, zIndex: 2000,
        }}
      >
        <aside
          className="drawer"
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'relative',
            width: 640, maxWidth: '100%',
            maxHeight: 'calc(100vh - 48px)',
            background: 'var(--panel)', border: '1px solid var(--border)',
            borderRadius: 16,
            boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
            display: 'flex', flexDirection: 'column',
            padding: 24, overflowY: 'auto',
            zIndex: 2001,
          }}
        >
        <div className="drawer-head">
          <div>
            <div className="drawer-id">{event.id}</div>
            <div className="drawer-title">Chain break â€” {event.domain}</div>
          </div>
          <button className="icon-btn-flat" onClick={onClose}><CloseIcon /></button>
        </div>

        <div className="drawer-status-row">
          <span className="status-dot lg" style={{ background: s.dot }} />
          <span className={"status-pill " + s.cls}>{event.severity}</span>
          <span className="drawer-meta">Detected {event.when}</span>
        </div>

        <div className="drawer-section">
          <div className="drawer-section-title">Cryptographic thread lock</div>
          <ChainHashline totalMsgs={event.totalMsgs} brokeAt={event.brokeAt} />
          <div className="hash-caption">
            Cascading hash validation failed at message {event.brokeAt} of {event.totalMsgs} â€” content from this point forward cannot be cryptographically verified against the original chain.
          </div>
        </div>

        <div className="drawer-alert">
          <span className="material-icons-round">warning</span>
          <span><b>Root cause:</b> {event.detail}</span>
        </div>

        <div className="drawer-actions">
          <button className="btn-secondary">Open thread</button>
          <button className="btn-primary">Escalate to SOC</button>
        </div>
        </aside>
      </div>
    </>
  );
}

function ChainAuditTab({ threads }) {
  const [active, setActive] = useState("All");
  const [selected, setSelected] = useState(null);

  const liveChainEvents = threads
    .filter(t => t.chain === "broken")
    .map(t => {
      const brokenAtIndex = t.rawReport?.brokenAtIndex !== undefined ? t.rawReport.brokenAtIndex : -1;
      return {
        id: t.id,
        domain: t.domain,
        brokeAt: brokenAtIndex !== -1 ? brokenAtIndex + 1 : 1,
        totalMsgs: t.messages,
        when: t.last || "Just now",
        severity: "Critical",
        detail: `Cryptographic chain validation failed at message ${brokenAtIndex !== -1 ? brokenAtIndex + 1 : 1} â€” earlier content may have been altered.`
      };
    });

  const events = liveChainEvents;

  const tabs = [
    { label: "All", match: () => true },
    { label: "Critical", match: (c) => c.severity === "Critical" },
    { label: "High", match: (c) => c.severity === "High" },
    { label: "Medium", match: (c) => c.severity === "Medium" },
  ];
  const counts = tabs.reduce((acc, t) => {
    acc[t.label] = events.filter(t.match).length;
    return acc;
  }, {});
  const filtered = events.filter(tabs.find((t) => t.label === active).match);

  return (
    <>
      <FilterRow
        tabs={tabs}
        active={active}
        setActive={setActive}
        counts={counts}
        rightSlot={
          <div className="toggles">
            <div className="toggle-row">
              <span><span className="material-icons-round" style={{ fontSize: 13, marginRight: 4, verticalAlign: -2 }}>link_off</span>Breaks, last 7 days</span>
              <span className="avg-trust bad">{events.length}</span>
            </div>
          </div>
        }
      />
      <ChainAuditTable rows={filtered} onOpen={setSelected} selectedId={selected?.id} />
      <ChainDrawer event={selected} onClose={() => setSelected(null)} />
    </>
  );
}

/* ============================================================
   Senders tab
   ============================================================ */

function SendersTable({ rows, onOpen, selectedName }) {
  return (
    <div className="table-wrap">
      <div className="t-row senders-head t-head">
        <div>Risk</div>
        <div>Sender</div>
        <div>Domain</div>
        <div>Behavioral baseline</div>
        <div>Volume (7d)</div>
        <div>Last seen</div>
      </div>
      <div className="t-body">
        {rows.map((s) => {
          const r = RISK_STYLE[s.risk];
          return (
            <div
              key={s.name}
              className={"t-row senders-row t-data" + (s.name === selectedName ? " selected" : "")}
              onClick={(e) => { e.stopPropagation(); onOpen(s); }}
            >
              <div className="c-status">
                <span className="status-dot" style={{ background: r.dot }} />
                <span className={"status-pill " + r.cls}>{r.label}</span>
              </div>
              <div className="c-subject">
                <div className="subj-line">{s.name}</div>
                <div className="subj-sub">{s.role}</div>
              </div>
              <div className="c-domain">{s.domain}</div>
              <div className="c-trust"><TrustBar value={s.baseline} /></div>
              <div className="c-msgs">{s.volume}</div>
              <div className="c-last">{s.lastSeen}</div>
            </div>
          );
        })}
        {rows.length === 0 && <div className="empty-state">No senders match this filter.</div>}
      </div>
    </div>
  );
}

function TrustBar({ value }) {
  const color = value >= 80 ? "var(--green)" : value >= 50 ? "var(--orange)" : "var(--red)";
  return (
    <div className="trust-cell">
      <div className="trust-track"><div className="trust-fill" style={{ width: `${value}%`, background: color }} /></div>
      <span style={{ color }}>{value}%</span>
    </div>
  );
}

function SenderDrawer({ sender, onClose }) {
  if (!sender) return null;
  const r = RISK_STYLE[sender.risk];
  return (
    <>
      <div
        className="drawer-backdrop"
        onClick={onClose}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24, zIndex: 2000,
        }}
      >
        <aside
          className="drawer"
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'relative',
            width: 640, maxWidth: '100%',
            maxHeight: 'calc(100vh - 48px)',
            background: 'var(--panel)', border: '1px solid var(--border)',
            borderRadius: 16,
            boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
            display: 'flex', flexDirection: 'column',
            padding: 24, overflowY: 'auto',
            zIndex: 2001,
          }}
        >
        <div className="drawer-head">
          <div>
            <div className="drawer-id">SENDER PROFILE</div>
            <div className="drawer-title">{sender.name}</div>
          </div>
          <button className="icon-btn-flat" onClick={onClose}><CloseIcon /></button>
        </div>

        <div className="drawer-status-row">
          <span className="status-dot lg" style={{ background: r.dot }} />
          <span className={"status-pill " + r.cls}>{r.label} risk</span>
          <span className="drawer-meta">{sender.role} Â· {sender.domain}</span>
        </div>

        <div className="drawer-section">
          <div className="drawer-section-title">Behavioral baseline</div>
          <div className="signal-row">
            <div className="signal-label"><span className="material-icons-round">history</span> Match to historical pattern</div>
            <div className="signal-track"><div className="signal-fill" style={{ width: `${sender.baseline}%`, background: sender.baseline >= 80 ? "var(--green)" : sender.baseline >= 50 ? "var(--orange)" : "var(--red)" }} /></div>
            <div className="signal-val" style={{ color: sender.baseline >= 80 ? "var(--green)" : sender.baseline >= 50 ? "var(--orange)" : "var(--red)" }}>{sender.baseline}%</div>
          </div>
        </div>

        <div className="drawer-section">
          <div className="drawer-section-title">Activity</div>
          <div className="signal-row">
            <div className="signal-label"><span className="material-icons-round">forum</span> Messages, last 7 days</div>
            <div className="signal-val-text">{sender.volume}</div>
          </div>
          <div className="signal-row">
            <div className="signal-label"><span className="material-icons-round">schedule</span> Last seen</div>
            <div className="signal-val-text">{sender.lastSeen}</div>
          </div>
        </div>

        {sender.risk === "high" && (
          <div className="drawer-alert">
            <span className="material-icons-round">warning</span>
            <span><b>Why it's flagged:</b> Behavior deviates sharply from this sender's established baseline â€” review before trusting new requests.</span>
          </div>
        )}

        <div className="drawer-actions">
          <button className="btn-secondary">View threads</button>
          <button className="btn-primary">{sender.risk === "high" ? "Block sender" : "Mark trusted"}</button>
        </div>
        </aside>
      </div>
    </>
  );
}

function SendersTab({ threads }) {
  const [active, setActive] = useState("All");
  const [selected, setSelected] = useState(null);

  const liveSenders = [];
  threads.forEach(t => {
    if (t.rawReport?.messages) {
      t.rawReport.messages.forEach(m => {
        let senderEmail = m.sender;
        let senderName = m.sender;
        if (m.sender.includes("<") && m.sender.includes(">")) {
          senderName = m.sender.substring(0, m.sender.indexOf("<")).trim();
          senderEmail = m.sender.substring(m.sender.indexOf("<") + 1, m.sender.indexOf(">")).trim();
        }
        
        let existing = liveSenders.find(s => s.email === senderEmail);
        if (!existing) {
          existing = {
            name: senderName || senderEmail,
            role: senderEmail.includes("internal") || senderEmail.includes("company.com") || senderEmail.includes("Sudarshana.io") ? "SOC Analyst" : "External contact",
            domain: t.domain,
            email: senderEmail,
            baseline: t.trust,
            volume: 0,
            lastSeen: t.last || "Just now",
            risk: "low"
          };
          liveSenders.push(existing);
        }
        existing.volume += 1;
        
        let risk = "low";
        if (m.combinedRiskScore > 75) risk = "high";
        else if (m.combinedRiskScore > 40) risk = "medium";
        
        if (risk === "high") existing.risk = "high";
        else if (risk === "medium" && existing.risk !== "high") existing.risk = "medium";
        
        const msgTrust = Math.round(100 - m.combinedRiskScore);
        if (msgTrust < existing.baseline) {
          existing.baseline = msgTrust;
        }
      });
    }
  });

  const rows = liveSenders;

  const counts = SENDER_TABS.reduce((acc, t) => {
    acc[t.label] = rows.filter(t.match).length;
    return acc;
  }, {});
  const filtered = rows.filter(SENDER_TABS.find((t) => t.label === active).match);

  return (
    <>
      <FilterRow
        tabs={SENDER_TABS}
        active={active}
        setActive={setActive}
        counts={counts}
        rightSlot={
          <div className="toggles">
            <div className="toggle-row">
              <span><span className="material-icons-round" style={{ fontSize: 13, marginRight: 4, verticalAlign: -2 }}>groups</span>Tracked senders</span>
              <span className="avg-trust">{rows.length}</span>
            </div>
          </div>
        }
      />
      <SendersTable rows={filtered} onOpen={setSelected} selectedName={selected?.name} />
      <SenderDrawer sender={selected} onClose={() => setSelected(null)} />
    </>
  );
}

/* ============================================================
   page
   ============================================================ */

const SECTION_SUBS = {
  auth: "SPF / DKIM / DMARC authentication audit · live",
  chain: "Cryptographic chain-of-custody break feed · live",
  senders: "Sender directory & behavioral baselines · live",
};

const RANGE_OPTIONS = [
  { label: "Last 7 days", days: 7 },
  { label: "Last 14 days", days: 14 },
  { label: "Last 30 days", days: 30 },
  { label: "All time", days: 0 },
];


export default function SecurityPosturePage() {
  const [section, setSection] = useState("auth");
  const [threads, setThreads] = useState([]);
  const [dateRange, setDateRange] = useState(RANGE_OPTIONS[0]);
  const [showRangeMenu, setShowRangeMenu] = useState(false);
  const rangeMenuRef = React.useRef(null);

  React.useEffect(() => {
    if (!showRangeMenu) return;
    const handler = (e) => {
      if (rangeMenuRef.current && !rangeMenuRef.current.contains(e.target)) setShowRangeMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showRangeMenu]);

  useEffect(() => {
    const fetchPostureData = async () => {
      try {
        const userId = localStorage.getItem("selectedUserId") || "";
        let url = `/api/threads${userId ? `?userId=${userId}` : ""}`;
        if (dateRange.days > 0) {
          const startDate = Date.now() - dateRange.days * 24 * 60 * 60 * 1000;
          url += `${userId ? "&" : "?"}startDate=${startDate}`;
        }
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          const mapped = data.map(mapReportToThread);
          setThreads(mapped);
        }
      } catch {
        // backend offline
      }
    };
    fetchPostureData();

    const handleUserChange = () => {
      fetchPostureData();
    };
    window.addEventListener('tg-user-changed', handleUserChange);
    return () => window.removeEventListener('tg-user-changed', handleUserChange);
  }, [dateRange]);

  return (
    <>
      <style>{`

  /* page header (shared with ThreadsPage) */
  .page-header{ display:flex; align-items:center; justify-content:space-between; }
  .page-sub{ font-size:13px; color: var(--text-dimmer); }
  .range-btn{
    display:flex; align-items:center; gap:8px;
    background: var(--panel); border:1px solid var(--border);
    border-radius:999px; padding:9px 14px; font-size:13px; color: var(--text-dim);
  }
  .range-btn .material-icons-round{ font-size:13px; }

  /* section tabs (Auth Health / Chain Audit / Senders) */
  .section-tabs{
    display:flex; align-items:center; gap:6px;
    background: var(--panel); border:1px solid var(--border);
    border-radius: var(--radius-lg); padding:6px;
  }
  .section-tab{
    display:flex; align-items:center; gap:7px;
    flex:1; justify-content:center;
    padding:10px 14px; border-radius:10px;
    font-size:13px; font-weight:600; color: var(--text-dim);
    cursor:pointer; transition: background .15s ease, color .15s ease;
  }
  .section-tab .material-icons-round{ font-size:15px; }
  .section-tab:hover{ color: var(--text); background: var(--panel-2); }
  .section-tab.active{ background: var(--panel-3); color: var(--text); }

  /* filter row (shared) */
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
    background: var(--panel-3); color: var(--text);
    font-size:11px; font-weight:600; padding:1px 7px; border-radius:999px;
  }
  .tab.active b{ background: var(--panel); color:var(--text); }
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
  .avg-trust.bad{ color: var(--red); }

  /* table (shared grid mechanics, per-tab column templates) */
  .table-wrap{
    flex:1; min-height:0; overflow:auto;
    border:1px solid var(--border);
    border-radius: var(--radius-lg);
    background: var(--panel);
    scrollbar-width: thin;
    scrollbar-color: var(--border-2, rgba(255,255,255,0.18)) transparent;
  }
  .table-wrap::-webkit-scrollbar{ height:5px; width:5px; }
  .table-wrap::-webkit-scrollbar-track{ background: transparent; }
  .table-wrap::-webkit-scrollbar-thumb{ background: var(--border-2, rgba(255,255,255,0.18)); border-radius:999px; }
  .table-wrap::-webkit-scrollbar-thumb:hover{ background: var(--text-dimmer); }
  .t-row{
    display:grid;
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

  .auth-head, .auth-row{ grid-template-columns: 1.4fr 90px 90px 110px 110px 80px; min-width: 680px; }
  .chain-head, .chain-row{ grid-template-columns: 130px 110px 170px 1fr 120px 110px; min-width: 780px; }
  .senders-head, .senders-row{ grid-template-columns: 110px 1.4fr 170px 150px 100px 110px; min-width: 780px; }

  .c-domain-main{ font-size:13.5px; font-weight:600; color: var(--text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .c-domain{ font-size:12.5px; color: var(--text-dim); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .c-msgs{ font-size:12.5px; color: var(--text-dim); }
  .c-last{ font-size:12px; color: var(--text-dimmer); white-space:nowrap; }
  .c-trend{ display:flex; }
  .c-trend .material-icons-round{ font-size:16px; }
  .trend-up{ color: var(--green); }
  .trend-down{ color: var(--red); }
  .trend-flat{ color: var(--text-dimmer); }

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

  .auth-pill{
    font-size:11px; font-weight:600; padding:3px 9px; border-radius:999px; white-space:nowrap;
    display:inline-block;
  }
  .auth-pill.pass{ background: var(--green-bg); color: var(--green); }
  .auth-pill.warn{ background: var(--orange-bg); color: var(--orange); }
  .auth-pill.fail{ background: var(--red-bg); color: var(--red); }

  .c-subject{ min-width:0; }
  .subj-line{
    font-size:13.5px; font-weight:600; color: var(--text);
    white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
  }
  .subj-sub{
    font-size:11.5px; color: var(--text-dimmer); margin-top:2px;
    white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
  }

  .trust-cell{ display:flex; align-items:center; gap:8px; font-size:12.5px; font-weight:600; }
  .trust-track{ width:54px; height:6px; border-radius:999px; background:var(--border); overflow:hidden; }
  .trust-fill{ height:100%; border-radius:999px; }

  .empty-state{ padding:40px; text-align:center; color: var(--text-dimmer); font-size:13px; }

  @media (max-width: 1100px){
    .auth-head, .auth-row{ grid-template-columns: 1.4fr 90px 90px 110px 110px 80px; }
    .chain-head, .chain-row{ grid-template-columns: 130px 110px 170px 1fr 120px 110px; }
    .senders-head, .senders-row{ grid-template-columns: 110px 1.4fr 170px 150px 100px 110px; }
  }

  /* ---------------- drawer / modal (shared with ThreadsPage, ReportsPage) ---------------- */
  .drawer-backdrop{
    position:fixed; inset:0; background: rgba(0,0,0,0.6);
    backdrop-filter: blur(3px); z-index:20;
    animation: fadeIn .15s ease;
    display:flex; align-items:center; justify-content:center;
    padding:24px;
  }
  .drawer{
    position:relative;
    width:480px; max-width:100%;
    max-height: calc(100vh - 48px);
    background: var(--panel-2);
    border:1px solid var(--border-2);
    border-radius: var(--radius-lg);
    box-shadow: 0 30px 80px rgba(0,0,0,0.6);
    z-index:21;
    display:flex; flex-direction:column;
    padding:24px;
    overflow-y:auto;
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
    color: var(--text-dimmer, #9a9aa5);
    background: rgba(255,255,255,0.06);
    border: 1px solid var(--border-2, rgba(255,255,255,0.1));
    flex-shrink:0;
  }
  .icon-btn-flat svg{ color: inherit; stroke: currentColor; display:block; }
  .icon-btn-flat:hover{ background: var(--panel-3, rgba(255,255,255,0.12)); color: var(--text, #fff); }
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
    flex:1; font-size:12px; color: var(--text-dim);
    display:flex; align-items:center; gap:6px;
  }
  .signal-label .material-icons-round{ font-size:13px; flex-shrink:0; }
  .signal-track{ flex:1; height:6px; border-radius:999px; background:var(--border); overflow:hidden; }
  .signal-fill{ height:100%; border-radius:999px; }
  .signal-val{ width:36px; text-align:right; font-size:12px; font-weight:700; }
  .signal-val-text{ font-size:12.5px; font-weight:600; color: var(--text); flex-shrink:0; }

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
  .hashline.sm{ max-width:220px; }
  .hash-node{
    width:14px; height:14px; border-radius:999px;
    background: var(--green); flex-shrink:0;
    box-shadow: 0 0 0 3px rgba(116,224,138,0.18);
  }
  .hash-node.sm{ width:9px; height:9px; box-shadow: 0 0 0 2px rgba(116,224,138,0.18); }
  .hash-node.bad{ background: var(--red); box-shadow: 0 0 0 3px rgba(239,106,95,0.18); }
  .hash-node.sm.bad{ box-shadow: 0 0 0 2px rgba(239,106,95,0.18); }
  .hash-link{ flex:1; height:2px; background: var(--border-2); min-width:6px; }
  .hash-link.bad{ background: repeating-linear-gradient(90deg, var(--red) 0 4px, transparent 4px 8px); }
  .hash-caption{ font-size:11.5px; color: var(--text-dimmer); margin-top:10px; line-height:1.5; }

  .drawer-actions{ display:flex; gap:10px; margin-top:24px; padding-top:18px; border-top:1px solid var(--border); }
  .btn-secondary, .btn-primary{
    flex:1; padding:11px; border-radius:12px; font-size:13px; font-weight:600; text-align:center;
    font-family: 'Poppins', sans-serif;
  }
  .btn-secondary{ background: var(--panel-3); color: var(--text); }
  .btn-secondary:hover{ background: var(--panel); }
  .btn-primary{ background: var(--accent); color:#111; }
  .btn-primary:hover{ filter: brightness(0.95); }

  @media (max-width: 640px){
    .section-tabs{ flex-wrap: wrap; border-radius: 14px; padding: 4px; }
    .stab{ font-size: 12px; padding: 6px 10px; }
    .page-header{ flex-direction: column; align-items: stretch; gap: 8px; }
    .drawer-backdrop{ padding: 0; align-items: flex-end; }
    .drawer{ width: 100%; max-width: 100%; border-bottom-left-radius: 0; border-bottom-right-radius: 0; max-height: 85vh; }
    .drawer-actions{ flex-direction: column; }
    .table-wrap{ border-radius: 12px; }
  }

  ::selection{ background: var(--accent-dim); }
`}</style>

      <PageHeader sub={SECTION_SUBS[section]} dateRange={dateRange} setDateRange={setDateRange} showRangeMenu={showRangeMenu} setShowRangeMenu={setShowRangeMenu} rangeMenuRef={rangeMenuRef} />
      <SectionTabs active={section} setActive={setSection} />

      {section === "auth" && <AuthHealthTab threads={threads} />}
      {section === "chain" && <ChainAuditTab threads={threads} />}
      {section === "senders" && <SendersTab threads={threads} />}
    </>
  );
}