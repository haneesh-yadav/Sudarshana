import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../auth/AuthContext';
import { showToast } from '../utils/toast';

/**
 * SettingsPage
 * Renders as a modal popup overlay.
 * 
 * Usage:
 *   import SettingsPage from './SettingsPage';
 *   <SettingsPage open={showSettings} onClose={() => setShowSettings(false)} />
 *
 * The Sidebar's Settings button should set showSettings=true instead of
 * navigating to /settings. See Sidebar.jsx for updated integration.
 */

/* ============================================================
   Theme engine (Light / Dark / System)
   Works by overwriting the CSS custom properties (--panel,
   --text, etc.) on :root. Every component across the app reads
   colors from these same variables via var(--panel) etc., so
   changing them here re-themes the entire tool, not just this
   modal.
   ============================================================ */

const THEME_STORAGE_KEY = "tg-theme-mode"; // "system" | "light" | "dark"

const THEME_VARS = {
  dark: {
    "--bg":            "#0f0f10",
    "--panel":         "#1a1a1a",
    "--panel-2":       "#141414",
    "--panel-3":       "rgba(255,255,255,0.07)",
    "--panel-4":       "rgba(255,255,255,0.10)",
    "--border":        "rgba(255,255,255,0.08)",
    "--border-2":      "rgba(255,255,255,0.10)",
    "--text":          "#f0f0f0",
    "--text-dim":      "#a0a0a0",
    "--text-dimmer":   "#777777",
    "--accent":        "#5b8def",
  },
  light: {
    "--bg":            "#f4f4f6",
    "--panel":         "#ffffff",
    "--panel-2":       "#f3f3f5",
    "--panel-3":       "rgba(0,0,0,0.045)",
    "--panel-4":       "rgba(0,0,0,0.08)",
    "--border":        "rgba(0,0,0,0.10)",
    "--border-2":      "rgba(0,0,0,0.08)",
    "--text":          "#1a1a1c",
    "--text-dim":      "#5a5a5e",
    "--text-dimmer":   "#8a8a8e",
    "--accent":        "#3266d6",
  },
};

function getSystemPrefersDark() {
  return typeof window !== "undefined" && window.matchMedia
    ? window.matchMedia("(prefers-color-scheme: dark)").matches
    : true;
}

function resolveEffectiveTheme(mode) {
  if (mode === "light" || mode === "dark") return mode;
  return getSystemPrefersDark() ? "dark" : "light";
}

