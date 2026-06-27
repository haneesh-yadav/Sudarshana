import React, { useState, useEffect } from 'react';
import mapReportToThread from '../utils/mapReportToThread.js';
import { Link } from 'react-router-dom';

/* ============================================================
   style constants (not data)
   ============================================================ */

const STATUS_STYLE = {
  Verified: { dot: "var(--green)", cls: "verified" },
  Flagged: { dot: "var(--orange)", cls: "flagged" },
  Quarantined: { dot: "var(--purple)", cls: "quarantined" },
  Critical: { dot: "var(--red)", cls: "critical" },
};

/* ============================================================
   stats bar
   ============================================================ */

function StatsBar({ stats }) {
  return (
    <div className="kpi-strip">
      {stats.map((s) => (
        <div key={s.label} className="kpi-card">
          <div className="kpi-top">
            <span className={"kpi-icon" + (s.tone ? " " + s.tone : "")}>
              <span className="material-icons-round" aria-hidden="true">{s.iconName}</span>
            </span>
          </div>
          <div className="kpi-text">
            <div className="kpi-value">{s.value}</div>
            <div className="kpi-label">{s.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   page header
   ============================================================ */

function PageHeader({ dateRange, setDateRange, showRangeMenu, setShowRangeMenu, rangeMenuRef }) {
  return (
    <div className="page-header">
      <div className="page-sub">Real-time overview</div>
      <div ref={rangeMenuRef} style={{ position: "relative" }}>
        <button className="range-btn" onClick={() => setShowRangeMenu(p => !p)}>
          <span className="material-icons-round" aria-hidden="true">calendar_today</span> {dateRange.label} <span className="material-icons-round" aria-hidden="true">keyboard_arrow_down</span>
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
                  transition: "background 0.12s",
                }}
                onMouseEnter={e => e.target.style.background = "var(--panel-3)"}
                onMouseLeave={e => { if (opt.label !== dateRange.label) e.target.style.background = "transparent"; }}
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

/* ============================================================
   trust gauge
   ============================================================ */

function TrustGauge({ value = 91.4 }) {
  const startAngle = 180, endAngle = 0;
  const r = 38, cx = 50, cy = 50;
  const toXY = (deg) => {
    const rad = (deg * Math.PI) / 180;
    return [cx + r * Math.cos(rad), cy - r * Math.sin(rad)];
  };
  const arcPath = (a1, a2) => {
    const [x1, y1] = toXY(a1);
    const [x2, y2] = toXY(a2);
    const large = a1 - a2 > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  };
  const frac = Math.min(value / 100, 1);
  const needleAngle = startAngle - frac * (startAngle - endAngle);
  const [nx, ny] = toXY(needleAngle);

  return (
    <svg viewBox="0 0 100 58" width="100%" height="100" style={{ overflow: "visible" }}>
      <path d={arcPath(180, 0)} stroke="rgba(255,255,255,0.08)" strokeWidth="7" fill="none" strokeLinecap="round" />
      <path d={arcPath(180, 126)} stroke="var(--red)" strokeWidth="7" fill="none" strokeLinecap="round" />
      <path d={arcPath(126, 36)} stroke="var(--orange)" strokeWidth="7" fill="none" strokeLinecap="round" />
      <path d={arcPath(36, 0)} stroke="var(--green)" strokeWidth="7" fill="none" strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="var(--text)" strokeWidth="2" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r="3.4" fill="var(--text)" />
    </svg>
  );
}

function TrustGaugeCard({ value, delta }) {
  return (
    <div className="gauge-card">
      <div className="gauge-card-head">
        <div className="chart-title">Org-wide trust score</div>
        <div className="chart-sub">Weighted across all active threads</div>
      </div>
      <TrustGauge value={value} />
      <div className="gauge-readout">{value}%</div>
      {delta ? (
        <div className={`gauge-delta ${delta.direction === "up" ? "good" : "bad"}`}>
          <span className="material-icons-round" aria-hidden="true">{delta.direction === "up" ? "trending_up" : "trending_down"}</span>
          {delta.direction === "up" ? "+" : ""}{delta.value}pt vs. previous period
        </div>
      ) : (
        <div className="gauge-delta" style={{ color: "var(--text-dimmer)" }}>
          <span className="material-icons-round" aria-hidden="true">trending_flat</span> No prior data
        </div>
      )}
    </div>
  );
}

/* ============================================================
   critical activity feed
   ============================================================ */

function CriticalFeedCard({ items }) {
  return (
    <div className="feed-card">
      <div className="feed-card-head">
        <div>
          <div className="chart-title">Needs attention</div>
          <div className="chart-sub">Most urgent threads right now</div>
        </div>
        <Link to="/threads" className="see-all-link">
          See all threads <span className="material-icons-round" aria-hidden="true">arrow_forward</span>
        </Link>
      </div>
      <div className="feed-list">
        {items.map((t) => {
          const s = STATUS_STYLE[t.status] || STATUS_STYLE.Verified;
          return (
            <Link key={t.id} to="/threads" className="feed-row">
              <span className="status-dot" style={{ background: s.dot }} aria-hidden="true" />
              <div className="feed-body">
                <span className="feed-subject">{t.subject}</span>
                <span className="feed-meta">{t.domain} Â· {t.last}</span>
              </div>
              <span className={"status-pill " + s.cls}>{t.status}</span>
              <span className="material-icons-round feed-arrow" aria-hidden="true">chevron_right</span>
            </Link>
          );
        })}
        {items.length === 0 && (
          <div style={{ padding: '20px 0', color: 'var(--text-dimmer)', fontSize: '13px', textAlign: 'center' }}>
            No urgent threads require attention.
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   watch list
   ============================================================ */

function WatchListCard({ domains }) {
  return (
    <div className="watch-card">
      <div className="chart-title">Domains to watch</div>
      <div className="chart-sub">Highest incident count, last 7 days</div>
      <div className="watch-list">
        {domains.map((d) => (
          <Link key={d.domain} to="/security-posture" className="watch-row">
            <div className="watch-domain">{d.domain}</div>
            <div className="watch-meta">
              <span className="watch-incidents">{d.incidents} incidents</span>
              <span className="watch-trust" style={{ color: d.trust >= 80 ? "var(--green)" : d.trust >= 50 ? "var(--orange)" : "var(--red)" }}>{d.trust}% trust</span>
            </div>
          </Link>
        ))}
        {domains.length === 0 && (
          <div style={{ padding: '20px 0', color: 'var(--text-dimmer)', fontSize: '13px', textAlign: 'center' }}>
            No threat domains detected.
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   quick links
   ============================================================ */



/* ============================================================
   mapper utility
   ============================================================ */


/* ============================================================
   main page
   ============================================================ */

const EMPTY_STATS = [
  { iconName: "mail", label: "Threads", value: 0 },
  { iconName: "warning", label: "Active threats", value: 0, tone: "red" },
  { iconName: "shield", label: "Verified", value: 0, tone: "green" },
  { iconName: "tag", label: "Avg. trust score", value: "—", tone: "accent" },
  { iconName: "schedule", label: "Quarantined", value: 0, tone: "purple" },
];

const RANGE_OPTIONS = [
  { label: "Last 7 days", days: 7 },
  { label: "Last 14 days", days: 14 },
  { label: "Last 30 days", days: 30 },
  { label: "All time", days: 0 },
];

export default function Home() {
  const [stats, setStats] = useState(EMPTY_STATS);
  const [criticalFeed, setCriticalFeed] = useState([]);
  const [watchDomains, setWatchDomains] = useState([]);
  const [trustScore, setTrustScore] = useState(0);
  const [trustDelta, setTrustDelta] = useState(null);
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
    const fetchHomeData = async () => {
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
          
          const activeThreats = mapped.filter(t => t.status === "Critical" || t.status === "Flagged").length;
          const verified = mapped.filter(t => t.status === "Verified").length;
          const quarantined = mapped.filter(t => t.status === "Quarantined").length;
          const avgTrust = mapped.length > 0 ? Math.round(mapped.reduce((sum, t) => sum + t.trust, 0) / mapped.length) : 0;

          const dynamicStats = [
            { iconName: "mail", label: "Threads", value: mapped.length },
            { iconName: "warning", label: "Active threats", value: activeThreats, tone: "red" },
            { iconName: "shield", label: "Verified", value: verified, tone: "green" },
            { iconName: "tag", label: "Avg. trust score", value: avgTrust + "%", tone: "accent" },
            { iconName: "schedule", label: "Quarantined", value: quarantined, tone: "purple" },
          ];
          setStats(dynamicStats);
          setTrustScore(avgTrust);

          // Compute trust delta by fetching previous period data
          if (dateRange.days > 0) {
            try {
              const prevStart = Date.now() - dateRange.days * 2 * 24 * 60 * 60 * 1000;
              const prevEnd = Date.now() - dateRange.days * 24 * 60 * 60 * 1000;
              let prevUrl = `/api/threads${userId ? `?userId=${userId}` : ""}`;
              prevUrl += `${userId ? "&" : "?"}startDate=${prevStart}&endDate=${prevEnd}`;
              const prevRes = await fetch(prevUrl);
              if (prevRes.ok) {
                const prevData = await prevRes.json();
                const prevMapped = prevData.map(mapReportToThread);
                const prevAvgTrust = prevMapped.length > 0
                  ? Math.round(prevMapped.reduce((sum, t) => sum + t.trust, 0) / prevMapped.length)
                  : avgTrust;
                const delta = avgTrust - prevAvgTrust;
                setTrustDelta(delta !== 0 ? { value: delta, direction: delta > 0 ? "up" : "down" } : null);
              }
            } catch {
              setTrustDelta(null);
            }
          }

          const feed = mapped
            .filter(t => t.status === "Critical" || t.status === "Flagged")
            .sort((a,b) => a.trust - b.trust)
            .slice(0, 3)
            .map(t => ({
              id: t.id,
              subject: t.subject,
              domain: t.domain,
              status: t.status,
              trust: t.trust,
              last: t.last,
              reason: t.flag || "SPF/DKIM failures or cryptographic chain breaks detected."
            }));
          setCriticalFeed(feed);

          const domainMap = {};
          mapped.forEach(t => {
            if (!t.domain) return;
            if (!domainMap[t.domain]) {
              domainMap[t.domain] = { domain: t.domain, incidents: 0, trustSum: 0, count: 0 };
            }
            domainMap[t.domain].count += 1;
            domainMap[t.domain].trustSum += t.trust;
            if (t.status !== "Verified") {
              domainMap[t.domain].incidents += 1;
            }
          });
          const watch = Object.values(domainMap)
            .map(d => ({
              domain: d.domain,
              incidents: d.incidents,
              trust: Math.round(d.trustSum / d.count)
            }))
            .filter(d => d.incidents > 0)
            .sort((a,b) => b.incidents - a.incidents || a.trust - b.trust)
            .slice(0, 3);
          setWatchDomains(watch);
        }
      } catch {
        // backend offline
      }
    };

    fetchHomeData();

    const handleUserChange = () => {
      fetchHomeData();
    };
    window.addEventListener('tg-user-changed', handleUserChange);
    return () => window.removeEventListener('tg-user-changed', handleUserChange);
  }, [dateRange]);

  return (
    <>
      <style>{`
        /* KPI strip -- compact horizontal cards */
        .kpi-strip{
          display:flex;
          flex-direction:row;
          gap:10px;
          flex-wrap:nowrap;
        }
        .kpi-card{
          flex: 1;
          background: var(--panel);
          border:1px solid var(--border);
          border-radius: var(--radius-lg);
          padding:22px 24px;
          display:flex;
          align-items:center;
          gap:16px;
          min-width:0;
        }
        .kpi-top{ display:flex; align-items:center; flex-shrink:0; }
        .kpi-icon{
          width:46px; height:46px; border-radius:12px; flex-shrink:0;
          background: var(--panel-3);
          display:flex; align-items:center; justify-content:center;
          color: var(--text-dim);
        }
        .kpi-icon .material-icons-round{ font-size:18px; }
        .kpi-icon.red{ background: var(--red-bg); color: var(--red); }
        .kpi-icon.green{ background: var(--green-bg); color: var(--green); }
        .kpi-icon.purple{ background: var(--purple-bg); color: var(--purple); }
        .kpi-icon.accent{ background: var(--accent-dim); color: var(--accent); }
        .kpi-text{ display:flex; flex-direction:column; gap:2px; min-width:0; }
        .kpi-value{ font-size:24px; font-weight:700; letter-spacing:-0.01em; line-height:1.2; white-space:nowrap; }
        .kpi-label{ font-size:13px; color: var(--text-dimmer); white-space:nowrap; }

        /* page header */
        .page-header{ display:flex; align-items:center; justify-content:space-between; }
        .page-sub{ font-size:13px; color: var(--text-dimmer); }
        .range-btn{
          display:flex; align-items:center; gap:8px;
          background: var(--panel); border:1px solid var(--border);
          border-radius:999px; padding:9px 14px; font-size:13px; color: var(--text-dim);
        }
        .range-btn .material-icons-round{ font-size:13px; }

        /* shared card chrome */
        .chart-title{ font-size:13.5px; font-weight:700; }
        .chart-sub{ font-size:11.5px; color: var(--text-dimmer); margin-top:3px; }

        /* main grid */
        .dash-grid{
          display:grid;
          grid-template-columns: 2fr 1fr;
          gap:14px;
          align-items:start;
        }
        .dash-col{ display:flex; flex-direction:column; gap:14px; min-width:0; }

        /* trust gauge */
        .gauge-card{
          background: var(--panel); border:1px solid var(--border);
          border-radius: var(--radius-lg); padding:20px;
          display:flex; flex-direction:column; align-items:center; text-align:center;
        }
        .gauge-card-head{ align-self:flex-start; text-align:left; margin-bottom:6px; }
        .gauge-readout{ font-size:28px; font-weight:700; margin-top:4px; letter-spacing:-0.01em; }
        .gauge-delta{ display:flex; align-items:center; gap:4px; font-size:12px; font-weight:600; margin-top:6px; }
        .gauge-delta .material-icons-round{ font-size:14px; }
        .gauge-delta.good{ color: var(--green); }

        /* critical feed */
        .feed-card{
          background: var(--panel); border:1px solid var(--border);
          border-radius: var(--radius-lg); padding:20px;
        }
        .feed-card-head{ display:flex; align-items:flex-start; justify-content:space-between; gap:12px; }
        .see-all-link{
          display:flex; align-items:center; gap:5px; flex-shrink:0;
          font-size:12px; font-weight:600; color: var(--text-dim);
          padding:7px 10px; border-radius:999px; background: var(--panel-3);
          text-decoration:none; transition: color .15s ease, background .15s ease;
        }
        .see-all-link:hover{ color: var(--text); background: var(--panel-2); }
        .see-all-link .material-icons-round{ font-size:13px; }

        .feed-list{ display:flex; flex-direction:column; margin-top:14px; }
        .feed-row{
          display:flex; align-items:center; gap:12px;
          padding:12px 10px; border-radius:12px;
          text-decoration:none; color:inherit;
          border-bottom:1px solid var(--border);
          transition: background .12s ease;
        }
        .feed-row:last-child{ border-bottom:none; }
        .feed-row:hover{ background: var(--panel-2); }
        .feed-row .status-dot{ width:7px; height:7px; border-radius:999px; flex-shrink:0; }
        .feed-body{ flex:1; min-width:0; display:flex; flex-direction:column; gap:3px; }
        .feed-subject{
          font-size:13px; font-weight:600; color: var(--text);
          white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
        }
        .feed-meta{ font-size:11.5px; color: var(--text-dimmer); }
        .feed-arrow{ font-size:16px; color: var(--text-dimmer); flex-shrink:0; }

        .status-pill{ font-size:11px; font-weight:600; padding:3px 9px; border-radius:999px; white-space:nowrap; flex-shrink:0; }
        .status-pill.verified{ background: var(--green-bg); color: var(--green); }
        .status-pill.flagged{ background: var(--orange-bg); color: var(--orange); }
        .status-pill.quarantined{ background: var(--purple-bg); color: var(--purple); }
        .status-pill.critical{ background: var(--red-bg); color: var(--red); }

        /* watch list */
        .watch-card{
          background: var(--panel); border:1px solid var(--border);
          border-radius: var(--radius-lg); padding:20px;
        }
        .watch-list{ display:flex; flex-direction:column; margin-top:14px; }
        .watch-row{
          display:flex; align-items:center; justify-content:space-between; gap:10px;
          padding:11px 10px; border-radius:10px;
          text-decoration:none; color:inherit;
          border-bottom:1px solid var(--border);
          transition: background .12s ease;
        }
        .watch-row:last-child{ border-bottom:none; }
        .watch-row:hover{ background: var(--panel-2); }
        .watch-domain{ font-size:12.5px; font-weight:600; color: var(--text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .watch-meta{ display:flex; align-items:center; gap:10px; flex-shrink:0; }
        .watch-incidents{ font-size:11.5px; color: var(--text-dimmer); }
        .watch-trust{ font-size:11.5px; font-weight:700; }

        /* quick links */
        .quicklinks-card{
          background: var(--panel); border:1px solid var(--border);
          border-radius: var(--radius-lg); padding:20px;
        }
        .quicklinks-grid{ display:flex; flex-direction:column; gap:8px; margin-top:14px; }
        .quicklink{
          display:flex; align-items:center; gap:12px;
          padding:12px; border-radius:12px;
          background: var(--panel-2); border:1px solid var(--border);
          text-decoration:none; color:inherit;
          transition: background .15s ease, border-color .15s ease;
        }
        .quicklink:hover{ background: var(--panel-3); border-color: var(--border-2); }
        .quicklink-icon{
          width:34px; height:34px; border-radius:10px; flex-shrink:0;
          background: var(--panel-3); display:flex; align-items:center; justify-content:center;
          color: var(--text-dim);
        }
        .quicklink-icon .material-icons-round{ font-size:16px; }
        .quicklink-label{ font-size:12.5px; font-weight:600; }
        .quicklink-desc{ font-size:11px; color: var(--text-dimmer); margin-top:2px; }
        .quicklink-arrow{ font-size:14px; color: var(--text-dimmer); margin-left:auto; flex-shrink:0; }

        ::selection{ background: var(--accent-dim); }

        @media (max-width: 1100px){
          .dash-grid{ grid-template-columns: 1fr; }
        }
        @media (max-width: 640px){
          .kpi-strip{ flex-wrap: wrap; gap: 8px; }
          .kpi-card{ flex: calc(50% - 4px); min-width: calc(50% - 4px); padding: 14px 16px; gap: 12px; }
          .kpi-value{ font-size: 20px; }
          .kpi-icon{ width: 38px; height: 38px; border-radius: 10px; }
          .kpi-icon .material-icons-round{ font-size: 16px; }
          .page-header{ flex-direction: column; align-items: flex-start; gap: 8px; }
          .feed-card-head{ flex-direction: column; gap: 8px; }
          .see-all-link{ align-self: flex-start; }
          .watch-meta{ flex-direction: column; align-items: flex-end; gap: 2px; }
        }
      `}</style>

      <StatsBar stats={stats} />
      <PageHeader dateRange={dateRange} setDateRange={setDateRange} showRangeMenu={showRangeMenu} setShowRangeMenu={setShowRangeMenu} rangeMenuRef={rangeMenuRef} />

      <div className="dash-grid">
        <div className="dash-col">
          <CriticalFeedCard items={criticalFeed} />
        </div>
        <div className="dash-col">
          <TrustGaugeCard value={trustScore} delta={trustDelta} />
          <WatchListCard domains={watchDomains} />
        </div>
      </div>
    </>
  );
}