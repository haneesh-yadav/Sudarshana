import React, { useState, useEffect, useCallback } from 'react';

const TYPE_STYLES = {
  info:    { bg: 'rgba(96,165,250,0.12)',  border: 'rgba(96,165,250,0.35)',  icon: 'info',           color: '#60a5fa' },
  success: { bg: 'rgba(116,224,138,0.12)', border: 'rgba(116,224,138,0.35)', icon: 'check_circle',   color: '#74e08a' },
  error:   { bg: 'rgba(239,106,95,0.12)',  border: 'rgba(239,106,95,0.35)',  icon: 'error',          color: '#ef6a5f' },
  warning: { bg: 'rgba(245,166,77,0.12)',  border: 'rgba(245,166,77,0.35)',  icon: 'warning',        color: '#f5a64d' },
};

let nextId = 0;

export default function Toast() {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  useEffect(() => {
    const handler = (e) => {
      const { message, type = 'info' } = e.detail;
      const id = ++nextId;
      setToasts(prev => [...prev, { id, message, type }]);
      setTimeout(() => remove(id), 4000);
    };
    window.addEventListener('tg-toast', handler);
    return () => window.removeEventListener('tg-toast', handler);
  }, [remove]);

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: 99999,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      pointerEvents: 'none',
    }}>
      {toasts.map(t => {
        const s = TYPE_STYLES[t.type] || TYPE_STYLES.info;
        return (
          <div key={t.id} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 16px',
            borderRadius: '10px',
            background: 'var(--panel, #1a1a1a)',
            border: `1px solid ${s.border}`,
            boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
            maxWidth: '360px',
            pointerEvents: 'auto',
            animation: 'tg-toast-in 0.2s ease',
            fontFamily: "'Poppins', sans-serif",
          }}>
            <span className="material-icons-round" style={{ fontSize: 18, color: s.color, flexShrink: 0 }}>
              {s.icon}
            </span>
            <span style={{ fontSize: '13px', color: 'var(--text-primary, #e4e4e7)', lineHeight: 1.4, flex: 1 }}>
              {t.message}
            </span>
            <button
              onClick={() => remove(t.id)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
                color: 'rgba(255,255,255,0.35)',
                flexShrink: 0,
              }}
              aria-label="Dismiss"
            >
              <span className="material-icons-round" style={{ fontSize: 14 }}>close</span>
            </button>
          </div>
        );
      })}
      <style>{`
        @keyframes tg-toast-in {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
