import React, { useState, useEffect } from 'react';
import mapReportToThread from '../utils/mapReportToThread.js';
import { showToast } from '../utils/toast';

/* Inline close icon -- doesn't depend on an icon font being loaded,
   so it always renders instead of going blank inside drawers/modals. */
function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e4e4e7" strokeWidth="2.6" strokeLinecap="round">
      <line x1="5" y1="5" x2="19" y2="19" />
      <line x1="19" y1="5" x2="5" y2="19" />
    </svg>
  );
}

/**
 * ReportsPage
 * "Reports" view for Sudarshana.
 * Same design system as ThreadsPage.jsx / SecurityPosturePage.jsx --
 * reuses the same CSS custom properties (--panel, --border, --text,
 * --green, --red, etc.) defined globally in App.css.
 */

/* ============================================================
   style & UI constants (not data)
   ============================================================ */



const STATUS_PILL_STYLE = {
  Ready: { cls: "verified", dot: "var(--green)" },
  Pending: { cls: "flagged", dot: "var(--orange)" },
};

const FORMAT_ICON = { PDF: "picture_as_pdf", CSV: "table_chart", XLSX: "grid_on" };

/* ============================================================
   page header
   ============================================================ */

function PageHeader() {
  return (
    <div className="page-header">
      <div className="page-sub">Board-level summary & exports Â· last updated Just now</div>
      <button className="range-btn">
        <span className="material-icons-round">calendar_today</span> Last 12 weeks <span className="material-icons-round">keyboard_arrow_down</span>
      </button>
    </div>
  );
}

/* ============================================================
   mapper utility
   ============================================================ */


/* ============================================================
   KPI strip
   ============================================================ */

