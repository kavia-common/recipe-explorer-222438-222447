import React, { useState } from 'react';
import { getOrCreateCommunityUser, setCommunityDisplayName } from '../data/community';

// PUBLIC_INTERFACE
export default function SettingsPage() {
  /** Simple settings to manage community display name. */
  const current = getOrCreateCommunityUser();
  const [name, setName] = useState(current.displayName || '');
  const [saved, setSaved] = useState(false);

  const onSave = () => {
    setCommunityDisplayName(name);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <main className="container">
      <div className="card" style={{ padding: 16, maxWidth: 520 }}>
        <div className="section-title">Profile</div>
        <label htmlFor="display-name" style={{ fontWeight: 700, fontSize: 13 }}>Display Name</label>
        <input
          id="display-name"
          aria-label="Display Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name shown in comments"
          style={{ border: '1px solid var(--ocean-border)', background: 'var(--ocean-surface)', color: 'var(--ocean-text)', borderRadius: 10, padding: '10px 12px', marginTop: 6 }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
          <button className="theme-toggle" onClick={onSave} style={{ background: 'rgba(37,99,235,0.10)' }}>
            Save
          </button>
        </div>
        {saved && <div role="status" className="alert" style={{ marginTop: 8 }}>Saved</div>}
      </div>
    </main>
  );
}
