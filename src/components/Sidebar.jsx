import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import SettingsPage from './Settings';
import { useAuth } from '../auth/AuthContext';

/**
 * Sidebar.jsx
 * Shared left navigation rail. Settings now opens as a modal popup
 * instead of navigating to /settings.
 */

const BUILT_PAGES = ["Dashboard", "Threads", "Security Posture", "Reports", "Audit Logs"];

const NAV_ITEMS = [
  { iconName: "dashboard",   label: "Dashboard",        path: "/home" },
  { iconName: "view_column", label: "Threads",          path: "/threads" },
  { iconName: "shield",      label: "Security Posture", path: "/security-posture" },
  { iconName: "flag",        label: "Reports",          path: "/reports" },
  { iconName: "assignment",   label: "Audit Logs",       path: "/audit-logs" },
];

const STORAGE_KEY = "tg-sidebar-expanded";

function getInitialExpanded() {
  try { return localStorage.getItem(STORAGE_KEY) === "true"; }
  catch { return false; }
}

export default function Sidebar({ active }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const currentActive = active || location.pathname;
  const [expanded, setExpanded] = useState(getInitialExpanded);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const toggleExpanded = () => {
    setExpanded(prev => {
      const next = !prev;
      try { localStorage.setItem(STORAGE_KEY, String(next)); } catch {}
      return next;
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      <aside className={"sidebar" + (expanded ? " expanded" : "")} aria-label="Primary sidebar">
        <style>{`
          .sidebar{
            width:64px; flex-shrink:0;
            background: var(--panel);
            border:1px solid var(--border);
            border-radius: var(--radius-lg);
            display:flex; flex-direction:column; align-items:center;
            padding:16px 0;
            transition: width .22s cubic-bezier(.4,0,.2,1);
            overflow:hidden;
          }
          .sidebar.expanded{ width:208px; align-items:stretch; }

          .sidebar-logo{
            width:34px; height:34px; border-radius:9px;
            background: var(--panel-3); border: 1px solid var(--border);
            display:flex; align-items:center; justify-content:center; flex-shrink:0;
          }
          .sidebar-logo .material-icons-round{ font-size:18px; }

          .sidebar-logo-row{
            display:flex; align-items:center; justify-content:flex-start;
            gap:0; margin-bottom:22px; padding:0 15px 16px;
            border-bottom:1px solid var(--border);
            transition: gap .22s cubic-bezier(.4,0,.2,1), padding .22s cubic-bezier(.4,0,.2,1);
          }
          .sidebar.expanded .sidebar-logo-row{ gap:10px; }
          .sidebar:not(.expanded) .sidebar-logo-row{ padding:0 15px 16px; }

          .sidebar-wordmark{
            font-size:14px; font-weight:700; letter-spacing:-0.01em;
            color: var(--text); white-space:nowrap;
            opacity:0; max-width:0; overflow:hidden;
            transition: opacity .18s ease, max-width .22s cubic-bezier(.4,0,.2,1);
          }
          .sidebar.expanded .sidebar-wordmark{
            opacity:1; max-width:140px;
            transition: opacity .18s ease .04s, max-width .22s cubic-bezier(.4,0,.2,1);
          }

          .sidebar-nav{
            display:flex; flex-direction:column; align-items:center;
            gap:8px; flex:1; width:100%; padding:0;
            transition: padding .22s cubic-bezier(.4,0,.2,1);
          }
          .sidebar.expanded .sidebar-nav{ align-items:stretch; padding:0 13px; }

          .sb-btn{
            height:38px; min-width:38px; border-radius:12px;
            display:flex; align-items:center; justify-content:flex-start;
            gap:0; color: var(--text-dim);
            background: none; border: none; cursor: pointer;
            font: inherit;
            transition: background .15s ease, color .15s ease, width .22s cubic-bezier(.4,0,.2,1), padding .22s cubic-bezier(.4,0,.2,1), gap .22s cubic-bezier(.4,0,.2,1);
            text-decoration: none; width:38px; padding:0 10px;
            white-space:nowrap; overflow:hidden;
          }
          .sb-btn:focus, .sb-btn:focus-visible{ outline: none; }
          .sidebar.expanded .sb-btn{ width:100%; padding:0 9px; gap:10px; }
          .sb-btn:hover{ background: var(--panel-3); color: var(--text); }
          .sb-btn.active{ background: var(--text); color: var(--panel); }
          .sb-btn.disabled{ opacity:.38; cursor:default; }
          .sb-btn.disabled:hover{ background:none; color: var(--text-dim); }
          .sb-btn .material-icons-round{ font-size:17px; flex-shrink:0; }

          .sb-label{
            font-size:13px; font-weight:500;
            opacity:0; max-width:0; overflow:hidden;
            transition: opacity .18s ease, max-width .22s cubic-bezier(.4,0,.2,1);
          }
          .sidebar.expanded .sb-label{
            opacity:1; max-width:140px;
            transition: opacity .18s ease .04s, max-width .22s cubic-bezier(.4,0,.2,1);
          }

          .sidebar-bottom{
            display:flex; flex-direction:column; gap:8px; align-items:center;
            border-top:1px solid var(--border); padding-top:14px;
            width:100%; padding-left:0; padding-right:0;
            transition: padding-left .22s cubic-bezier(.4,0,.2,1), padding-right .22s cubic-bezier(.4,0,.2,1);
          }
          .sidebar.expanded .sidebar-bottom{ align-items:stretch; padding-left:13px; padding-right:13px; }

          .sb-btn.collapse-btn{ background: none; color: var(--text-dim); }
          .sb-btn.collapse-btn:hover{ background: var(--panel-3); color: var(--text); }
          .sb-btn.collapse-btn .material-icons-round{ transition: transform .22s ease; }
          .sidebar.expanded .sb-btn.collapse-btn .material-icons-round{ transform: rotate(180deg); }
        `}</style>

        <div className="sidebar-logo-row">
          <div className="sidebar-logo" aria-hidden="true">
            <span className="tgh-brand-mark">
              <img src="/sudarshana.png" alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '9px' }} />
            </span>
          </div>
          <span className="sidebar-wordmark">Sudarshana</span>
        </div>

        <nav className="sidebar-nav" aria-label="Main">
          {NAV_ITEMS.map(({ iconName, label, path }) => {
            const built = BUILT_PAGES.includes(label);
            const isActive = currentActive === path;
            return built ? (
              <Link key={label} to={path} className={"sb-btn" + (isActive ? " active" : "")} title={label} aria-label={label} aria-current={isActive ? "page" : undefined}>
                <span className="material-icons-round" aria-hidden="true">{iconName}</span>
                <span className="sb-label">{label}</span>
              </Link>
            ) : (
              <button key={label} className="sb-btn disabled" title={`${label} (coming soon)`} aria-label={`${label} (coming soon)`} aria-disabled="true" disabled>
                <span className="material-icons-round" aria-hidden="true">{iconName}</span>
                <span className="sb-label">{label}</span>
              </button>
            );
          })}
          <button onClick={handleLogout} className="sb-btn" title="Logout" aria-label="Logout" style={{ marginTop: 'auto', marginBottom: '6px' }}>
            <span className="material-icons-round" aria-hidden="true">logout</span>
            <span className="sb-label">Logout</span>
          </button>
        </nav>

        <div className="sidebar-bottom">
          
          {/* Settings now opens a modal instead of navigating */}
          <button
            className="sb-btn"
            title="Settings"
            aria-label="Settings"
            onClick={() => setSettingsOpen(true)}
          >
            <span className="material-icons-round" aria-hidden="true">settings</span>
            <span className="sb-label">Settings</span>
          </button>
          <button
            className="sb-btn collapse-btn"
            title={expanded ? "Collapse sidebar" : "Expand sidebar"}
            aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
            aria-pressed={expanded}
            onClick={toggleExpanded}
          >
            <span className="material-icons-round" aria-hidden="true">vertical_split</span>
            <span className="sb-label">Collapse</span>
          </button>
        </div>
      </aside>

      {/* Settings modal â€” rendered outside the sidebar so it overlays the full page */}
      <SettingsPage open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
