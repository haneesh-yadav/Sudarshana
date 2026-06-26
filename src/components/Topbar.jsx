import React from 'react';
import { useNavigate } from 'react-router-dom';
import { showToast } from '../utils/toast.js';

/**
 * Topbar.jsx
 * Shared top bar (stat pills + search + notifications + user chip)
 * used on every Sudarshana page. Same markup, styling, and position
 * everywhere. Stats/search placeholder/user can be overridden via
 * props if a page ever needs to, but default to the standard set so
 * every page looks identical out of the box.
 *
 * Usage:
 *   import Topbar from './Topbar';
 *   <Topbar />
 */

// Stat pills used to live in the topbar on every page. They're now only
// shown on the Dashboard itself (see Home.jsx's StatsBar) -- kept here as
// an exported default so Home.jsx doesn't need to duplicate the data.
export const DEFAULT_STATS = [
  { iconName: "mail", label: "Threads", value: "1,248" },
  { iconName: "warning", label: "Active threats", value: "7" },
  { iconName: "shield", label: "Verified", value: "1,189" },
  { iconName: "tag", label: "Avg. trust score", value: "91.4%" },
  { iconName: "schedule", label: "Quarantined", value: "4" },
];

const DEFAULT_USER = { initials: "HY", name: "Haneesh Yadav", role: "SOC Analyst" };

