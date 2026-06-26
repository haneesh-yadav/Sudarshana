import React, { useState, useEffect } from 'react';

const ACTION_BADGES = {
  DOMAIN_BLACKLIST: { bg: "rgba(245, 158, 11, 0.12)", border: "rgba(245, 158, 11, 0.3)", color: "#f59e0b", icon: "block" },
  HIJACK_SIMULATION: { bg: "rgba(239, 68, 68, 0.12)", border: "rgba(239, 68, 68, 0.3)", color: "#ef4444", icon: "settings_backup_restore" },
  SANDBOX_LAUNCH: { bg: "rgba(168, 85, 247, 0.12)", border: "rgba(168, 85, 247, 0.3)", color: "#a855f7", icon: "biotech" },
  EMAIL_SYNC: { bg: "rgba(59, 130, 246, 0.12)", border: "rgba(59, 130, 246, 0.3)", color: "#3b82f6", icon: "sync" },
  EMAIL_REPLY: { bg: "rgba(16, 185, 129, 0.12)", border: "rgba(16, 185, 129, 0.3)", color: "#10b981", icon: "reply" }
};

const DEFAULT_BADGE = { bg: "rgba(107, 114, 128, 0.12)", border: "rgba(107, 114, 128, 0.3)", color: "#6b7280", icon: "history_edu" };

const TABS = [
  { label: "All", match: "ALL" },
  { label: "Blacklist", match: "DOMAIN_BLACKLIST" },
  { label: "Hijack Sim", match: "HIJACK_SIMULATION" },
  { label: "Sandbox", match: "SANDBOX_LAUNCH" },
  { label: "Sync", match: "EMAIL_SYNC" },
  { label: "Reply", match: "EMAIL_REPLY" },
];

/* ---------- filter row ---------- */
function FilterRow({ active, setActive, counts, onRefresh }) {
  return (
    <div className="filter-row">
      <div style={{ display: "flex", alignItems: "center" }}>
        <div className="tabs">
          {TABS.map((t) => (
            <div
              key={t.label}
              className={"tab" + (t.match === active ? " active" : "")}
              onClick={() => setActive(t.match)}
            >
              {t.label} <b>{counts[t.match] || 0}</b>
            </div>
          ))}
        </div>
      </div>
      <div className="toggles">
        <button className="filter-icon-btn" onClick={onRefresh} title="Refresh logs">
          <span className="material-icons-round">refresh</span>
        </button>
      </div>
    </div>
  );
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("ALL");

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/audit-logs");
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error("Failed to fetch audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => activeFilter === "ALL" || log.action === activeFilter);

  const counts = logs.reduce((acc, log) => {
    acc.ALL = (acc.ALL || 0) + 1;
    acc[log.action] = (acc[log.action] || 0) + 1;
    return acc;
  }, {});

  const formatTimestamp = (ts) => {
    return new Date(ts).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="audit-logs-root">
      <style>{`
        .audit-logs-root {
          display: flex;
          flex-direction: column;
          gap: 16px;
          color: var(--text);
          font-family: var(--sans);
          box-sizing: border-box;
          width: 100%;
          height: 100%;
          min-height: 0;
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
        .toggles{ display:flex; align-items:center; gap:18px; flex-shrink:0; }
        .filter-icon-btn{
          width:34px; height:34px; border-radius:999px;
          background: var(--panel); border:1px solid var(--border);
          display:flex; align-items:center; justify-content:center;
          color: var(--text-dim); cursor:pointer; transition: background .15s ease, color .15s ease;
        }
        .filter-icon-btn:hover{ color: var(--text); background: var(--panel-2); }
        .filter-icon-btn .material-icons-round{ font-size:16px; }

        /* table */
        .table-wrap{
          flex:1; min-height:0; overflow:auto;
          border:1px solid var(--border);
          border-radius: var(--radius-lg, 16px);
          background: var(--panel);
        }
        .t-row{
          display:grid;
          grid-template-columns: 190px 220px 200px 1fr;
          align-items:center;
          gap:14px;
          padding:13px 18px;
        }
        .t-head{
          font-size:11.5px; text-transform:uppercase; letter-spacing:.04em;
          color: var(--text-dimmer); border-bottom:1px solid var(--border);
          position:sticky; top:0; background: var(--panel); z-index:1;
        }
        .t-data{ border-bottom:1px solid var(--border); transition: background .12s ease; }
        .t-data:hover{ background: var(--panel-2); }
        .t-data:last-child{ border-bottom:none; }

        .time-cell { white-space: nowrap; color: var(--text); font-weight: 500; font-size: 12.5px; }
        .user-cell { white-space: nowrap; font-family: monospace; color: var(--text-dim); font-size: 12.5px; overflow: hidden; text-overflow: ellipsis; }
        .detail-cell { line-height: 1.5; word-break: break-word; font-size: 12.5px; color: var(--text-dim); }

        .action-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 8px;
          font-size: 11.5px;
          font-weight: 600;
          letter-spacing: 0.02em;
          border: 1px solid transparent;
          white-space: nowrap;
        }

        .empty-state{ padding:40px; text-align:center; color: var(--text-dimmer); font-size:13px; display: flex; flex-direction: column; align-items: center; gap: 12px; }
        .empty-icon{ font-size: 36px; color: var(--text-dimmer); }

        @media (max-width: 900px){
          .t-row{ grid-template-columns: 140px 1fr 140px 0; }
          .detail-cell{ display:none; }
        }
      `}</style>

      <FilterRow active={activeFilter} setActive={setActiveFilter} counts={counts} onRefresh={fetchLogs} />

      <div className="table-wrap">
        <div className="t-row t-head">
          <div>Timestamp</div>
          <div>Analyst</div>
          <div>Action</div>
          <div>Description</div>
        </div>
        {loading ? (
          <div className="empty-state">
            <span className="material-icons-round empty-icon spinner">sync</span>
            <p>Loading database audit trail...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="empty-state">
            <span className="material-icons-round empty-icon">assignment_late</span>
            <p>No audit log events found matching the criteria.</p>
          </div>
        ) : (
          filteredLogs.map(log => {
            const badge = ACTION_BADGES[log.action] || DEFAULT_BADGE;
            return (
              <div className="t-row t-data" key={log.id}>
                <div className="time-cell">{formatTimestamp(log.timestamp)}</div>
                <div className="user-cell">{log.userEmail || "System"}</div>
                <div>
                  <span
                    className="action-badge"
                    style={{
                      background: badge.bg,
                      borderColor: badge.border,
                      color: badge.color
                    }}
                  >
                    <span className="material-icons-round" style={{ fontSize: 13 }}>{badge.icon}</span>
                    {log.action}
                  </span>
                </div>
                <div className="detail-cell">{log.details}</div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
