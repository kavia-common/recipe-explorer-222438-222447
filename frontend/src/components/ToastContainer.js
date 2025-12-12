import React, { useEffect, useState } from 'react';

// Simple in-app toast banner system. Listens to window 'app:toast' events.
// Ocean Professional styling with rounded corners and subtle shadows.

function Toast({ item, onClose }) {
  useEffect(() => {
    const t = setTimeout(() => onClose(item.id), 5000);
    return () => clearTimeout(t);
  }, [item.id, onClose]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="toast"
      style={{
        background: 'var(--ocean-surface)',
        color: 'var(--ocean-text)',
        border: '1px solid var(--ocean-border)',
        boxShadow: 'var(--ocean-shadow)',
        borderRadius: 12,
        padding: '10px 12px',
        minWidth: 260,
        maxWidth: 360,
        display: 'flex',
        gap: 10,
        alignItems: 'flex-start',
      }}
      onClick={() => {
        try { item.onClick?.(); } catch {}
      }}
    >
      <img
        alt=""
        src={item.icon || '/favicon.ico'}
        width={24}
        height={24}
        style={{ flex: '0 0 auto', borderRadius: 6 }}
      />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, color: 'var(--ocean-primary)' }}>
          {item.title}
        </div>
        {item.body && (
          <div style={{ fontSize: 13, color: 'var(--ocean-muted)' }}>{item.body}</div>
        )}
      </div>
      <button
        aria-label="Dismiss notification"
        className="theme-toggle"
        onClick={(e) => { e.stopPropagation(); onClose(item.id); }}
      >
        ×
      </button>
    </div>
  );
}

const genId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;

export default function ToastContainer() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const handler = (e) => {
      const detail = e.detail || {};
      setItems((prev) => [{ id: genId(), ...detail }, ...prev].slice(0, 5));
    };
    window.addEventListener('app:toast', handler);
    return () => window.removeEventListener('app:toast', handler);
  }, []);

  const onClose = (id) => setItems((prev) => prev.filter((t) => t.id !== id));

  if (!items.length) return null;

  return (
    <div
      aria-label="Notifications"
      style={{
        position: 'fixed',
        right: 16,
        bottom: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        zIndex: 1000,
      }}
    >
      {items.map((it) => <Toast key={it.id} item={it} onClose={onClose} />)}
    </div>
  );
}