export default function Topbar({
  title = "Dashboard",
  searchPlaceholder = "Search threads, senders, or domains...",
  user = DEFAULT_USER,
  notificationCount = "+8",
}) {
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const navigate = useNavigate();
  const [searchVal, setSearchVal] = React.useState(() => {
    return localStorage.getItem("tg-search-query") || "";
  });

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchVal(val);
    localStorage.setItem("tg-search-query", val);
    window.dispatchEvent(new CustomEvent('tg-search-changed', { detail: val }));
    if (window.location.pathname !== '/threads') {
      navigate('/threads');
    }
  };

  React.useEffect(() => {
    const syncSearch = (e) => {
      setSearchVal(e.detail || "");
    };
    window.addEventListener('tg-search-changed', syncSearch);
    return () => window.removeEventListener('tg-search-changed', syncSearch);
  }, []);

  const [users, setUsers] = React.useState([]);
  const [selectedUserId, setSelectedUserId] = React.useState(() => {
    return localStorage.getItem("selectedUserId") || "";
  });

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
        if (data.length > 0) {
          const stored = localStorage.getItem("selectedUserId");
          const exists = data.some(u => String(u.id) === stored);
          if (!exists) {
            localStorage.setItem("selectedUserId", String(data[0].id));
            setSelectedUserId(String(data[0].id));
            window.dispatchEvent(new Event('tg-user-changed'));
          } else {
            setSelectedUserId(stored);
          }
        }
      }
    } catch (e) {
      console.error("Failed to fetch users:", e);
    }
  };

  React.useEffect(() => { fetchUsers(); }, []);

  // Re-sync when another component deletes or changes the user
  React.useEffect(() => {
    const onUserChanged = () => {
      const stored = localStorage.getItem("selectedUserId") || "";
      setSelectedUserId(stored);
      fetchUsers();
    };
    window.addEventListener('tg-user-changed', onUserChanged);
    return () => window.removeEventListener('tg-user-changed', onUserChanged);
  }, []);

  const [showPasswordSetup, setShowPasswordSetup] = React.useState(false);
  const [newPassword, setNewPassword] = React.useState("");
  const [passwordSetupError, setPasswordSetupError] = React.useState("");

  // â”€â”€ Notifications dropdown â”€â”€
  const [notifOpen, setNotifOpen] = React.useState(false);
  const notifRef = React.useRef(null);
  const [notifications, setNotifications] = React.useState([
    {
      id: 1,
      icon: "warning",
      tone: "danger",
      title: "New threat detected",
      detail: "Suspicious DKIM mismatch on thread from billing@vendor-pay.com",
      time: "2m ago",
      read: false,
    },
    {
      id: 2,
      icon: "shield",
      tone: "warning",
      title: "Trust score dropped",
      detail: "Thread \"Q3 Invoice Approval\" trust score fell to 62%",
      time: "18m ago",
      read: false,
    },
    {
      id: 3,
      icon: "mail",
      tone: "neutral",
      title: "Thread quarantined",
      detail: "Auto-quarantined 3 messages flagged by behavioral NLP",
      time: "1h ago",
      read: false,
    },
    {
      id: 4,
      icon: "tag",
      tone: "neutral",
      title: "Weekly summary ready",
      detail: "Your Sudarshana activity report for last week is ready",
      time: "Yesterday",
      read: true,
    },
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const toggleNotifOpen = () => setNotifOpen(prev => !prev);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const dismissNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const markOneRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  React.useEffect(() => {
    if (!notifOpen) return;
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    const handleEsc = (e) => {
      if (e.key === "Escape") setNotifOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [notifOpen]);

  React.useEffect(() => {
    if (localStorage.getItem("isNewUser") === "true") {
      setShowPasswordSetup(true);
    }
  }, []);

  const selectedUser = users.find(u => String(u.id) === selectedUserId);
  const userInitials = selectedUser
    ? selectedUser.fullName.split(" ").map(n => n[0]).join("").toUpperCase()
    : "DM";
  const displayName = selectedUser ? selectedUser.fullName : "Demo User";


  return (
    <header className="topbar">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/icon?family=Material+Icons+Round');

        .topbar, .topbar * {
          font-family: 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif !important;
        }
        .topbar .material-icons-round{
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

        .topbar{
          display:flex;
          align-items:center;
          gap:0;
          flex-wrap: nowrap;
          background: var(--panel);
          border:1px solid var(--border);
          border-radius: var(--radius-lg);
          padding:0 8px;
          height:60px;
        }
        .tb-section{
          display:flex;
          align-items:center;
          height:100%;
        }
        .tb-divider{
          width:1px;
          height:28px;
          background: var(--border-2);
          flex-shrink:0;
          margin:0 6px;
        }

        .tb-title{
          font-size:15px;
          font-weight:600;
          letter-spacing:-0.01em;
          padding:0 16px;
          flex-shrink:0;
          white-space:nowrap;
        }

        .tb-date{
          font-size:12.5px;
          color: var(--text-dimmer);
          padding:0 16px;
          flex-shrink:0;
          white-space:nowrap;
        }

        .search-bar{
          flex:1;
          display:flex;
          align-items:center;
          gap:8px;
          padding:0 14px;
          color: var(--text-dimmer);
          min-width:140px;
          height:100%;
          border-radius: var(--radius-lg, 14px);
          transition: background .15s ease;
        }
        .search-bar:focus-within{
          background: var(--panel-2, rgba(255,255,255,0.04));
        }
        .search-bar .material-icons-round{ font-size:15px; flex-shrink:0; }
        .search-input{
          font-size:13px;
          color: var(--text);
          background: transparent;
          border: none;
          outline: none;
          box-shadow: none;
          flex: 1;
          min-width: 0;
        }
        .search-input:focus,
        .search-input:focus-visible{
          outline: none;
          box-shadow: none;
        }
        .search-input::placeholder{ color: var(--text-dimmer); }
        .search-input::-webkit-search-cancel-button{ display:none; }
        .kbd{
          font-size:11px;
          color: var(--text-dimmer);
          border:1px solid var(--border-2);
          border-radius:6px;
          padding:2px 6px;
        }

        .topbar-right{
          display:flex;
          align-items:center;
          gap:4px;
          flex-shrink:0;
          padding:0 4px 0 10px;
        }
        .icon-btn{
          width:38px;
          height:38px;
          border-radius:999px;
          background: transparent;
          border:none;
          display:flex;
          align-items:center;
          justify-content:center;
          position:relative;
          color: var(--text-dim);
          transition: background .15s ease, color .15s ease;
        }
        .icon-btn:hover{ background: var(--panel-3); color: var(--text); }
        .icon-btn .material-icons-round{ font-size:16px; }
        .badge-dot{
          position:absolute;
          top:-2px; right:-2px;
          background:#e8543f;
          color:white;
          font-size:9.5px;
          font-weight:700;
          border-radius:999px;
          padding:2px 5px;
          border:2px solid var(--panel);
          line-height:1;
        }

        /* â”€â”€ Notifications dropdown â”€â”€ */
        .notif-wrap{
          position: relative;
        }
        .notif-panel{
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          width: 360px;
          max-height: 420px;
          background: var(--panel);
          border: 1px solid var(--border-2, rgba(255,255,255,0.1));
          border-radius: var(--radius-lg, 14px);
          box-shadow: 0 20px 48px rgba(0,0,0,0.5);
          z-index: 200;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          transform-origin: top right;
          animation: notifSlide .32s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes notifSlide{
          from{ opacity:0; transform: translateY(-10px) scale(0.97); }
          to{ opacity:1; transform: translateY(0) scale(1); }
        }
        .notif-header{
          display:flex;
          align-items:center;
          justify-content:space-between;
          padding:14px 16px 12px;
          border-bottom:1px solid var(--border-2, rgba(255,255,255,0.08));
          flex-shrink:0;
        }
        .notif-header-title{
          font-size:13.5px;
          font-weight:600;
          color: var(--text, #f2f2f3);
        }
        .notif-mark-read{
          font-size:11.5px;
          color: var(--accent, #9bb8ff);
          background:none;
          border:none;
          cursor:pointer;
          padding:2px 4px;
        }
        .notif-mark-read:hover{ text-decoration: underline; }
        .notif-list{
          overflow-y:auto;
          flex:1;
          scrollbar-width: thin;
          scrollbar-color: var(--border-2, rgba(255,255,255,0.18)) transparent;
        }
        .notif-list::-webkit-scrollbar{
          width:5px;
        }
        .notif-list::-webkit-scrollbar-track{
          background: transparent;
        }
        .notif-list::-webkit-scrollbar-thumb{
          background: var(--border-2, rgba(255,255,255,0.18));
          border-radius:999px;
        }
        .notif-list::-webkit-scrollbar-thumb:hover{
          background: var(--text-dimmer, rgba(255,255,255,0.3));
        }
        .notif-empty{
          padding: 32px 16px;
          text-align:center;
          font-size:12.5px;
          color: var(--text-dimmer, #9a9aa5);
        }
        .notif-item{
          display:flex;
          align-items:flex-start;
          gap:10px;
          padding:12px 16px;
          border-bottom:1px solid var(--border-2, rgba(255,255,255,0.06));
          cursor:pointer;
          transition: background .2s ease;
          position: relative;
        }
        .notif-item:last-child{ border-bottom:none; }
        .notif-item:hover{ background: var(--panel-3, rgba(255,255,255,0.03)); }
        .notif-item.unread{ background: rgba(155,184,255,0.05); }
        .notif-icon{
          width:30px; height:30px;
          border-radius:999px;
          display:flex;
          align-items:center;
          justify-content:center;
          flex-shrink:0;
          margin-top:1px;
        }
        .notif-icon .material-icons-round{ font-size:15px; }
        .notif-icon.tone-danger{ background: rgba(232,84,63,0.15); color:#e8543f; }
        .notif-icon.tone-warning{ background: rgba(230,180,80,0.15); color:#e6b450; }
        .notif-icon.tone-neutral{ background: var(--panel-3, rgba(255,255,255,0.06)); color: var(--text-dim); }
        .notif-body{ flex:1; min-width:0; text-align:left; }
        .notif-title-row{
          display:flex;
          align-items:center;
          gap:6px;
        }
        .notif-title{
          font-size:12.5px;
          font-weight:600;
          color: var(--text, #f2f2f3);
          flex-shrink:0;
        }
        .notif-unread-dot{
          width:6px; height:6px;
          border-radius:999px;
          background: var(--accent, #9bb8ff);
          flex-shrink:0;
        }
        .notif-time{
          font-size:10.5px;
          color: var(--text-dimmer, #9a9aa5);
          margin-left:auto;
          flex-shrink:0;
          padding-left:8px;
        }
        .notif-detail{
          font-size:11.5px;
          color: var(--text-dimmer, #9a9aa5);
          line-height:1.4;
          margin-top:2px;
          text-align:left;
        }
        .notif-dismiss{
          background:none;
          border:none;
          color: var(--text-dimmer);
          width:20px; height:20px;
          border-radius:999px;
          display:flex;
          align-items:center;
          justify-content:center;
          flex-shrink:0;
          opacity:0;
          transition: opacity .12s ease, background .12s ease, color .12s ease;
        }
        .notif-item:hover .notif-dismiss{ opacity:1; }
        .notif-dismiss:hover{ background: var(--panel-3); color: var(--text); }
        .notif-dismiss .material-icons-round{ font-size:13px; }
        .notif-footer{
          padding:10px 16px;
          text-align:center;
          font-size:11.5px;
          color: var(--text-dimmer, #9a9aa5);
          border-top:1px solid var(--border-2, rgba(255,255,255,0.08));
          flex-shrink:0;
        }
        .user-chip{
          display:flex;
          align-items:center;
          gap:9px;
          border-radius:999px;
          padding:5px 10px 5px 6px;
          transition: background .15s ease;
          cursor:pointer;
          text-align:left;
          font-family:inherit;
          background: transparent;
          border: 1px solid var(--border, rgba(255,255,255,0.1));
          appearance: none;
          -webkit-appearance: none;
        }
        .user-chip:hover{ background: var(--panel-3); }
        .avatar{
          width:28px; height:28px;
          border-radius:999px;
          background:#46493a;
          color: var(--accent);
          font-size:11px;
          font-weight:700;
          display:flex;
          align-items:center;
          justify-content:center;
        }
        .user-meta{ line-height:1.2; }
        .user-name{ font-size:12.5px; font-weight:600; color: var(--text, #f2f2f3); }
        .user-role{ font-size:11px; color: var(--text-dimmer, #9a9aa5); }

        /* â”€â”€ Secure-Your-Workspace popup (Claude-style) â”€â”€ */
        .pw-setup-card {
          background: #252525;
          border-radius: 20px;
          border: none;
          padding: 52px 44px 44px;
          width: 100%;
          max-width: 520px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 14px;
          box-shadow: 0 32px 64px rgba(0,0,0,0.6);
          animation: slideUp 0.22s ease;
        }
        .pw-setup-title {
          font-family: Georgia, 'Times New Roman', serif !important;
          font-size: 34px;
          font-weight: 400;
          color: #fff;
          letter-spacing: -0.02em;
          line-height: 1.2;
          margin: 0;
        }
        .pw-setup-sub {
          font-size: 15px;
          color: #888;
          line-height: 1.6;
          margin: 0 0 8px;
        }
        .pw-setup-input {
          width: 100%;
          padding: 18px 20px;
          background: #333;
          border: 1.5px solid #444;
          border-radius: 14px;
          font-size: 16px;
          font-family: 'Poppins', sans-serif !important;
          color: #ccc;
          outline: none;
          box-sizing: border-box;
          transition: border-color .15s ease;
        }
        .pw-setup-input::placeholder { color: #555; }
        .pw-setup-input:focus { border-color: #666; background: #383838; }
        .pw-setup-btn {
          width: 100%;
          padding: 18px;
          background: #4a4a4a;
          border: none;
          border-radius: 14px;
          font-size: 16px;
          font-family: 'Poppins', sans-serif !important;
          font-weight: 500;
          color: #888;
          cursor: pointer;
          transition: background .2s ease, color .2s ease;
        }
        .pw-setup-btn.pw-setup-btn-active {
          background: #c8be9e;
          color: #1a1a1a;
        }
        .pw-setup-btn.pw-setup-btn-active:hover {
          background: #d4c9a8;
        }

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
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        @media (max-width: 700px){
          .tb-title{ display:none; }
          .tb-date{ display:none; }
        }
      `}</style>

      <h1 className="tb-section tb-title">{title}</h1>

      <div className="tb-divider" aria-hidden="true" />

      <div className="tb-section tb-date">{today}</div>

      <div className="tb-divider" aria-hidden="true" />

      <div className="tb-section search-bar">
        <span className="material-icons-round" style={{ color: "var(--text-dimmer)" }} aria-hidden="true">search</span>
        <label htmlFor="topbar-search" className="sr-only">{searchPlaceholder}</label>
        <input
          id="topbar-search"
          type="search"
          className="search-input"
          placeholder={searchPlaceholder}
          value={searchVal}
          onChange={handleSearchChange}
        />
        <span className="kbd" aria-hidden="true">âŒ˜K</span>
      </div>

      <div className="tb-divider" aria-hidden="true" />

      <div className="tb-section topbar-right">
        <div className="notif-wrap" ref={notifRef}>
          <button
            className="icon-btn"
            aria-label={`Notifications, ${unreadCount} unread`}
            aria-expanded={notifOpen}
            onClick={toggleNotifOpen}
          >
            <span className="material-icons-round" aria-hidden="true">notifications</span>
            {unreadCount > 0 && (
              <span className="badge-dot" aria-hidden="true">{unreadCount}</span>
            )}
          </button>

          {notifOpen && (
            <div className="notif-panel" role="menu">
              <div className="notif-header">
                <span className="notif-header-title">Notifications</span>
                {unreadCount > 0 && (
                  <button className="notif-mark-read" onClick={markAllRead}>
                    Mark all as read
                  </button>
                )}
              </div>

              <div className="notif-list">
                {notifications.length === 0 ? (
                  <div className="notif-empty">You're all caught up.</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`notif-item${n.read ? "" : " unread"}`}
                      onClick={() => markOneRead(n.id)}
                      role="menuitem"
                    >
                      <div className={`notif-icon tone-${n.tone}`} aria-hidden="true">
                        <span className="material-icons-round">{n.icon}</span>
                      </div>
                      <div className="notif-body">
                        <div className="notif-title-row">
                          <span className="notif-title">{n.title}</span>
                          {!n.read && <span className="notif-unread-dot" aria-hidden="true" />}
                          <span className="notif-time">{n.time}</span>
                        </div>
                        <div className="notif-detail">{n.detail}</div>
                      </div>
                      <button
                        className="notif-dismiss"
                        aria-label="Dismiss notification"
                        onClick={(e) => { e.stopPropagation(); dismissNotification(n.id); }}
                      >
                        <span className="material-icons-round">close</span>
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="notif-footer">That's all for now</div>
            </div>
          )}
        </div>

        <div className="user-chip" aria-label={`Account, ${displayName}`}>
          <div className="avatar" aria-hidden="true">{userInitials}</div>
          <div className="user-meta">
            <div className="user-name">{displayName}</div>
          </div>
        </div>
      </div>



      {showPasswordSetup && (
        <div className="modal-backdrop">
          <div className="pw-setup-card">
            <h2 className="pw-setup-title">Secure Your Workspace</h2>
            <p className="pw-setup-sub">
              Your Google profile has been connected.<br/>Set a local password to secure future sessions.
            </p>
            <form onSubmit={async (e) => {
              e.preventDefault();
              setPasswordSetupError("");
              try {
                const res = await fetch("/api/auth/set-password", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ password: newPassword })
                });
                if (res.ok) {
                  localStorage.removeItem("isNewUser");
                  setShowPasswordSetup(false);
                  showToast("Password configured successfully. You can now log in with your email and password.", "success");
                } else {
                  const data = await res.json().catch(() => ({}));
                  setPasswordSetupError(data.message || "Could not set password. Please try again.");
                }
              } catch (err) {
                console.error("Failed to set password:", err);
                setPasswordSetupError("Connection to backend failed. Please ensure the server is running.");
              }
            }} style={{ width: "100%", display: "flex", flexDirection: "column", gap: "10px" }}>
              <input
                id="newPassword"
                type="password"
                className="pw-setup-input"
                required
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Enter password"
              />
              {passwordSetupError && (
                <div style={{ color: "#ef6a5f", fontSize: 12.5, textAlign: "left" }}>
                  {passwordSetupError}
                </div>
              )}
              <button
                type="submit"
                disabled={newPassword.length < 8}
                className={`pw-setup-btn${newPassword.length >= 8 ? " pw-setup-btn-active" : ""}`}
              >
                Save & Continue
              </button>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}