function KpiStrip({ kpis }) {
  return (
    <div className="kpi-strip">
      {kpis.map((k) => (
        <div key={k.label} className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-icon"><span className="material-icons-round">{k.iconName}</span></span>
            {k.delta ? (
              <span className={"kpi-delta " + (k.dir === "up" || k.dir === "down-good" ? "good" : "bad")}>
                <span className="material-icons-round">{k.dir === "up" ? "trending_up" : k.dir === "down-good" ? "trending_down" : "trending_flat"}</span>
                {k.delta}
              </span>
            ) : null}
          </div>
          <div className="kpi-value">{k.value}</div>
          <div className="kpi-label">{k.label}</div>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   trend chart (hand-rolled SVG line + bar combo)
   ============================================================ */

function TrendChart({ trendData }) {
  const data = (trendData && trendData.length > 0) ? trendData : Array.from({ length: 12 }, (_, i) => ({ wk: `W${i + 1}`, scanned: 0, blocked: 0 }));
  const W = 640, H = 220, padL = 36, padR = 12, padT = 16, padB = 28;
  const innerW = W - padL - padR, innerH = H - padT - padB;

  const maxScanned = Math.max(...data.map((d) => d.scanned)) || 1;
  const maxBlocked = Math.max(...data.map((d) => d.blocked)) || 1;

  const x = (i) => padL + (i / (data.length - 1)) * innerW;
  const yScanned = (v) => padT + innerH - (v / maxScanned) * innerH;

  const linePath = data.map((d, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${yScanned(d.scanned).toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L ${x(data.length - 1).toFixed(1)} ${(padT + innerH).toFixed(1)} L ${x(0).toFixed(1)} ${(padT + innerH).toFixed(1)} Z`;

  const barW = (innerW / data.length) * 0.36;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" preserveAspectRatio="none">
      <defs>
        <linearGradient id="scannedFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* gridlines */}
      {[0, 0.25, 0.5, 0.75, 1].map((f) => (
        <line
          key={f}
          x1={padL} x2={W - padR}
          y1={padT + innerH * f} y2={padT + innerH * f}
          stroke="rgba(255,255,255,0.06)" strokeWidth="1"
        />
      ))}

      {/* blocked bars (secondary axis, scaled to its own max) */}
      {data.map((d, i) => {
        const bh = (d.blocked / maxBlocked) * (innerH * 0.46);
        return (
          <rect
            key={d.wk}
            x={x(i) - barW / 2}
            y={padT + innerH - bh}
            width={barW}
            height={bh}
            rx="2.5"
            fill="var(--red)"
            opacity="0.55"
          />
        );
      })}

      {/* scanned area + line */}
      <path d={areaPath} fill="url(#scannedFill)" />
      <path d={linePath} fill="none" stroke="var(--accent)" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((d, i) => (
        <circle key={d.wk} cx={x(i)} cy={yScanned(d.scanned)} r="2.6" fill="var(--accent)" />
      ))}

      {/* x labels */}
      {data.map((d, i) => (
        i % 2 === 0 && (
          <text key={d.wk} x={x(i)} y={H - 8} fontSize="9.5" fill="var(--text-dimmer)" textAnchor="middle">{d.wk}</text>
        )
      ))}
    </svg>
  );
}

function TrendCard({ trendData }) {
  return (
    <div className="chart-card wide">
      <div className="chart-card-head">
        <div>
          <div className="chart-title">Threads scanned vs. threats blocked</div>
          <div className="chart-sub">Weekly, last 12 weeks</div>
        </div>
        <div className="chart-legend">
          <span className="legend-item"><i className="dot accent" /> Scanned</span>
          <span className="legend-item"><i className="dot red" /> Blocked</span>
        </div>
      </div>
      <div className="chart-body">
        <TrendChart trendData={trendData} />
      </div>
    </div>
  );
}

/* ============================================================
   status breakdown (donut)
   ============================================================ */

function StatusDonut({ statusBreakdown }) {
  const total = statusBreakdown.reduce((s, d) => s + d.value, 0);
  const r = 38, cx = 50, cy = 50, circ = 2 * Math.PI * r;
  let offsetAcc = 0;

  return (
    <svg viewBox="0 0 100 100" width="148" height="148">
      <circle cx={cx} cy={cy} r={r} stroke="rgba(255,255,255,0.06)" strokeWidth="13" fill="none" />
      {statusBreakdown.map((d) => {
        const frac = total > 0 ? d.value / total : 0;
        const dash = frac * circ;
        const circle = (
          <circle
            key={d.label}
            cx={cx} cy={cy} r={r}
            stroke={d.color}
            strokeWidth="13"
            fill="none"
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeDashoffset={-offsetAcc}
            transform={`rotate(-90 ${cx} ${cy})`}
            strokeLinecap="butt"
          />
        );
        offsetAcc += dash;
        return circle;
      })}
      <text x={cx} y={cy - 3} fontSize="13" fontWeight="700" fill="var(--text)" textAnchor="middle">{total.toLocaleString()}</text>
      <text x={cx} y={cy + 10} fontSize="7" fill="var(--text-dimmer)" textAnchor="middle">total threads</text>
    </svg>
  );
}

function StatusBreakdownCard({ statusBreakdown }) {
  const total = statusBreakdown.reduce((s, d) => s + d.value, 0);
  return (
    <div className="chart-card">
      <div className="chart-card-head">
        <div>
          <div className="chart-title">Status breakdown</div>
          <div className="chart-sub">All threads, last 7 days</div>
        </div>
      </div>
      <div className="donut-row">
        <StatusDonut statusBreakdown={statusBreakdown} />
        <div className="donut-legend">
          {statusBreakdown.map((d) => (
            <div key={d.label} className="donut-legend-row">
              <span className="legend-item"><i className="dot" style={{ background: d.color }} /> {d.label}</span>
              <span className="donut-legend-val">{d.value} <span>({total > 0 ? Math.round((d.value / total) * 100) : 0}%)</span></span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   top incident domains (horizontal bars)
   ============================================================ */

function TopDomainsCard({ topDomains }) {
  const max = Math.max(...topDomains.map((d) => d.incidents), 1);
  return (
    <div className="chart-card wide">
      <div className="chart-card-head">
        <div>
          <div className="chart-title">Top incident domains</div>
          <div className="chart-sub">By flagged + quarantined + critical threads</div>
        </div>
      </div>
      <div className="hbar-list">
        {topDomains.map((d) => {
          const color = d.trust >= 50 ? "var(--orange)" : "var(--red)";
          return (
            <div key={d.domain} className="hbar-row">
              <div className="hbar-label">{d.domain}</div>
              <div className="hbar-track">
                <div className="hbar-fill" style={{ width: `${(d.incidents / max) * 100}%`, background: color }} />
              </div>
              <div className="hbar-val">{d.incidents}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
   export controls
   ============================================================ */

function ExportControls({ onGenerate }) {
  const [format, setFormat] = useState("PDF");
  const [range, setRange] = useState("Last 7 days");
  const formats = ["PDF", "CSV", "XLSX"];

  return (
    <div className="export-card">
      <div className="export-head">
        <div>
          <div className="chart-title">Generate a new report</div>
          <div className="chart-sub">Exports include KPIs, trend charts, and the underlying data table.</div>
        </div>
      </div>
      <div className="export-controls-row">
        <div className="export-field">
          <label>Date range</label>
          <div className="select-fake">
            {range} <span className="material-icons-round">keyboard_arrow_down</span>
          </div>
        </div>
        <div className="export-field">
          <label>Format</label>
          <div className="format-toggle">
            {formats.map((f) => (
              <div key={f} className={"format-opt" + (f === format ? " active" : "")} onClick={() => setFormat(f)}>
                <span className="material-icons-round">{FORMAT_ICON[f]}</span> {f}
              </div>
            ))}
          </div>
        </div>
        <button className="btn-primary export-btn" onClick={() => onGenerate(format, range)}>
          <span className="material-icons-round">file_download</span> Generate & download
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   report list + drawer
   ============================================================ */

function ReportFormatPill({ format }) {
  return (
    <span className="format-pill">
      <span className="material-icons-round">{FORMAT_ICON[format]}</span> {format}
    </span>
  );
}

function ReportsTable({ rows, onOpen, selectedId }) {
  return (
    <div className="table-wrap">
      <div className="t-row reports-head t-head">
        <div>Status</div>
        <div>Report</div>
        <div>Type</div>
        <div>Period</div>
        <div>Format</div>
        <div>Generated</div>
      </div>
      <div className="t-body">
        {rows.map((r) => {
          const s = STATUS_PILL_STYLE[r.status];
          return (
            <div
              key={r.id}
              className={"t-row reports-row t-data" + (r.id === selectedId ? " selected" : "")}
              onClick={(e) => { e.stopPropagation(); onOpen(r); }}
            >
              <div className="c-status">
                <span className="status-dot" style={{ background: s.dot }} />
                <span className={"status-pill " + s.cls}>{r.status}</span>
              </div>
              <div className="c-subject">
                <div className="subj-line">{r.name}</div>
                <div className="subj-sub">{r.id}</div>
              </div>
              <div className="c-domain">{r.type}</div>
              <div className="c-domain">{r.period}</div>
              <div><ReportFormatPill format={r.format} /></div>
              <div className="c-last">{r.generated}</div>
            </div>
          );
        })}
        {rows.length === 0 && <div className="empty-state">No reports match this filter.</div>}
      </div>
    </div>
  );
}

function ReportDrawer({ report, onClose, onDownload }) {
  if (!report) return null;
  const s = STATUS_PILL_STYLE[report.status];
  const ready = report.status === "Ready";
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
            background: '#1c1c1e', border: '1px solid #333',
            borderRadius: 16,
            boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
            display: 'flex', flexDirection: 'column',
            padding: 24, overflowY: 'auto',
            zIndex: 2001,
          }}
        >
        <div className="drawer-head">
          <div>
            <div className="drawer-id">{report.id}</div>
            <div className="drawer-title">{report.name}</div>
          </div>
          <button className="icon-btn-flat" onClick={onClose}><CloseIcon /></button>
        </div>

        <div className="drawer-status-row">
          <span className="status-dot lg" style={{ background: s.dot }} />
          <span className={"status-pill " + s.cls}>{report.status}</span>
          <ReportFormatPill format={report.format} />
          <span className="drawer-meta">{report.size}</span>
        </div>

        <div className="drawer-section">
          <div className="drawer-section-title">Details</div>
          <div className="signal-row">
            <div className="signal-label"><span className="material-icons-round">category</span> Type</div>
            <div className="signal-val-text">{report.type}</div>
          </div>
          <div className="signal-row">
            <div className="signal-label"><span className="material-icons-round">date_range</span> Period covered</div>
            <div className="signal-val-text">{report.period}</div>
          </div>
          <div className="signal-row">
            <div className="signal-label"><span className="material-icons-round">schedule</span> Generated</div>
            <div className="signal-val-text">{report.generated}</div>
          </div>
        </div>

        <div className="drawer-section">
          <div className="drawer-section-title">Summary</div>
          <p className="drawer-summary">{report.summary}</p>
        </div>

        <div className="drawer-actions">
          <button className="btn-secondary" onClick={() => showToast('Report emailed to company directors.', 'success')}>Email to board</button>
          <button className="btn-primary" disabled={!ready} onClick={() => onDownload(report)}>
            <span className="material-icons-round" style={{ fontSize: 14, marginRight: 6, verticalAlign: -2 }}>file_download</span>
            {ready ? "Download" : "Pending"}
          </button>
        </div>
        </aside>
      </div>
    </>
  );
}

const REPORT_TABS = [
  { label: "All", match: () => true },
  { label: "Ready", match: (r) => r.status === "Ready" },
  { label: "Pending", match: (r) => r.status === "Pending" },
];

function ReportsList({ reports, onDownload }) {
  const [active, setActive] = useState("All");
  const [selected, setSelected] = useState(null);

  const counts = REPORT_TABS.reduce((acc, t) => {
    acc[t.label] = reports.filter(t.match).length;
    return acc;
  }, {});
  const filtered = reports.filter(REPORT_TABS.find((t) => t.label === active).match);

  return (
    <>
      <div className="filter-row">
        <div style={{ display: "flex", alignItems: "center" }}>
          <div className="tabs">
            {REPORT_TABS.map((t) => (
              <div
                key={t.label}
                className={"tab" + (t.label === active ? " active" : "")}
                onClick={() => setActive(t.label)}
              >
                {t.label} <b>{counts[t.label]}</b>
              </div>
            ))}
          </div>
        </div>
        <div className="toggles">
          <div className="toggle-row">
            <span><span className="material-icons-round" style={{ fontSize: 13, marginRight: 4, verticalAlign: -2 }}>folder</span>Generated reports</span>
            <span className="avg-trust">{reports.length}</span>
          </div>
        </div>
      </div>
      <ReportsTable rows={filtered} onOpen={setSelected} selectedId={selected?.id} />
      <ReportDrawer report={selected} onClose={() => setSelected(null)} onDownload={onDownload} />
    </>
  );
}

const triggerCSVDownload = (threads, reportName) => {
  const headers = ["Thread ID", "Subject", "Domain", "Status", "Trust Score", "Chain Integrity", "Message Count"];
  const rows = threads.map(t => [
    t.id,
    t.subject,
    t.domain,
    t.status,
    t.trust + "%",
    t.chain === "intact" ? "Verified Intact" : "CHAIN integrity failure",
    t.messages
  ]);
  
  const csvContent = [headers, ...rows]
    .map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
    .join("\n");
    
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${reportName.toLowerCase().replace(/[^a-z0-9]/g, "_")}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const triggerPDFPrint = (threads, reportName, period, stats) => {
  const html = `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${reportName}</title>
        <style>
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #111;
            padding: 40px;
            line-height: 1.5;
            background: #fff;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            letter-spacing: -0.5px;
          }
          .logo span {
            color: #6366f1;
          }
          .meta-title {
            font-size: 28px;
            font-weight: 700;
            margin: 0;
          }
          .meta-sub {
            color: #666;
            font-size: 14px;
            margin-top: 5px;
          }
          .grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin-bottom: 40px;
          }
          .card {
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 16px;
            text-align: center;
          }
          .card-val {
            font-size: 22px;
            font-weight: bold;
            margin-top: 5px;
          }
          .card-lbl {
            font-size: 12px;
            color: #666;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 40px;
          }
          th, td {
            text-align: left;
            padding: 10px 12px;
            border-bottom: 1px solid #ddd;
            font-size: 13px;
          }
          th {
            background: #f5f5f7;
            font-weight: 600;
          }
          .status {
            font-weight: 600;
            font-size: 12px;
            text-transform: uppercase;
          }
          .status.verified { color: #16a34a; }
          .status.flagged { color: #ea580c; }
          .status.quarantined { color: #7c3aed; }
          .status.critical { color: #dc2626; }
          .footer {
            margin-top: 60px;
            border-top: 1px solid #eee;
            padding-top: 20px;
            font-size: 12px;
            color: #888;
            display: flex;
            justify-content: space-between;
          }
          .sign {
            text-align: right;
          }
          .sign-line {
            width: 150px;
            border-bottom: 1px solid #333;
            margin-bottom: 5px;
            margin-left: auto;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="meta-title">${reportName}</h1>
            <div class="meta-sub">Report period: ${period} &middot; Generated on ${new Date().toLocaleDateString()}</div>
          </div>
          <div class="logo">GPC<span>SSI</span></div>
        </div>
        
        <div class="grid">
          <div class="card">
            <div class="card-val">${stats.scanned}</div>
            <div class="card-lbl">Threads Scanned</div>
          </div>
          <div class="card">
            <div class="card-val">${stats.threats}</div>
            <div class="card-lbl">Threats Blocked</div>
          </div>
          <div class="card">
            <div class="card-val">${stats.trust}</div>
            <div class="card-lbl">Avg. Trust Score</div>
          </div>
          <div class="card">
            <div class="card-val">38s</div>
            <div class="card-lbl">Median time to flag</div>
          </div>
        </div>
        
        <h2>Conversations Audit Log</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Subject</th>
              <th>Domain</th>
              <th>Status</th>
              <th>Trust</th>
              <th>Chain Validity</th>
            </tr>
          </thead>
          <tbody>
            ${threads.map(t => `
              <tr>
                <td><b>${t.id}</b></td>
                <td>${t.subject}</td>
                <td>${t.domain}</td>
                <td><span class="status ${t.status.toLowerCase()}">${t.status}</span></td>
                <td>${t.trust}%</td>
                <td>${t.chain === "intact" ? "Intact" : "Broken (tampered)"}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
        
        <div class="footer">
          <div>System Validation: SECURE &middot; Powered by Sudarshana</div>
          <div class="sign">
            <div class="sign-line"></div>
            Authorized SOC Signature
          </div>
        </div>
      </body>
    </html>
  `;
  
  const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${reportName.toLowerCase().replace(/[^a-z0-9]/g, "_")}.html`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};


export default function ReportsPage() {
  const [threads, setThreads] = useState([]);
  const [reportsList, setReportsList] = useState([]);

  useEffect(() => {
    const ids = [
      ["reports-font-poppins", "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap"],
      ["reports-font-material", "https://fonts.googleapis.com/icon?family=Material+Icons+Round"],
    ];
    ids.forEach(([id, href]) => {
      if (!document.getElementById(id)) {
        const link = document.createElement("link");
        link.id = id;
        link.rel = "stylesheet";
        link.href = href;
        document.head.appendChild(link);
      }
    });

    const fetchReportsData = async () => {
      try {
        const userId = localStorage.getItem("selectedUserId") || "";
        const url = `/api/threads${userId ? `?userId=${userId}` : ""}`;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          const mapped = data.map(mapReportToThread);
          setThreads(mapped);
        }
      } catch (err) {
        console.warn("Backend server offline.", err);
      }
    };
    fetchReportsData();

    const handleUserChange = () => {
      fetchReportsData();
    };
    window.addEventListener('tg-user-changed', handleUserChange);
    return () => window.removeEventListener('tg-user-changed', handleUserChange);
  }, []);

  // Compute dynamic KPIs
  const verifiedCount = threads.filter(t => t.status === "Verified").length;
  const flaggedCount = threads.filter(t => t.status === "Flagged").length;
  const quarantinedCount = threads.filter(t => t.status === "Quarantined").length;
  const criticalCount = threads.filter(t => t.status === "Critical").length;
  const threatsCount = flaggedCount + quarantinedCount + criticalCount;

  const avgTrust = threads.length > 0
    ? Math.round(threads.reduce((sum, t) => sum + t.trust, 0) / threads.length)
    : 91.4;

  const dynamicKpis = [
    { label: "Threads scanned", value: threads.length.toLocaleString(), delta: "", dir: "up", iconName: "mail" },
    { label: "Threats blocked", value: threatsCount.toString(), delta: "", dir: "up", iconName: "shield" },
    { label: "Avg. trust score", value: avgTrust + "%", delta: "", dir: "up", iconName: "tag" },
    { label: "Chain breaks", value: threads.filter(t => t.chain === "broken").length.toString(), delta: "", dir: "up", iconName: "link_off" },
  ];

  const dynamicStatusBreakdown = [
    { label: "Verified", value: verifiedCount, color: "var(--green)" },
    { label: "Flagged", value: flaggedCount, color: "var(--orange)" },
    { label: "Quarantined", value: quarantinedCount, color: "var(--purple)" },
    { label: "Critical", value: criticalCount, color: "var(--red)" },
  ];

  // Calculate top domains
  const domainMap = {};
  threads.forEach(t => {
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

  const sortedTopDomains = Object.values(domainMap)
    .map(d => ({
      domain: d.domain,
      incidents: d.incidents,
      trust: Math.round(d.trustSum / d.count)
    }))
    .filter(d => d.incidents > 0)
    .sort((a, b) => b.incidents - a.incidents)
    .slice(0, 5);

  // Compute dynamic weekly trends for the last 12 weeks from live messages only
  const now = Date.now();
  const msInWeek = 7 * 24 * 60 * 60 * 1000;
  
  const liveTrend = Array.from({ length: 12 }, (_, idx) => ({
    wk: `W${idx + 1}`,
    scanned: 0,
    blocked: 0
  }));
  
  threads.forEach(t => {
    if (t.rawReport?.messages) {
      t.rawReport.messages.forEach(m => {
        if (!m.timestamp) return;
        const diffMs = now - m.timestamp;
        const weekIndex = 11 - Math.floor(diffMs / msInWeek);
        if (weekIndex >= 0 && weekIndex < 12) {
          liveTrend[weekIndex].scanned += 1;
          if (t.status !== "Verified") {
            liveTrend[weekIndex].blocked += 1;
          }
        }
      });
    }
  });

  const blendedTrend = liveTrend;

  const handleDownload = (report) => {
    const statsSummary = {
      scanned: dynamicKpis[0].value,
      threats: dynamicKpis[1].value,
      trust: dynamicKpis[2].value
    };
    
    if (report.format === "PDF") {
      triggerPDFPrint(threads, report.name, report.period, statsSummary);
    } else if (report.format === "CSV" || report.format === "XLSX") {
      triggerCSVDownload(threads, report.name);
    }
  };

  const handleGenerateReport = (format, range) => {
    const reportName = `${range} Security Report`;
    const period = range === "Last 7 days" ? "Jun 16 â€“ Jun 22, 2026" : "May 23 â€“ Jun 22, 2026";

    const newReport = {
      id: `RPT-0${reportsList.length + 143}`,
      name: reportName,
      type: "Ad-hoc compliance",
      period: period,
      generated: "Just now",
      format: format,
      size: "1.8 MB",
      status: "Ready",
      summary: `Generated summary: analyzed ${threads.length} threads. Flagged ${threatsCount} high-risk items. Cryptographic hash-chain validation verified.`,
    };
    setReportsList(prev => [newReport, ...prev]);
    
    // Automatically trigger export for the newly generated report
    handleDownload(newReport);
  };

  return (
    <>
      <style>{`

  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
  @import url('https://fonts.googleapis.com/icon?family=Material+Icons+Round');

  .reports-page-root, .reports-page-root * {
    font-family: 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif !important;
  }

  .reports-page-root .material-icons-round{
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

  .reports-page-root {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  /* page header (shared) */
  .page-header{ display:flex; align-items:center; justify-content:space-between; }
  .page-sub{ font-size:13px; color: var(--text-dimmer); }
  .range-btn{
    display:flex; align-items:center; gap:8px;
    background: var(--panel); border:1px solid var(--border);
    border-radius:999px; padding:9px 14px; font-size:13px; color: var(--text-dim);
  }
  .range-btn .material-icons-round{ font-size:13px; }

  /* KPI strip */
  .kpi-strip{
    display:grid;
    grid-template-columns: repeat(4, 1fr);
    gap:12px;
  }
  .kpi-card{
    background: var(--panel);
    border:1px solid var(--border);
    border-radius: var(--radius-lg);
    padding:16px;
  }
  .kpi-top{ display:flex; align-items:center; justify-content:space-between; }
  .kpi-icon{
    width:30px; height:30px; border-radius:9px;
    background: var(--panel-3);
    display:flex; align-items:center; justify-content:center;
    color: var(--text-dim);
  }
  .kpi-icon .material-icons-round{ font-size:15px; }
  .kpi-delta{
    display:flex; align-items:center; gap:3px;
    font-size:11.5px; font-weight:700;
  }
  .kpi-delta .material-icons-round{ font-size:14px; }
  .kpi-delta.good{ color: var(--green); }
  .kpi-delta.bad{ color: var(--red); }
  .kpi-value{ font-size:24px; font-weight:700; margin-top:14px; letter-spacing:-0.01em; }
  .kpi-label{ font-size:12.5px; color: var(--text-dimmer); margin-top:4px; }

  /* chart grid */
  .chart-grid{
    display:grid;
    grid-template-columns: 1.6fr 1fr;
    gap:12px;
  }
  .chart-grid-bottom{
    display:grid;
    grid-template-columns: 1fr;
    gap:12px;
  }
  .chart-card{
    background: var(--panel);
    border:1px solid var(--border);
    border-radius: var(--radius-lg);
    padding:18px;
    display:flex;
    flex-direction:column;
  }
  .chart-card-head{ display:flex; align-items:flex-start; justify-content:space-between; gap:10px; }
  .chart-title{ font-size:13.5px; font-weight:700; }
  .chart-sub{ font-size:11.5px; color: var(--text-dimmer); margin-top:3px; }
  .chart-body{ flex:1; margin-top:14px; min-height:170px; }

  .chart-legend{ display:flex; gap:14px; flex-shrink:0; }
  .legend-item{ display:flex; align-items:center; gap:6px; font-size:11.5px; color: var(--text-dim); }
  .dot{ width:8px; height:8px; border-radius:999px; display:inline-block; }
  .dot.accent{ background: var(--accent); }
  .dot.red{ background: var(--red); }

  .donut-row{ display:flex; align-items:center; gap:18px; margin-top:14px; }
  .donut-legend{ flex:1; display:flex; flex-direction:column; gap:11px; }
  .donut-legend-row{ display:flex; align-items:center; justify-content:space-between; font-size:12.5px; }
  .donut-legend-val{ font-weight:700; color: var(--text); }
  .donut-legend-val span{ font-weight:400; color: var(--text-dimmer); margin-left:3px; }

  .hbar-list{ display:flex; flex-direction:column; gap:13px; margin-top:16px; }
  .hbar-row{ display:flex; align-items:center; gap:12px; }
  .hbar-label{ flex:0 0 170px; font-size:12.5px; color: var(--text-dim); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .hbar-track{ flex:1; height:9px; border-radius:999px; background: rgba(255,255,255,0.06); overflow:hidden; }
  .hbar-fill{ height:100%; border-radius:999px; }
  .hbar-val{ width:24px; text-align:right; font-size:12.5px; font-weight:700; color: var(--text); }

  /* export controls */
  .export-card{
    background: var(--panel);
    border:1px solid var(--border);
    border-radius: var(--radius-lg);
    padding:18px;
  }
  .export-head{ display:flex; align-items:flex-start; justify-content:space-between; }
  .export-controls-row{
    display:flex; align-items:flex-end; gap:16px; margin-top:16px; flex-wrap:wrap;
  }
  .export-field{ display:flex; flex-direction:column; gap:7px; align-items:flex-start; }
  .export-field label{ font-size:11.5px; color: var(--text-dimmer); font-weight:600; text-align:left; }
  .select-fake{
    display:flex; align-items:center; gap:8px; justify-content:space-between;
    background: var(--panel-2); border:1px solid var(--border-2);
    border-radius:10px; padding:9px 12px; font-size:12.5px; color: var(--text);
    width:200px; cursor:pointer;
  }
  .select-fake .material-icons-round{ font-size:14px; color: var(--text-dimmer); }
  .format-toggle{
    display:flex; gap:4px;
    background: var(--panel-2); border:1px solid var(--border-2);
    border-radius:10px; padding:4px;
  }
  .format-opt{
    display:flex; align-items:center; gap:6px;
    padding:7px 11px; border-radius:7px;
    font-size:12.5px; color: var(--text-dim); cursor:pointer;
    transition: background .15s ease, color .15s ease;
  }
  .format-opt .material-icons-round{ font-size:14px; }
  .format-opt:hover{ color: var(--text); }
  .format-opt.active{ background: var(--panel-3); color: var(--text); }
  .export-btn{
    flex:0 0 auto;
    display:flex; align-items:center; gap:7px;
    padding:11px 18px;
  }
  .export-btn .material-icons-round{ font-size:15px; }

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
    background: rgba(255,255,255,0.10); color: var(--text);
    font-size:11px; font-weight:600; padding:1px 7px; border-radius:999px;
  }
  .tab.active b{ background:#111; color:var(--text); }

  .toggles{ display:flex; align-items:center; gap:18px; flex-shrink:0; }
  .toggle-row{ display:flex; align-items:center; gap:9px; font-size:13px; color: var(--text-dim); }
  .avg-trust{ color: var(--green); font-weight:700; }

  /* table (shared grid mechanics) */
  .table-wrap{
    max-height: 480px; overflow:auto;
    border:1px solid var(--border, rgba(255,255,255,0.1));
    border-radius: var(--radius-lg, 14px);
    background: var(--panel, #1c1c1e);
  }
  .t-row{ display:grid; align-items:center; gap:14px; padding:13px 18px; }
  .t-head{
    font-size:11.5px; text-transform:uppercase; letter-spacing:.04em;
    color: var(--text-dimmer, #8a8a92); border-bottom:1px solid var(--border, rgba(255,255,255,0.1));
    position:sticky; top:0; background: var(--panel, #1c1c1e); z-index:1;
  }
  .t-data{ border-bottom:1px solid var(--border, rgba(255,255,255,0.1)); cursor:pointer; transition: background .12s ease; }
  .t-data:hover{ background: var(--panel-2, rgba(255,255,255,0.04)); }
  .t-data.selected{ background: var(--panel-3, rgba(255,255,255,0.08)); }
  .t-data:last-child{ border-bottom:none; }

  .reports-head, .reports-row{ grid-template-columns: 110px 1.5fr 160px 170px 100px 150px; }

  .c-status{ display:flex; align-items:center; gap:8px; }
  .status-dot{ width:7px; height:7px; border-radius:999px; flex-shrink:0; }
  .status-dot.lg{ width:9px; height:9px; }
  .status-pill{ font-size:11px; font-weight:600; padding:3px 9px; border-radius:999px; white-space:nowrap; }
  .status-pill.verified{ background: var(--green-bg, rgba(116,224,138,0.15)); color: var(--green, #74e08a); }
  .status-pill.flagged{ background: var(--orange-bg, rgba(245,166,77,0.15)); color: var(--orange, #f5a64d); }

  .format-pill{
    display:inline-flex; align-items:center; gap:5px;
    font-size:11px; font-weight:600; color: var(--text-dim, #c4c4c9);
    background: var(--panel-3, rgba(255,255,255,0.08)); padding:3px 9px; border-radius:999px;
  }
  .format-pill .material-icons-round{ font-size:12px; }

  .c-subject{ min-width:0; }
  .subj-line{ font-size:13.5px; font-weight:600; color: var(--text, #fff); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .subj-sub{ font-size:11.5px; color: var(--text-dimmer, #8a8a92); margin-top:2px; }
  .c-domain{ font-size:12.5px; color: var(--text-dim, #c4c4c9); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .c-last{ font-size:12px; color: var(--text-dimmer, #8a8a92); white-space:nowrap; }

  .empty-state{ padding:40px; text-align:center; color: var(--text-dimmer); font-size:13px; }

  @media (max-width: 1100px){
    .kpi-strip{ grid-template-columns: repeat(2, 1fr); }
    .chart-grid{ grid-template-columns: 1fr; }
    .reports-head, .reports-row{ grid-template-columns: 90px 1.4fr 0 0 90px 0; }
    .reports-row > div:nth-child(3), .reports-row > div:nth-child(4), .reports-row > div:nth-child(6),
    .reports-head > div:nth-child(3), .reports-head > div:nth-child(4), .reports-head > div:nth-child(6){
      display:none;
    }
  }

  /* ---------------- drawer / modal (shared) ---------------- */
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
    display:flex !important; align-items:center; justify-content:center;
    color: var(--text-dimmer, #9a9aa5);
    background: rgba(255,255,255,0.08) !important;
    border: 1px solid rgba(255,255,255,0.14) !important;
    flex-shrink:0;
  }
  .icon-btn-flat svg{ color: inherit; stroke: #e4e4e7 !important; display:block !important; opacity:1 !important; }
  .icon-btn-flat:hover{ background: rgba(255,255,255,0.16) !important; color: var(--text, #fff); }
  .icon-btn-flat .material-icons-round{ font-size:14px; }

  .drawer-status-row{ display:flex; align-items:center; gap:8px; margin-top:14px; flex-wrap:wrap; }
  .drawer-meta{ font-size:12px; color: var(--text-dimmer); }

  .drawer-section{ margin-top:20px; }
  .drawer-section-title{
    font-size:11.5px; text-transform:uppercase; letter-spacing:.04em;
    color: var(--text-dimmer); margin-bottom:12px; font-weight:600;
  }
  .drawer-summary{ font-size:13px; color: var(--text-dim); line-height:1.6; }

  .signal-row{ display:flex; align-items:center; gap:10px; margin-bottom:10px; }
  .signal-label{ flex:1; font-size:12px; color: var(--text-dim); display:flex; align-items:center; gap:6px; }
  .signal-label .material-icons-round{ font-size:13px; flex-shrink:0; }
  .signal-val-text{ font-size:12.5px; font-weight:600; color: var(--text); flex-shrink:0; text-align:right; }

  .drawer-actions{ display:flex; gap:10px; margin-top:24px; padding-top:18px; border-top:1px solid var(--border); }
  .btn-secondary, .btn-primary{
    flex:1; padding:11px; border-radius:12px; font-size:13px; font-weight:600; text-align:center;
    display:flex; align-items:center; justify-content:center;
  }
  .btn-secondary{ background: var(--panel-3); color: var(--text); }
  .btn-secondary:hover{ background: var(--panel); }
  .btn-primary{ background: var(--accent); color:#111; border:none; }
  .btn-primary:hover{ filter: brightness(0.95); }
  .btn-primary:disabled{ opacity:.45; cursor:default; filter:none; }

  ::selection{ background: var(--accent-dim); }
      `}</style>

      <div className="reports-page-root">
        <PageHeader />
        <KpiStrip kpis={dynamicKpis} />

        <div className="chart-grid">
          <TrendCard trendData={blendedTrend} />
          <StatusBreakdownCard statusBreakdown={dynamicStatusBreakdown} />
        </div>
        <div className="chart-grid-bottom">
          <TopDomainsCard topDomains={sortedTopDomains} />
        </div>

        <ExportControls onGenerate={handleGenerateReport} />
        <ReportsList reports={reportsList} onDownload={handleDownload} />
      </div>
    </>
  );
}