function applyTheme(mode) {
  const effective = resolveEffectiveTheme(mode);
  const vars = THEME_VARS[effective];
  const root = document.documentElement;
  Object.entries(vars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
  root.setAttribute("data-theme", effective);
  root.style.colorScheme = effective;
}

function setThemeMode(mode) {
  localStorage.setItem(THEME_STORAGE_KEY, mode);
  applyTheme(mode);
}

function getThemeMode() {
  return localStorage.getItem(THEME_STORAGE_KEY) || "system";
}

// Apply immediately on module load so the whole tool is themed
// correctly on first paint, before the Settings modal is ever opened.
if (typeof window !== "undefined") {
  applyTheme(getThemeMode());

  // Keep things in sync if the OS theme changes while mode is "system".
  if (window.matchMedia) {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystemChange = () => {
      if (getThemeMode() === "system") applyTheme("system");
    };
    if (mq.addEventListener) mq.addEventListener("change", onSystemChange);
    else if (mq.addListener) mq.addListener(onSystemChange);
  }
}

/* ============================================================
   UI notification event definitions
   ============================================================ */

const NOTIF_EVENTS = [
  { key: "critical", label: "Critical threat detected", desc: "A thread is flagged Critical or quarantined automatically." },
  { key: "chain", label: "Chain integrity break", desc: "A hash-chain validation failure is detected on any thread." },
  { key: "digest", label: "Weekly security digest", desc: "Summary of the week's activity, every Monday at 6 AM." },
  { key: "report", label: "Report ready", desc: "A scheduled or requested report finishes generating." },
  { key: "sender", label: "New high-risk sender", desc: "A sender's behavioral baseline drops into the High risk tier." },
];

/* ============================================================
   Nav sections (left sidebar of modal)
   ============================================================ */

const NAV_SECTIONS = [
  { group: "Settings", items: [
    { key: "profile",       label: "General",         iconName: "settings"           },
    { key: "account",       label: "Account",         iconName: "person"             },
    { key: "notifications", label: "Notifications",   iconName: "notifications_none" },
    { key: "security",      label: "Security Config", iconName: "admin_panel_settings" },
  ]},
  { group: "Customize", items: [
    { key: "integrations",  label: "Connectors",      iconName: "hub"                },
    { key: "apikeys",       label: "Plugins",         iconName: "extension"          },
  ]},
];

/* ============================================================
   Searchable settings index â€” flat list of every setting/control
   so the sidebar search can find a setting and tell you which
   section it lives in (e.g. searching "Change Password" finds
   it under Account).
   ============================================================ */

const SEARCH_INDEX = [
  // General
  { label: "Avatar",                              sectionKey: "profile" },
  { label: "Full name",                           sectionKey: "profile" },
  { label: "Email",                               sectionKey: "profile" },
  { label: "What best describes your work?",      sectionKey: "profile" },
  { label: "Appearance",                          sectionKey: "profile" },

  // Account
  { label: "Log out of all devices",              sectionKey: "account" },
  { label: "Delete account",                      sectionKey: "account" },
  { label: "Organization ID",                     sectionKey: "account" },
  { label: "Change Password",                     sectionKey: "account" },
  { label: "Current password",                    sectionKey: "account" },
  { label: "New password",                        sectionKey: "account" },
  { label: "Confirm new password",                sectionKey: "account" },

  // Notifications
  { label: "Critical threat detected",            sectionKey: "notifications" },
  { label: "Chain integrity break",                sectionKey: "notifications" },
  { label: "Weekly security digest",               sectionKey: "notifications" },
  { label: "Report ready",                         sectionKey: "notifications" },
  { label: "New high-risk sender",                 sectionKey: "notifications" },

  // Security Config
  { label: "DMARC Enforcement",                    sectionKey: "security" },
  { label: "Alert Thresholds",                     sectionKey: "security" },
  { label: "Auto-flag threads below trust score",  sectionKey: "security" },
  { label: "Escalate NLP risk above score",        sectionKey: "security" },

  // Connectors
  { label: "GitHub Integration",                   sectionKey: "integrations" },
  { label: "Gmail",                                sectionKey: "integrations" },
  { label: "Google Calendar",                      sectionKey: "integrations" },
  { label: "Google Drive",                         sectionKey: "integrations" },

  // Plugins
  { label: "Plugins",                              sectionKey: "apikeys" },
];

const SECTION_LOOKUP = NAV_SECTIONS.flatMap(g => g.items).reduce((acc, item) => {
  acc[item.key] = item;
  return acc;
}, {});

function highlightMatch(label, query) {
  if (!query) return label;
  const idx = label.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return label;
  const before = label.slice(0, idx);
  const match = label.slice(idx, idx + query.length);
  const after = label.slice(idx + query.length);
  return (
    <>
      {before}<span className="sp-search-hit">{match}</span>{after}
    </>
  );
}

/* ============================================================
   Shared helpers
   ============================================================ */

function SettingsCard({ title, sub, children, actions }) {
  return (
    <div className="sp-card">
      <div className="sp-card-head">
        <div>
          <div className="sp-card-title">{title}</div>
          {sub && <div className="sp-card-sub">{sub}</div>}
        </div>
        {actions}
      </div>
      <div className="sp-card-body">{children}</div>
    </div>
  );
}

function Toggle({ on, onClick }) {
  return (
    <div className={"sp-switch" + (on ? " on" : "")} onClick={onClick}>
      <i />
    </div>
  );
}

/* ============================================================
   General tab (was Profile)
   ============================================================ */

const COUNTRY_CODES = [
  { code: "+91", flag: "ðŸ‡®ðŸ‡³", name: "India" },
  { code: "+1",  flag: "ðŸ‡ºðŸ‡¸", name: "United States" },
  { code: "+44", flag: "ðŸ‡¬ðŸ‡§", name: "United Kingdom" },
  { code: "+61", flag: "ðŸ‡¦ðŸ‡º", name: "Australia" },
  { code: "+49", flag: "ðŸ‡©ðŸ‡ª", name: "Germany" },
  { code: "+33", flag: "ðŸ‡«ðŸ‡·", name: "France" },
  { code: "+81", flag: "ðŸ‡¯ðŸ‡µ", name: "Japan" },
  { code: "+86", flag: "ðŸ‡¨ðŸ‡³", name: "China" },
  { code: "+971", flag: "ðŸ‡¦ðŸ‡ª", name: "UAE" },
  { code: "+65", flag: "ðŸ‡¸ðŸ‡¬", name: "Singapore" },
];

function WorkSelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const OPTIONS = [
    { value: "", label: "Select" },
    { value: "engineering", label: "Engineering" },
    { value: "design", label: "Design" },
    { value: "product", label: "Product" },
    { value: "security", label: "Security" },
    { value: "student", label: "Student" },
    { value: "other", label: "Other" },
  ];
  const current = OPTIONS.find(o => o.value === value) || OPTIONS[0];

  useEffect(() => {
    const onClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="sp-custom-select" ref={wrapRef}>
      <button
        type="button"
        className={"sp-custom-select-trigger" + (open ? " open" : "")}
        onClick={() => setOpen(o => !o)}
      >
        <span>{current.label}</span>
        <span className="material-icons-round sp-custom-select-caret">expand_more</span>
      </button>
      {open && (
        <div className="sp-custom-select-menu">
          {OPTIONS.map(o => (
            <div
              key={o.value || "none"}
              className={"sp-custom-select-option" + (o.value === value ? " selected" : "")}
              onClick={() => { onChange(o.value); setOpen(false); }}
            >
              {o.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GeneralTab({ settings }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail]       = useState("");
  const [work, setWork]         = useState("");
  const [appearance, setAppearance] = useState(() => getThemeMode());

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userId = localStorage.getItem("selectedUserId");
        const res = await fetch("/api/users");
        if (res.ok) {
          const users = await res.json();
          const user = userId ? users.find(u => String(u.id) === userId) : users[0];
          if (user) {
            setFullName(user.fullName || "");
            setEmail(user.email || "");
            return;
          }
        }
      } catch (_) {}
      if (settings) {
        setFullName(settings.name || "");
        setEmail(settings.email || "");
      }
    };
    fetchUser();
  }, [settings]);

  const getInitials = (n) => !n ? "â€“" : n.split(" ").map(p => p[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="sp-tab-content">

      <div className="sp-row">
        <div className="sp-row-label">Avatar</div>
        <div className="sp-row-control">
          <div className="sp-avatar-sm">{getInitials(fullName)}</div>
        </div>
      </div>

      {/* Read-only â€” data comes from Google OAuth */}
      <div className="sp-row">
        <div className="sp-row-label">Full name</div>
        <div className="sp-row-control">
          <input className="sp-row-input" type="text" value={fullName} readOnly
            style={{ opacity: 0.72, cursor: 'default', userSelect: 'text', width: `${fullName.length + 2}ch` }} />
        </div>
      </div>

      <div className="sp-row">
        <div className="sp-row-label">Email</div>
        <div className="sp-row-control">
          <input className="sp-row-input" type="text" value={email} readOnly
            style={{ opacity: 0.72, cursor: 'default', userSelect: 'text', width: `${email.length + 2}ch` }} />
        </div>
      </div>

      <div className="sp-row">
        <div className="sp-row-label">What best describes your work?</div>
        <div className="sp-row-control">
          <WorkSelect value={work} onChange={setWork} />
        </div>
      </div>

      <div className="sp-row">
        <div className="sp-row-label">Appearance</div>
        <div className="sp-row-control">
          <div className="sp-segmented sp-segmented-icons">
            <button className={"sp-segmented-btn" + (appearance === "system" ? " active" : "")} onClick={() => { setAppearance("system"); setThemeMode("system"); }}>
              <span className="material-icons-round">desktop_windows</span>
            </button>
            <button className={"sp-segmented-btn" + (appearance === "light" ? " active" : "")} onClick={() => { setAppearance("light"); setThemeMode("light"); }}>
              <span className="material-icons-round">light_mode</span>
            </button>
            <button className={"sp-segmented-btn" + (appearance === "dark" ? " active" : "")} onClick={() => { setAppearance("dark"); setThemeMode("dark"); }}>
              <span className="material-icons-round">dark_mode</span>
            </button>
          </div>
        </div>
      </div>

      
    </div>
  );
}

/* ============================================================
   Delete Account confirmation modal
   ============================================================ */
function DeleteAccountModal({ onConfirm, onCancel }) {
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 80); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim()) { setError('Please enter your password.'); return; }
    setLoading(true);
    setError('');
    try {
      const userId = localStorage.getItem('selectedUserId');
      const verifyRes = await fetch(`/api/users/${userId}/verify-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      if (verifyRes.ok) {
        const result = await verifyRes.json();
        if (!result.verified) {
          setError('Incorrect password. Please try again.');
          setLoading(false);
          return;
        }
      } else {
        setError('Could not verify password. Try again later.');
        setLoading(false);
        return;
      }
    } catch (_) {
      setError('Network error. Check your connection.');
      setLoading(false);
      return;
    }
    await onConfirm();
    setLoading(false);
  };

  return (
    <div className="da-overlay" onClick={e => { if (e.target.classList.contains('da-overlay')) onCancel(); }}>
      <div className="da-card" role="dialog" aria-modal="true">
        <div className="da-header">
          <div className="da-icon-wrap">
            <span className="material-icons-round">delete_forever</span>
          </div>
          <h2 className="da-title">Delete Account</h2>
        </div>
        <hr className="da-divider" />
        <p className="da-desc">
          This action is <strong>permanent</strong> and cannot be undone.
          All your email sync data, threads, and settings will be wiped.
        </p>
        <form onSubmit={handleSubmit}>
          <label className="da-label">Confirm your password to continue</label>
          <input
            ref={inputRef}
            className="da-input"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(''); }}
            autoComplete="current-password"
          />
          {error && <div className="da-error">{error}</div>}
          <div className="da-actions">
            <button type="button" className="da-btn-cancel" onClick={onCancel} disabled={loading}>Cancel</button>
            <button type="submit" className="da-btn-danger" disabled={loading}>
              {loading ? 'Deletingâ€¦' : 'Delete Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ============================================================
   Account tab
   ============================================================ */
function AccountTab({ onDeleteAccount }) {
  const ORG_ID = '82488375-bb61-479b-9016-8aaedd14161f';
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleDeleteConfirmed = async () => {
    await onDeleteAccount();
    setShowDeleteModal(false);
  };

  return (
    <div className="sp-tab-content">

      {showDeleteModal && (
        <DeleteAccountModal
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}

      <div className="sp-row">
        <div className="sp-row-label">Log out of all devices</div>
        <div className="sp-row-control">
          <button className="sp-btn-ghost sm">Log out</button>
        </div>
      </div>

      <div className="sp-row">
        <div className="sp-row-label">Delete your account</div>
        <div className="sp-row-control">
          <button className="sp-btn-white sm" onClick={() => setShowDeleteModal(true)}>Delete account</button>
        </div>
      </div>

      <div className="sp-row">
        <div className="sp-row-label">Organization ID</div>
        <div className="sp-row-control">
          <span className="sp-id-pill">{ORG_ID}</span>
        </div>
      </div>

      <h2 className="sp-block-title sp-block-title-spaced">Change Password</h2>
      <PrivacyFields />
    </div>
  );
}

/* ============================================================
   Privacy fields (was Change Password tab) â€” now embedded in Account
   ============================================================ */
function PrivacyFields() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const RULES = [
    { test: (v) => v.length >= 8, label: "At least 8 characters" },
    { test: (v) => /[A-Z]/.test(v), label: "One uppercase letter" },
    { test: (v) => /[0-9]/.test(v), label: "One number" },
    { test: (v) => /[^A-Za-z0-9]/.test(v), label: "One special character" },
  ];

  const mismatch = confirm.length > 0 && next !== confirm;
  const allRulesMet = RULES.every((r) => r.test(next));
  const canSubmit = current.length > 0 && allRulesMet && !mismatch && confirm.length > 0 && !loading;

  const handleChangePassword = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next })
      });
      const data = await res.json();
      if (data.status === "SUCCESS") {
        setSuccess("Password updated successfully.");
        setCurrent("");
        setNext("");
        setConfirm("");
      } else {
        setError(data.message || "Failed to change password.");
      }
    } catch (_) {
      setError("Network error. Check your connection.");
    }
    setLoading(false);
  };

  return (
    <div className="sp-privacy-fields">
      <div className="sp-pw-top">
        <div className="sp-field-group sp-field-group-narrow">
          <div className="sp-field">
            <label className="sp-label">Current password</label>
            <div className="sp-pw-wrap">
              <input type={showCurrent ? "text" : "password"} className="sp-input" placeholder="Enter your current password" value={current} onChange={e => { setCurrent(e.target.value); setError(""); setSuccess(""); }} />
              <button type="button" className="sp-pw-toggle" onClick={() => setShowCurrent(v => !v)}>
                <span className="material-icons-round">{showCurrent ? "visibility_off" : "visibility"}</span>
              </button>
            </div>
          </div>
          <div className="sp-field">
            <label className="sp-label">New password</label>
            <div className="sp-pw-wrap">
              <input type={showNext ? "text" : "password"} className="sp-input" placeholder="Enter a new password" value={next} onChange={e => { setNext(e.target.value); setError(""); setSuccess(""); }} />
              <button type="button" className="sp-pw-toggle" onClick={() => setShowNext(v => !v)}>
                <span className="material-icons-round">{showNext ? "visibility_off" : "visibility"}</span>
              </button>
            </div>
          </div>
          <div className="sp-field">
            <label className="sp-label">Confirm new password</label>
            <input type="password" className={"sp-input" + (mismatch ? " sp-input-error" : "")} placeholder="Re-enter the new password" value={confirm} onChange={e => { setConfirm(e.target.value); setError(""); setSuccess(""); }} />
            {mismatch && <div className="sp-field-error">Passwords don't match.</div>}
          </div>
        </div>
        <div className="sp-pw-rules">
          {RULES.map(r => {
            const met = r.test(next);
            return (
              <div key={r.label} className={"sp-pw-rule" + (met ? " met" : "")}>
                <span className="material-icons-round">{met ? "check_circle" : "radio_button_unchecked"}</span>
                {r.label}
              </div>
            );
          })}
        </div>
      </div>

      {error && <div style={{ color: "#ef6a5f", fontSize: "13px", marginBottom: "8px" }}>{error}</div>}
      {success && <div style={{ color: "#74e08a", fontSize: "13px", marginBottom: "8px" }}>{success}</div>}

      <div className="sp-actions sp-actions-plain">
        <button className="sp-btn-accent" disabled={!canSubmit} onClick={handleChangePassword}>
          {loading ? "Updating..." : "Update password"}
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   Notifications tab
   ============================================================ */
function NotificationsTab() {
  const [prefs, setPrefs] = useState(
    NOTIF_EVENTS.reduce((acc, p) => { acc[p.key] = { email: false, push: false }; return acc; }, {})
  );
  const toggle = (key, channel) =>
    setPrefs(prev => ({ ...prev, [key]: { ...prev[key], [channel]: !prev[key][channel] } }));

  return (
    <div className="sp-tab-content">
      <div className="sp-notif-grid">
        <div className="sp-notif-head">
          <span>Event</span><span>Email</span><span>Push</span>
        </div>
        {NOTIF_EVENTS.map(p => (
          <div key={p.key} className="sp-notif-row">
            <div>
              <div className="sp-notif-label">{p.label}</div>
              <div className="sp-notif-desc">{p.desc}</div>
            </div>
            <div className="sp-notif-toggle"><Toggle on={prefs[p.key].email} onClick={() => toggle(p.key, "email")} /></div>
            <div className="sp-notif-toggle"><Toggle on={prefs[p.key].push} onClick={() => toggle(p.key, "push")} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   Security Config tab
   ============================================================ */
function SecurityTab({ settings, onUpdate }) {
  const policy = settings?.dmarcMode || "quarantine";
  const POLICIES = [
    { key: "none",       label: "None",       desc: "Monitor only, take no action." },
    { key: "quarantine", label: "Quarantine", desc: "Suspicious mail is held for review." },
    { key: "reject",     label: "Reject",     desc: "Suspicious mail is rejected outright." },
  ];
  const [trustFloor, setTrustFloor] = useState(50);
  const [nlpFloor,   setNlpFloor]   = useState(65);

  useEffect(() => {
    if (settings) {
      setTrustFloor(100 - (settings.combinedRiskThreshold || 75));
      setNlpFloor(settings.nlpRiskThreshold || 65);
    }
  }, [settings]);

  return (
    <div className="sp-tab-content">
      <div className="sp-section-header">
        <h2 className="sp-section-title">DMARC Enforcement</h2>
        <p className="sp-section-desc">Default policy applied org-wide when a domain doesn't override it.</p>
      </div>
      <div className="sp-policy-options">
        {POLICIES.map(p => (
          <div key={p.key} className={"sp-policy-opt" + (policy === p.key ? " active" : "")} onClick={() => onUpdate({ dmarcMode: p.key })}>
            <div className="sp-policy-head">
              <span className={"sp-radio" + (policy === p.key ? " on" : "")} />
              <span className="sp-policy-label">{p.label}</span>
            </div>
            <div className="sp-policy-desc">{p.desc}</div>
          </div>
        ))}
      </div>

      <div className="sp-divider" />

      <div className="sp-section-header">
        <h2 className="sp-section-title">Alert Thresholds</h2>
        <p className="sp-section-desc">Tune sensitivity for automatic flags and escalations.</p>
      </div>
      <div className="sp-field-group sp-field-group-narrow">
        <div className="sp-field">
          <label className="sp-label">Auto-flag threads below trust score</label>
          <div className="sp-slider-row">
            <input type="range" min="0" max="100" value={trustFloor} onChange={e => setTrustFloor(Number(e.target.value))} className="sp-range" />
            <span className="sp-slider-val">{trustFloor}%</span>
          </div>
        </div>
        <div className="sp-field">
          <label className="sp-label">Escalate NLP risk above score</label>
          <div className="sp-slider-row">
            <input type="range" min="0" max="100" value={nlpFloor} onChange={e => setNlpFloor(Number(e.target.value))} className="sp-range" />
            <span className="sp-slider-val">{nlpFloor}%</span>
          </div>
        </div>
      </div>
      <div className="sp-actions">
        <button className="sp-btn-accent" onClick={() => onUpdate({ combinedRiskThreshold: 100 - trustFloor, nlpRiskThreshold: nlpFloor })}>
          Save thresholds
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   IMAP Test Connection modal (used inside ConnectorsTab)
   ============================================================ */
function ImapTestModal({ onClose }) {
  const [host,     setHost]     = React.useState("imap.gmail.com");
  const [port,     setPort]     = React.useState(993);
  const [user,     setUser]     = React.useState("");
  const [pass,     setPass]     = React.useState("");
  const [status,   setStatus]   = React.useState(null); // null | "loading" | "success" | "error"
  const [message,  setMessage]  = React.useState("");

  const test = async () => {
    if (!host || !user || !pass) { setStatus("error"); setMessage("Host, username, and password are required."); return; }
    setStatus("loading"); setMessage("");
    try {
      const res = await fetch("/api/settings/test-imap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ host, port: Number(port), username: user, password: pass })
      });
      const data = await res.json();
      if (data.status === "SUCCESS") { setStatus("success"); setMessage(data.message); }
      else { setStatus("error"); setMessage(data.message || "Connection failed."); }
    } catch (err) {
      setStatus("error"); setMessage("Network error: " + err.message);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}
         onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "var(--surface-2, #1e1e28)", border: "1px solid var(--border)", borderRadius: 16, padding: 28, width: 420, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="material-icons-round" style={{ color: "var(--accent)" }}>wifi_tethering</span>
            <span style={{ fontWeight: 600, fontSize: 15 }}>Test IMAP Connection</span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-dimmer)", fontSize: 20, lineHeight: 1 }}>&times;</button>
        </div>
        <p style={{ fontSize: 12, color: "var(--text-dimmer)", margin: 0, lineHeight: 1.5 }}>
          Credentials are used only for this test and are not stored.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 3 }}>
              <label className="sp-label">IMAP Host</label>
              <input className="sp-input" value={host} onChange={e => setHost(e.target.value)} placeholder="imap.gmail.com" />
            </div>
            <div style={{ flex: 1 }}>
              <label className="sp-label">Port</label>
              <input className="sp-input" type="number" value={port} onChange={e => setPort(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="sp-label">Username / Email</label>
            <input className="sp-input" value={user} onChange={e => setUser(e.target.value)} placeholder="you@example.com" autoComplete="username" />
          </div>
          <div>
            <label className="sp-label">App Password</label>
            <input className="sp-input" type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="App-specific password" autoComplete="current-password" />
          </div>
        </div>
        {status === "success" && (
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start", background: "rgba(52,199,89,0.08)", border: "1px solid rgba(52,199,89,0.2)", borderRadius: 8, padding: "10px 12px" }}>
            <span className="material-icons-round" style={{ color: "var(--green)", fontSize: 18 }}>check_circle</span>
            <span style={{ fontSize: 12.5, color: "var(--green)", lineHeight: 1.5 }}>{message}</span>
          </div>
        )}
        {status === "error" && (
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start", background: "rgba(232,84,63,0.08)", border: "1px solid rgba(232,84,63,0.2)", borderRadius: 8, padding: "10px 12px" }}>
            <span className="material-icons-round" style={{ color: "var(--red)", fontSize: 18 }}>error_outline</span>
            <span style={{ fontSize: 12.5, color: "var(--red)", lineHeight: 1.5 }}>{message}</span>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4 }}>
          <button className="sp-btn-ghost sm" onClick={onClose}>Cancel</button>
          <button className="sp-btn-accent" onClick={test} disabled={status === "loading"} style={{ minWidth: 120 }}>
            {status === "loading" ? "Testingâ€¦" : "Test Connection"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Connectors tab (table layout, matches reference screenshot)
   ============================================================ */
function ConnectorsTab({ settings, onUpdate }) {
  const integrations = settings?.integrationStatuses || {};
  const [showImapTest, setShowImapTest] = React.useState(false);

  const toggleGmail = () => {
    const current = integrations["Gmail"] || "Not connected";
    onUpdate({ integrationStatuses: { ...integrations, "Gmail": current === "Connected" ? "Not connected" : "Connected" } });
  };

  const GMAIL_CONNECTED = (integrations["Gmail"] || "Not connected") === "Connected";

  const PLANNED = [
    { name: "GitHub Integration",  iconName: "code",                desc: "Link GitHub alerts to email threat timelines." },
    { name: "Google Calendar",     iconName: "calendar_month",      desc: "Cross-reference meeting invites with BEC patterns." },
    { name: "Google Drive",        iconName: "drive_folder_upload", desc: "Scan Drive attachments for malicious content." },
  ];

  return (
    <div className="sp-tab-content">
      {showImapTest && <ImapTestModal onClose={() => setShowImapTest(false)} />}

      <div className="sp-section-header" style={{ marginBottom: 4 }}>
        <h2 className="sp-section-title">Active Connectors</h2>
        <p className="sp-section-desc">Integrations that are live and syncing with Sudarshana.</p>
      </div>

      <div className="sp-table" style={{ marginBottom: 24 }}>
        <div className="sp-table-row sp-table-row-head">
          <span>Connector</span>
          <span>Type</span>
          <span style={{ textAlign: "right" }}>Actions</span>
        </div>

        <div className="sp-table-row">
          <div className="sp-table-cell-main">
            <div className="sp-table-icon"><span className="material-icons-round">mail</span></div>
            <div>
              <div className="sp-table-name">Gmail / Google Workspace</div>
              <div style={{ fontSize: 11, color: "var(--text-dimmer)", marginTop: 2 }}>
                {GMAIL_CONNECTED
                  ? "OAuth2 connected Â· IMAP polling active (30 s)"
                  : "Connect via Google OAuth2 to enable IMAP sync"}
              </div>
            </div>
          </div>
          <span className="sp-table-type">
            {GMAIL_CONNECTED
              ? <span style={{ color: "var(--green)", fontWeight: 600, fontSize: 11 }}>â— Connected</span>
              : <span style={{ color: "var(--text-dimmer)", fontSize: 11 }}>Not connected</span>}
          </span>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            {GMAIL_CONNECTED && (
              <button className="sp-table-connect-btn" style={{ background: "transparent", border: "1px solid var(--border)" }}
                      onClick={() => setShowImapTest(true)}>
                Test IMAP
              </button>
            )}
            <button className={GMAIL_CONNECTED ? "sp-btn-ghost sm" : "sp-table-connect-btn"} onClick={toggleGmail}>
              {GMAIL_CONNECTED ? "Disconnect" : "Connect"}
            </button>
          </div>
        </div>
      </div>

      <div className="sp-section-header" style={{ marginBottom: 4 }}>
        <h2 className="sp-section-title">Planned Integrations</h2>
        <p className="sp-section-desc">These connectors are on the roadmap and not yet available.</p>
      </div>

      <div className="sp-table">
        <div className="sp-table-row sp-table-row-head">
          <span>Connector</span>
          <span>Description</span>
          <span style={{ textAlign: "right" }}>Status</span>
        </div>
        {PLANNED.map(i => (
          <div key={i.name} className="sp-table-row" style={{ opacity: 0.6 }}>
            <div className="sp-table-cell-main">
              <div className="sp-table-icon"><span className="material-icons-round">{i.iconName}</span></div>
              <span className="sp-table-name">{i.name}</span>
            </div>
            <span className="sp-table-type" style={{ fontSize: 11 }}>{i.desc}</span>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-dimmer)", background: "var(--surface-3, rgba(255,255,255,0.06))", border: "1px solid var(--border)", borderRadius: 20, padding: "3px 10px" }}>
                Coming Soon
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   Plugins tab (table layout, matches reference screenshot)
   ============================================================ */
function PluginsTab() {
  const plugins = [
    { name: "Sudarshana NLP Pack",   author: "Sudarshana Labs", skills: "Social engineering, urgency detection, BEC patterns", updated: "Jun 2025", enabled: true  },
    { name: "GeoIP Risk Engine",      author: "Sudarshana Labs", skills: "IP geolocation, ASN reputation, VPN/proxy detection",  updated: "May 2025", enabled: true  },
    { name: "YARA Rule Engine",       author: "Sudarshana Labs", skills: "Attachment pattern matching, malware signatures",       updated: "Apr 2025", enabled: true  },
    { name: "SPF/DKIM Strict Mode",   author: "Community",       skills: "Header forgery detection, alignment enforcement",       updated: "Mar 2025", enabled: false },
  ];

  const [states, setStates] = React.useState(() =>
    Object.fromEntries(plugins.map(p => [p.name, p.enabled]))
  );

  return (
    <div className="sp-tab-content">
      <div className="sp-table-toolbar sp-table-toolbar-end">
        <div className="sp-table-toolbar-actions">
          <button className="sp-icon-btn" aria-label="Search plugins">
            <span className="material-icons-round">search</span>
          </button>
          <button className="sp-add-btn">
            Add <span className="material-icons-round">expand_more</span>
          </button>
        </div>
      </div>

      <div className="sp-table">
        <div className="sp-table-row sp-table-row-4 sp-table-row-head">
          <span>Plugin</span>
          <span>Author</span>
          <span>Skills</span>
          <span>Last updated</span>
        </div>
        {plugins.map(p => (
          <div key={p.name} className="sp-table-row sp-table-row-4">
            <div className="sp-table-cell-main" style={{ gap: 10 }}>
              <div className="sp-table-icon"><span className="material-icons-round">extension</span></div>
              <div>
                <div className="sp-table-name">{p.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted, rgba(255,255,255,0.38))', marginTop: 2 }}>
                  {states[p.name] ? 'Active' : 'Inactive'}
                </div>
              </div>
            </div>
            <span className="sp-table-type">{p.author}</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted, rgba(255,255,255,0.5))' }}>{p.skills}</span>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="sp-table-type">{p.updated}</span>
              <button
                className={states[p.name] ? "sp-btn-ghost sm" : "sp-table-connect-btn"}
                onClick={() => setStates(s => ({ ...s, [p.name]: !s[p.name] }))}
              >
                {states[p.name] ? 'Disable' : 'Enable'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   Main modal
   ============================================================ */

export default function SettingsPage({ open, onClose }) {
  const { logout } = useAuth();
  const [section, setSection] = useState("profile");
  const [settings, setSettings] = useState(null);
  const overlayRef = useRef(null);

  // â”€â”€ Sidebar search â”€â”€
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef(null);

  const searchResults = searchQuery.trim()
    ? SEARCH_INDEX.filter(item =>
        item.label.toLowerCase().includes(searchQuery.trim().toLowerCase())
      )
    : [];

  const groupedResults = searchResults.reduce((acc, item) => {
    (acc[item.sectionKey] = acc[item.sectionKey] || []).push(item);
    return acc;
  }, {});

  const handleResultClick = (sectionKey) => {
    setSection(sectionKey);
    setSearchQuery("");
    setSearchOpen(false);
  };

  useEffect(() => {
    if (!searchOpen) return;
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [searchOpen]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const r = await fetch("/api/settings");
        if (r.ok) setSettings(await r.json());
      } catch (_) {}
    };
    if (open) fetchSettings();
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const handleUpdateSettings = async (updates) => {
    const next = { ...settings, ...updates };
    setSettings(next);
    try {
      const r = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      if (r.ok) setSettings(await r.json());
    } catch (_) {}
  };

  if (!open) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/icon?family=Material+Icons+Round');

        .sp-overlay {
          position: fixed; inset: 0; z-index: 1000;
          background: rgba(0,0,0,0.62);
          display: flex; align-items: center; justify-content: center;
          padding: 24px;
          backdrop-filter: blur(3px);
          animation: sp-fade-in .15s ease;
        }
        @keyframes sp-fade-in { from { opacity:0 } to { opacity:1 } }

        .sp-modal {
          font-family: 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif;
          width: 100%; max-width: 1150px; height: calc(120vh); max-height: 1400px;
          background: var(--panel, #1a1a1a);
          border: 1px solid var(--border, rgba(255,255,255,0.08));
          border-radius: 16px;
          display: flex;
          overflow: hidden;
          box-shadow: 0 24px 80px rgba(0,0,0,0.6);
          animation: sp-slide-in .18s cubic-bezier(0.4,0,0.2,1);
        }
        @keyframes sp-slide-in { from { opacity:0; transform:scale(0.97) } to { opacity:1; transform:scale(1) } }

        /* ---- Left sidebar ---- */
        .sp-sidebar {
          width: 270px; flex-shrink: 0;
          background: var(--panel-2, #141414);
          border-right: 1px solid var(--border, rgba(255,255,255,0.08));
          padding: 20px 0;
          display: flex; flex-direction: column;
          overflow-y: auto;
        }
        .sp-sidebar-header {
          padding: 0 16px 18px;
        }
        .sp-sidebar-search-wrap {
          position: relative;
        }
        .sp-sidebar-search {
          display: flex; align-items: center; gap: 10px;
          background: var(--panel-3, rgba(255,255,255,0.07));
          border-radius: 10px; padding: 10px 12px;
          border: 1px solid transparent;
          transition: border-color .15s ease;
        }
        .sp-sidebar-search:focus-within {
          border-color: var(--accent, #5b8def);
        }
        .sp-sidebar-search .material-icons-round { font-size: 17px; color: var(--text-dimmer, #777); }
        .sp-sidebar-search input {
          background: none; border: none; outline: none;
          font-size: 13.5px; color: var(--text, #f0f0f0);
          font-family: inherit; width: 100%;
        }
        .sp-sidebar-search input::placeholder { color: var(--text-dimmer, #777); }
        .sp-search-clear {
          background: none; border: none; padding: 0;
          display: flex; align-items: center; justify-content: center;
          color: var(--text-dimmer, #777); cursor: pointer; flex-shrink: 0;
        }
        .sp-search-clear .material-icons-round { font-size: 15px; }
        .sp-search-clear:hover { color: var(--text, #f0f0f0); }

        .sp-search-results {
          position: absolute;
          top: calc(100% + 8px);
          left: 0; right: 0;
          background: var(--panel, #ffffff);
          border: 1px solid var(--border-2, rgba(0,0,0,0.10));
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.12);
          z-index: 50;
          max-height: 360px;
          overflow-y: auto;
          padding: 6px;
          text-align: left;
          animation: sp-search-pop .16s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes sp-search-pop {
          from { opacity: 0; transform: translateY(-4px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .sp-search-empty {
          padding: 14px 10px;
          font-size: 12.5px;
          color: var(--text-dimmer, #888);
          text-align: center;
        }
        .sp-search-group {
          padding: 10px 12px;
          border-radius: 9px;
          cursor: pointer;
          transition: background .12s ease;
          text-align: left;
        }
        .sp-search-group:hover {
          background: var(--panel-4, rgba(255,255,255,0.06));
        }
        .sp-search-group + .sp-search-group {
          margin-top: 2px;
        }
        .sp-search-group-head {
          display: flex; align-items: center; gap: 8px;
          margin-bottom: 4px;
          justify-content: flex-start;
          text-align: left;
        }
        .sp-search-group-head .material-icons-round {
          font-size: 16px; color: var(--text-dim, #5a5a5e);
        }
        .sp-search-group-title {
          font-size: 13px; font-weight: 700;
          color: var(--text, #1a1a1c);
          text-align: left;
        }
        .sp-search-group-item {
          font-size: 12.5px;
          color: var(--text-dim, #5a5a5e);
          padding-left: 24px;
          line-height: 1.5;
          text-align: left;
        }
        .sp-search-hit {
          color: var(--accent, #5b8def);
          font-weight: 700;
        }

        .sp-nav-group { margin-bottom: 6px; }
        .sp-nav-group-label {
          font-size: 12px; font-weight: 400; text-transform: none; letter-spacing: 0;
          color: var(--text-dimmer, #767676); padding: 10px 16px 8px;
        }
        .sp-nav-item {
          display: flex; align-items: center; gap: 12px;
          padding: 11px 16px; margin: 0 8px;
          border-radius: 10px; cursor: pointer;
          font-size: 14.5px; font-weight: 500;
          color: var(--text-dim, #999);
          transition: background .12s ease, color .12s ease;
        }
        .sp-nav-item:hover { background: var(--panel-3, rgba(255,255,255,0.05)); color: var(--text, #f0f0f0); }
        .sp-nav-item.active { background: var(--panel-3, rgba(255,255,255,0.09)); color: var(--text, #f0f0f0); font-weight: 600; }
        .sp-nav-item .material-icons-round { font-size: 18px; flex-shrink: 0; }

        /* ---- Right content panel ---- */
        .sp-content {
          flex: 1; min-width: 0;
          display: flex; flex-direction: column;
          overflow: hidden;
        }
        .sp-content-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 18px 24px 16px;
          border-bottom: 1px solid var(--border, rgba(255,255,255,0.08));
          flex-shrink: 0;
        }
        .sp-content-title {
          font-size: 15px; font-weight: 700; color: var(--text, #f0f0f0);
        }
        .sp-close-btn {
          width: 30px; height: 30px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          background: none; border: none; cursor: pointer;
          color: var(--text-dimmer, #666);
          transition: background .12s, color .12s;
        }
        .sp-close-btn:hover { background: var(--panel-3, rgba(255,255,255,0.07)); color: var(--text, #f0f0f0); }
        .sp-close-btn .material-icons-round { font-size: 18px; }

        .sp-scroll {
          flex: 1; overflow-y: auto; padding: 24px;
        }

        /* ---- Custom scrollbars ---- */
        .sp-scroll, .sp-sidebar {
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.18) transparent;
        }
        .sp-scroll::-webkit-scrollbar, .sp-sidebar::-webkit-scrollbar { width: 8px; }
        .sp-scroll::-webkit-scrollbar-track, .sp-sidebar::-webkit-scrollbar-track { background: transparent; }
        .sp-scroll::-webkit-scrollbar-thumb, .sp-sidebar::-webkit-scrollbar-thumb {
          background-color: rgba(255,255,255,0.16);
          border-radius: 999px;
          border: 2px solid transparent;
          background-clip: padding-box;
        }
        .sp-scroll:hover::-webkit-scrollbar-thumb, .sp-sidebar:hover::-webkit-scrollbar-thumb {
          background-color: rgba(255,255,255,0.28);
        }

        /* ---- Content pieces ---- */
        .sp-tab-content { display: flex; flex-direction: column; gap: 0; text-align: left; }

        .sp-section-header { margin-bottom: 18px; text-align: left; }
        .sp-section-title { font-size: 14.5px; font-weight: 700; color: var(--text, #f0f0f0); margin: 0 0 4px; text-align: left; }
        .sp-section-desc { font-size: 12px; color: var(--text-dimmer, #666); margin: 0; text-align: left; }

        .sp-divider { border: none; border-top: 1px solid var(--border, rgba(255,255,255,0.08)); margin: 24px 0; }

        .sp-block-title { font-size: 17px; font-weight: 700; color: var(--text, #f0f0f0); margin: 0 0 18px; text-align: left; }
        .sp-block-title-spaced { margin-top: 36px; }

        .sp-row {
          display: flex; align-items: center; justify-content: space-between;
          gap: 24px; padding: 18px 0;
          border-bottom: 1px solid var(--border, rgba(255,255,255,0.08));
        }
        .sp-row-stacked { display: block; }
        .sp-row-label {
          font-size: 14px; font-weight: 600; color: var(--text, #f0f0f0);
          flex-shrink: 0;
        }
        .sp-row-sub { font-size: 12px; font-weight: 400; color: var(--text-dimmer, #666); margin-top: 4px; max-width: 480px; line-height: 1.5; }
        .sp-row-desc { font-size: 12px; color: var(--text-dimmer, #666); margin: 4px 0 14px; line-height: 1.5; }
        .sp-row-control { flex-shrink: 0; display: flex; align-items: center; justify-content: flex-end; max-width: 100%; }
        .sp-inline-link { color: var(--text-dim, #999); text-decoration: underline; }

        .sp-avatar-sm {
          width: 38px; height: 38px; border-radius: 999px;
          background: var(--panel-3, rgba(255,255,255,0.1));
          color: var(--text, #f0f0f0); font-size: 13px; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
        }

        .sp-row-input {
          background: var(--panel-3, rgba(255,255,255,0.07));
          border: none; border-radius: 9px; padding: 9px 14px;
          font-size: 13px; color: var(--text, #f0f0f0);
          font-family: inherit; outline: none;
          width: auto; min-width: 0;
          box-sizing: content-box; text-align: left;
        }
        .sp-row-select {
          background: none; border: none; outline: none; cursor: pointer;
          font-size: 13.5px; color: var(--text-dimmer, #666);
          font-family: inherit; text-align: right;
        }
        .sp-row-select option { background: var(--panel, #1a1a1a); color: var(--text, #f0f0f0); }

        .sp-custom-select { position: relative; }
        .sp-custom-select-trigger {
          display: flex; align-items: center; gap: 8px;
          background: var(--panel-3, rgba(255,255,255,0.07));
          border: 1px solid var(--border, rgba(255,255,255,0.08));
          border-radius: 9px; padding: 8px 12px;
          font-size: 13.5px; color: var(--text, #f0f0f0);
          font-family: inherit; cursor: pointer; outline: none;
          transition: border-color 0.15s, background 0.15s;
        }
        .sp-custom-select-trigger:hover { background: var(--panel-3, rgba(255,255,255,0.1)); }
        .sp-custom-select-trigger.open {
          border-color: var(--accent-dim, rgba(200,240,96,0.35));
        }
        .sp-custom-select-caret {
          font-size: 18px; color: var(--text-dimmer, #777);
          transition: transform 0.15s;
        }
        .sp-custom-select-trigger.open .sp-custom-select-caret { transform: rotate(180deg); }
        .sp-custom-select-menu {
          position: absolute; top: calc(100% + 6px); right: 0;
          min-width: 160px;
          background: var(--panel, #1a1a1a);
          border: 1px solid var(--border, rgba(255,255,255,0.1));
          border-radius: 10px; padding: 4px;
          box-shadow: 0 12px 32px rgba(0,0,0,0.45);
          z-index: 50;
        }
        .sp-custom-select-option {
          padding: 9px 12px; border-radius: 7px;
          font-size: 13.5px; color: var(--text, #f0f0f0);
          cursor: pointer; text-align: left;
          transition: background 0.12s;
        }
        .sp-custom-select-option:hover { background: var(--panel-3, rgba(255,255,255,0.08)); }
        .sp-custom-select-option.selected {
          background: var(--accent-dim, rgba(200,240,96,0.18));
          color: var(--accent, #c8f060);
          font-weight: 600;
        }

        .sp-textarea {
          width: 100%; box-sizing: border-box; min-height: 120px; resize: vertical;
          background: var(--panel-3, rgba(255,255,255,0.05));
          border: 1px solid var(--border, rgba(255,255,255,0.07));
          border-radius: 12px; padding: 14px;
          font-size: 13px; color: var(--text, #f0f0f0);
          font-family: inherit; outline: none;
        }
        .sp-textarea::placeholder { color: var(--text-dimmer, #666); }

        .sp-dropdown-value {
          display: flex; align-items: center; gap: 4px;
          font-size: 13.5px; color: var(--text-dimmer, #666);
          cursor: pointer; user-select: none;
        }
        .sp-dropdown-value .material-icons-round { font-size: 16px; }

        .sp-segmented {
          display: flex; align-items: center; gap: 4px;
          background: var(--panel-3, rgba(255,255,255,0.06));
          border-radius: 9px; padding: 3px;
        }
        .sp-segmented-btn {
          background: none; border: none; cursor: pointer;
          border-radius: 7px; padding: 6px 10px;
          display: flex; align-items: center; justify-content: center;
          color: var(--text-dimmer, #666);
          font-family: inherit; font-size: 12.5px; font-weight: 600;
          transition: background .15s, color .15s;
        }
        .sp-segmented-btn .material-icons-round { font-size: 16px; }
        .sp-segmented-btn.active { background: var(--panel, rgba(255,255,255,0.14)); color: var(--text, #f0f0f0); }
        .sp-segmented-btn-text { padding: 6px 14px; }

        .sp-avatar-row {
          display: flex; align-items: center; gap: 14px;
          margin-bottom: 20px;
        }
        .sp-avatar {
          width: 52px; height: 52px; border-radius: 999px; flex-shrink: 0;
          background: #46493a; color: var(--accent, #c8f060);
          font-size: 18px; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
        }
        .sp-avatar-name { font-size: 14px; font-weight: 600; color: var(--text, #f0f0f0); }
        .sp-avatar-email { font-size: 12px; color: var(--text-dimmer, #666); margin-top: 2px; }

        .sp-field-group { display: flex; flex-direction: column; gap: 14px; }
        .sp-field-group-narrow { max-width: 400px; }
        .sp-field-row-inline { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .sp-field { display: flex; flex-direction: column; gap: 6px; }
        .sp-label { font-size: 11.5px; color: var(--text-dimmer, #666); font-weight: 600; }

        .sp-input {
          background: var(--panel-2, rgba(255,255,255,0.04));
          border: 1px solid var(--border-2, rgba(255,255,255,0.1));
          border-radius: 10px; padding: 9px 12px;
          font-size: 13px; color: var(--text, #f0f0f0);
          font-family: inherit; outline: none; width: 100%; box-sizing: border-box;
          transition: border-color .15s;
        }
        .sp-input:focus { border-color: var(--accent-dim, rgba(200,240,96,0.35)); }
        .sp-input.sp-input-verified { border-color: var(--green, #4caf50); }
        .sp-input.sp-input-error { border-color: var(--red, #f44336); }
        .sp-select { cursor: pointer; }

        .sp-input-locked {
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--border, rgba(255,255,255,0.08));
          border-radius: 10px; padding: 9px 12px;
          font-size: 13px; color: var(--text-dim, #888);
          display: flex; align-items: center; gap: 8px; cursor: not-allowed;
        }
        .sp-locked-val { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .sp-google-badge {
          display: inline-flex; align-items: center; gap: 4px;
          background: rgba(66,133,244,0.12); border: 1px solid rgba(66,133,244,0.28);
          border-radius: 999px; padding: 2px 8px;
          font-size: 10px; font-weight: 600; color: #4285F4; flex-shrink: 0;
        }

        .sp-phone-row { display: flex; gap: 8px; align-items: flex-end; }
        .sp-cc-select {
          background: var(--panel-2, rgba(255,255,255,0.04));
          border: 1px solid var(--border-2, rgba(255,255,255,0.1));
          border-radius: 10px; padding: 9px 10px;
          font-size: 13px; color: var(--text, #f0f0f0);
          font-family: inherit; outline: none; flex-shrink: 0; width: 96px; cursor: pointer;
        }
        .sp-phone-wrap { flex: 1; position: relative; }
        .sp-verified-badge {
          position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
          display: flex; align-items: center; gap: 4px;
          font-size: 11px; font-weight: 700; color: var(--green, #4caf50);
        }
        .sp-verified-badge .material-icons-round { font-size: 14px; }

        .sp-otp-row { display: flex; gap: 8px; align-items: center; }
        .sp-otp-input {
          background: var(--panel-2, rgba(255,255,255,0.04));
          border: 1px solid var(--border-2, rgba(255,255,255,0.1));
          border-radius: 10px; padding: 9px 12px;
          font-size: 15px; font-weight: 700; letter-spacing: 6px;
          color: var(--text, #f0f0f0); outline: none; width: 160px; text-align: center;
          transition: border-color .15s; font-family: inherit;
        }
        .sp-otp-input:focus { border-color: var(--accent-dim, rgba(200,240,96,0.35)); }
        .sp-otp-input.error { border-color: var(--red, #f44336); }

        .sp-field-error { font-size: 11.5px; color: var(--red, #f44336); }
        .sp-hint { font-size: 11.5px; color: var(--text-dimmer, #666); }
        .sp-link { color: var(--accent, #c8f060); cursor: pointer; font-weight: 600; }
        .sp-link:hover { text-decoration: underline; }

        .sp-pw-wrap { position: relative; }
        .sp-pw-toggle {
          position: absolute; top: 50%; right: 6px; transform: translateY(-50%);
          width: 28px; height: 28px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          color: var(--text-dimmer, #666); background: transparent; border: none; cursor: pointer;
          font-family: inherit;
        }
        .sp-pw-toggle:hover { background: var(--panel-3, rgba(255,255,255,0.06)); color: var(--text, #f0f0f0); }
        .sp-pw-toggle .material-icons-round { font-size: 16px; }

        .sp-table-toolbar-end { justify-content: flex-end; }

        .sp-pw-rules { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; padding-top: 4px; }
        .sp-pw-rule { display: flex; align-items: center; gap: 7px; font-size: 12px; color: var(--text-dimmer, #666); }
        .sp-pw-rule .material-icons-round { font-size: 15px; }
        .sp-pw-rule.met { color: var(--green, #4caf50); }
        .sp-pw-rule.met .material-icons-round { color: var(--green, #4caf50); }

        .sp-switch {
          width: 36px; height: 21px; border-radius: 999px;
          background: var(--panel-3, rgba(255,255,255,0.08));
          border: 1px solid var(--border-2, rgba(255,255,255,0.1));
          padding: 2px; cursor: pointer; transition: background .15s ease;
          display: flex; align-items: center; flex-shrink: 0;
        }
        .sp-switch i {
          width: 15px; height: 15px; border-radius: 999px;
          background: var(--text-dimmer, #666);
          transition: transform .15s ease, background .15s ease; display: block;
        }
        .sp-switch.on { background: var(--accent-dim, rgba(200,240,96,0.25)); border-color: transparent; }
        .sp-switch.on i { background: var(--accent, #c8f060); transform: translateX(15px); }

        .sp-notif-grid { display: flex; flex-direction: column; }
        .sp-notif-head {
          display: grid; grid-template-columns: 1fr 70px 70px;
          gap: 14px; padding-bottom: 10px; margin-bottom: 4px;
          border-bottom: 1px solid var(--border, rgba(255,255,255,0.08));
          font-size: 11px; text-transform: uppercase; letter-spacing: .04em;
          color: var(--text-dimmer, #666);
        }
        .sp-notif-head span:nth-child(2), .sp-notif-head span:nth-child(3) { text-align: center; }
        .sp-notif-row {
          display: grid; grid-template-columns: 1fr 70px 70px;
          align-items: center; gap: 14px; padding: 12px 0;
          border-bottom: 1px solid var(--border, rgba(255,255,255,0.08));
        }
        .sp-notif-row:last-child { border-bottom: none; }
        .sp-notif-label { font-size: 13px; font-weight: 600; color: var(--text, #f0f0f0); }
        .sp-notif-desc { font-size: 11.5px; color: var(--text-dimmer, #666); margin-top: 3px; line-height: 1.5; }
        .sp-notif-toggle { display: flex; justify-content: center; }

        .sp-policy-options { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 0; }
        .sp-policy-opt {
          flex: 1; min-width: 150px;
          background: var(--panel-2, rgba(255,255,255,0.03));
          border: 1px solid var(--border-2, rgba(255,255,255,0.1));
          border-radius: 12px; padding: 14px; cursor: pointer;
          transition: background .15s ease, border-color .15s ease;
        }
        .sp-policy-opt:hover { background: var(--panel-3, rgba(255,255,255,0.07)); }
        .sp-policy-opt.active { border-color: var(--accent-dim, rgba(200,240,96,0.35)); background: var(--panel-3, rgba(255,255,255,0.07)); }
        .sp-policy-head { display: flex; align-items: center; gap: 9px; }
        .sp-radio { width: 15px; height: 15px; border-radius: 999px; flex-shrink: 0; border: 2px solid var(--border-2, rgba(255,255,255,0.1)); position: relative; }
        .sp-radio.on { border-color: var(--accent, #c8f060); }
        .sp-radio.on::after { content:''; position:absolute; inset:2px; border-radius:999px; background: var(--accent, #c8f060); }
        .sp-policy-label { font-size: 13px; font-weight: 600; color: var(--text, #f0f0f0); }
        .sp-policy-desc { font-size: 11.5px; color: var(--text-dimmer, #666); margin-top: 8px; line-height: 1.5; }

        .sp-slider-row { display: flex; align-items: center; gap: 14px; }
        .sp-range {
          flex: 1; -webkit-appearance: none; appearance: none;
          height: 6px; border-radius: 999px;
          background: rgba(255,255,255,0.08); outline: none;
        }
        .sp-range::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none;
          width: 16px; height: 16px; border-radius: 999px;
          background: var(--accent, #c8f060); cursor: pointer;
          box-shadow: 0 0 0 4px var(--accent-dim, rgba(200,240,96,0.2));
        }
        .sp-slider-val { font-size: 13px; font-weight: 700; color: var(--text, #f0f0f0); width: 42px; text-align: right; }

        .sp-table-toolbar {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 22px;
        }
        .sp-table-toolbar-title { font-size: 19px; font-weight: 700; color: var(--text, #f0f0f0); margin: 0; }
        .sp-table-toolbar-actions { display: flex; align-items: center; gap: 10px; }
        .sp-icon-btn {
          width: 34px; height: 34px; border-radius: 9px;
          background: var(--panel-3, rgba(255,255,255,0.07));
          border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          color: var(--text-dim, #888);
        }
        .sp-icon-btn:hover { background: var(--panel, rgba(255,255,255,0.1)); color: var(--text, #f0f0f0); }
        .sp-icon-btn .material-icons-round { font-size: 18px; }
        .sp-add-btn {
          display: flex; align-items: center; gap: 4px;
          background: var(--panel-3, rgba(255,255,255,0.07));
          border: none; border-radius: 9px; padding: 8px 12px;
          font-size: 13px; font-weight: 600; color: var(--text, #f0f0f0);
          cursor: pointer; font-family: inherit;
        }
        .sp-add-btn:hover { background: var(--panel, rgba(255,255,255,0.1)); }
        .sp-add-btn .material-icons-round { font-size: 17px; }

        .sp-table { display: flex; flex-direction: column; }
        .sp-table-row {
          display: grid; grid-template-columns: 1fr 110px 130px;
          align-items: center; gap: 14px;
          padding: 14px 0;
          border-bottom: 1px solid var(--border, rgba(255,255,255,0.08));
        }
        .sp-table-row.sp-table-row-4 { grid-template-columns: 2fr 1.5fr 1fr 1.5fr; }
        .sp-table-row-head {
          font-size: 12px; text-transform: none; font-weight: 500;
          color: var(--text-dimmer, #666); padding-bottom: 12px;
        }
        .sp-table-row:last-child { border-bottom: none; }
        .sp-table-cell-main { display: flex; align-items: center; gap: 12px; }
        .sp-table-icon {
          width: 28px; height: 28px; border-radius: 7px; flex-shrink: 0;
          background: var(--panel-3, rgba(255,255,255,0.07));
          display: flex; align-items: center; justify-content: center;
          color: var(--text-dim, #888); overflow: hidden;
        }
        .sp-table-icon .material-icons-round { font-size: 15px; }
        .sp-table-name { font-size: 13.5px; font-weight: 600; color: var(--text, #f0f0f0); }
        .sp-table-type { font-size: 13px; color: var(--text-dim, #888); }
        .sp-table-connect-btn {
          background: var(--panel-3, rgba(255,255,255,0.09));
          color: var(--text, #f0f0f0); border: none;
          border-radius: 9px; padding: 7px 16px;
          font-size: 12.5px; font-weight: 700; cursor: pointer;
          font-family: inherit; transition: background .15s;
        }
        .sp-table-connect-btn:hover { background: var(--panel, rgba(255,255,255,0.14)); }
        .sp-table-empty {
          text-align: center; padding: 60px 0;
          font-size: 13.5px; color: var(--text-dimmer, #666);
        }

        .sp-empty-state {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: 40px 20px; color: var(--text-dimmer, #666);
        }
        .sp-empty-icon { font-size: 36px !important; color: var(--text-dimmer, #666); margin-bottom: 12px; }
        .sp-empty-text { font-size: 14px; font-weight: 600; color: var(--text-dim, #888); }
        .sp-empty-sub { font-size: 12px; color: var(--text-dimmer, #666); margin-top: 4px; }

        .sp-actions {
          display: flex; justify-content: flex-end;
          margin-top: 20px; padding-top: 16px;
          border-top: 1px solid var(--border, rgba(255,255,255,0.08));
        }

        .sp-btn-accent {
          background: var(--accent, #c8f060); color: #111; border: none;
          border-radius: 10px; padding: 9px 18px;
          font-size: 12.5px; font-weight: 700; cursor: pointer;
          font-family: inherit; transition: opacity .15s;
          display: inline-flex; align-items: center;
          flex-shrink: 0; white-space: nowrap;
        }
        .sp-btn-accent:hover { opacity: 0.88; }
        .sp-btn-accent:disabled { opacity: 0.38; cursor: not-allowed; }
        .sp-btn-accent.sm { padding: 7px 14px; font-size: 12px; }

        .sp-btn-ghost {
          background: var(--panel-3, rgba(255,255,255,0.07)); color: var(--text, #f0f0f0); border: none;
          border-radius: 10px; padding: 9px 18px;
          font-size: 12.5px; font-weight: 600; cursor: pointer;
          font-family: inherit; transition: background .15s; flex-shrink: 0;
        }
        .sp-btn-ghost:hover { background: var(--panel, rgba(255,255,255,0.1)); }
        .sp-btn-ghost.sm { padding: 7px 14px; font-size: 12px; }

        .sp-btn-white {
          background: #fff; color: #111; border: none;
          border-radius: 10px; padding: 9px 18px;
          font-size: 12.5px; font-weight: 700; cursor: pointer;
          font-family: inherit; transition: opacity .15s; flex-shrink: 0;
        }
        .sp-btn-white:hover { opacity: 0.88; }
        .sp-btn-white.sm { padding: 7px 14px; font-size: 12px; }

        .sp-id-pill {
          background: var(--panel-3, rgba(255,255,255,0.07));
          color: var(--text-dim, #999);
          font-family: 'SF Mono', 'Roboto Mono', monospace;
          font-size: 12.5px; font-weight: 600;
          padding: 7px 12px; border-radius: 8px;
          letter-spacing: 0.2px;
        }

        .sp-pw-top { display: flex; gap: 64px; align-items: stretch; }
        .sp-pw-top .sp-field-group-narrow { max-width: 360px; flex: 1; }
        .sp-pw-top .sp-pw-rules { grid-template-columns: 1fr; flex: 1; display: flex; flex-direction: column; justify-content: flex-start; gap: 18px; padding-top: 6px; margin-top: 60px; padding-left: 24px; }

        .sp-actions-plain { border-top: none; padding-top: 4px; margin-top: 18px; }

        .sp-privacy-fields { margin-top: -4px; }
        .sp-section-desc-spaced { margin-bottom: 18px; }

        /* Material Icons override inside modal */
        .sp-modal .material-icons-round {
          font-family: 'Material Icons Round' !important;
          font-weight: normal; font-style: normal; display: inline-block;
          line-height: 1; text-transform: none; letter-spacing: normal;
          word-wrap: normal; white-space: nowrap; direction: ltr;
          -webkit-font-smoothing: antialiased;
        }

        @media (max-width: 640px) {
          .sp-sidebar { width: 180px; }
          .sp-field-row-inline { grid-template-columns: 1fr; }
        }

        /* â”€â”€ Delete Account confirmation modal â”€â”€ */
        .da-overlay {
          position: fixed; inset: 0; z-index: 4000;
          background: rgba(0,0,0,0.62);
          backdrop-filter: blur(3px);
          display: flex; align-items: center; justify-content: center;
          padding: 24px;
          animation: daFadeIn 0.15s ease;
        }
        @keyframes daFadeIn { from { opacity:0 } to { opacity:1 } }
        .da-card {
          background: var(--panel, #1a1a1a);
          border: 1px solid var(--border, rgba(255,255,255,0.08));
          border-radius: 16px;
          padding: 28px 28px 24px;
          width: 100%; max-width: 440px;
          box-shadow: 0 24px 80px rgba(0,0,0,0.6);
          animation: daSlideIn 0.18s cubic-bezier(0.4,0,0.2,1);
          font-family: 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        @keyframes daSlideIn { from { opacity:0; transform:scale(0.97) } to { opacity:1; transform:scale(1) } }
        .da-header {
          display: flex; align-items: center; gap: 12px;
          margin-bottom: 14px;
        }
        .da-icon-wrap {
          width: 36px; height: 36px; border-radius: 9px;
          background: rgba(230,57,70,0.14);
          border: 1px solid rgba(230,57,70,0.22);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .da-icon-wrap .material-icons-round { font-size: 20px; color: #e63946; }
        .da-title {
          font-size: 15px; font-weight: 700;
          color: var(--text, #f0f0f0); margin: 0;
        }
        .da-divider {
          border: none; border-top: 1px solid var(--border, rgba(255,255,255,0.08));
          margin: 0 0 18px;
        }
        .da-desc {
          font-size: 13px; color: var(--text-dim, #aaa);
          line-height: 1.65; margin: 0 0 20px;
        }
        .da-desc strong { color: var(--text, #e0e0e0); }
        .da-label {
          display: block; font-size: 12px; font-weight: 600;
          color: var(--text-dim, #bbb);
          margin-bottom: 7px;
        }
        .da-input {
          width: 100%; box-sizing: border-box;
          background: var(--panel-3, rgba(255,255,255,0.07));
          border: none; border-radius: 9px;
          padding: 9px 14px;
          font-size: 13px; color: var(--text, #f0f0f0);
          font-family: inherit; outline: none;
          transition: box-shadow 0.15s;
        }
        .da-input:focus { box-shadow: 0 0 0 2px rgba(230,57,70,0.35); }
        .da-input::placeholder { color: var(--text-dimmer, #555); }
        .da-error {
          margin-top: 7px; font-size: 12px;
          color: #e85e5e;
        }
        .da-actions {
          display: flex; gap: 8px; justify-content: flex-end;
          margin-top: 22px;
          border-top: 1px solid var(--border, rgba(255,255,255,0.08));
          padding-top: 18px;
        }
        .da-btn-cancel {
          background: none;
          border: 1px solid var(--border, rgba(255,255,255,0.12));
          color: var(--text-dim, #999);
          border-radius: 10px; padding: 7px 16px;
          font-size: 12.5px; font-weight: 600; cursor: pointer;
          font-family: inherit; transition: background 0.12s, color 0.12s;
        }
        .da-btn-cancel:hover { background: var(--panel-3, rgba(255,255,255,0.07)); color: var(--text, #f0f0f0); }
        .da-btn-cancel:disabled { opacity: 0.4; cursor: not-allowed; }
        .da-btn-danger {
          background: #e63946; border: none; color: #fff;
          border-radius: 10px; padding: 7px 16px;
          font-size: 12.5px; font-weight: 700; cursor: pointer;
          font-family: inherit; transition: opacity 0.12s;
        }
        .da-btn-danger:hover { opacity: 0.85; }
        .da-btn-danger:disabled { opacity: 0.45; cursor: not-allowed; }
      `}</style>

      <div className="sp-overlay" ref={overlayRef} onClick={e => { if (e.target === overlayRef.current) onClose(); }}>
        <div className="sp-modal" role="dialog" aria-modal="true" aria-label="Settings">

          {/* Left nav */}
          <aside className="sp-sidebar">
            <div className="sp-sidebar-header">
              <div className="sp-sidebar-search-wrap" ref={searchRef}>
                <div className="sp-sidebar-search">
                  <span className="material-icons-round">search</span>
                  <input
                    type="text"
                    placeholder="Search"
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true); }}
                    onFocus={() => setSearchOpen(true)}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className="sp-search-clear"
                      aria-label="Clear search"
                      onClick={() => { setSearchQuery(""); setSearchOpen(false); }}
                    >
                      <span className="material-icons-round">close</span>
                    </button>
                  )}
                </div>

                {searchOpen && searchQuery.trim() && (
                  <div className="sp-search-results">
                    {Object.keys(groupedResults).length === 0 ? (
                      <div className="sp-search-empty">No results for "{searchQuery}"</div>
                    ) : (
                      Object.entries(groupedResults).map(([sectionKey, items]) => {
                        const sectionDef = SECTION_LOOKUP[sectionKey];
                        if (!sectionDef) return null;
                        return (
                          <div key={sectionKey} className="sp-search-group" onClick={() => handleResultClick(sectionKey)}>
                            <div className="sp-search-group-head">
                              <span className="material-icons-round">{sectionDef.iconName}</span>
                              <span className="sp-search-group-title">{sectionDef.label}</span>
                            </div>
                            {items.map((item, i) => (
                              <div className="sp-search-group-item" key={i}>
                                {highlightMatch(item.label, searchQuery.trim())}
                              </div>
                            ))}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="sp-nav-group">
              {NAV_SECTIONS.flatMap(group => group.items).map(item => (
                <div
                  key={item.key}
                  className={"sp-nav-item" + (section === item.key ? " active" : "")}
                  onClick={() => setSection(item.key)}
                >
                  <span className="material-icons-round">{item.iconName}</span>
                  {item.label}
                </div>
              ))}
            </div>
          </aside>

          {/* Right content */}
          <div className="sp-content">
            <div className="sp-content-header">
              <div className="sp-content-title">
                {NAV_SECTIONS.flatMap(g => g.items).find(i => i.key === section)?.label || "Settings"}
              </div>
              <button className="sp-close-btn" onClick={onClose} aria-label="Close settings">
                <span className="material-icons-round">close</span>
              </button>
            </div>

            <div className="sp-scroll">
              {section === "profile"       && <GeneralTab      settings={settings} />}
              {section === "account"       && <AccountTab onDeleteAccount={async () => {
                const userId = localStorage.getItem("selectedUserId");
                if (!userId) { showToast("No account selected.", "warning"); return; }
                if (!window.confirm("Are you sure you want to delete this account? All associated email sync data will be wiped.")) return;
                try {
                  const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
                  if (res.ok) {
                    logout();
                    showToast("Account deleted successfully.", "success");
                  } else {
                    showToast("Failed to delete account. Please try again.", "error");
                  }
                } catch (err) {
                  console.error("Delete account error:", err);
                  showToast("An error occurred while deleting your account.", "error");
                }
              }} />}
              {section === "notifications" && <NotificationsTab />}
              {section === "security"      && <SecurityTab      settings={settings} onUpdate={handleUpdateSettings} />}
              {section === "integrations"  && <ConnectorsTab    settings={settings} onUpdate={handleUpdateSettings} />}
              {section === "apikeys"       && <PluginsTab />}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}


