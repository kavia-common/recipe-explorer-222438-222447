import React from 'react';
import { navigateTo } from '../../data/admin';

/**
 * PUBLIC_INTERFACE
 * AdminLayout renders Admin navigation tabs and wraps content.
 */
const AdminLayout = ({ active = 'dashboard', children }) => {
  const tab = (key, label) => (
    <button
      key={key}
      className="theme-toggle"
      onClick={() => navigateTo(`/admin/${key === 'dashboard' ? 'dashboard' : key}`)}
      aria-pressed={active === key}
      style={{
        padding: '8px 12px',
        background: active === key ? 'rgba(37,99,235,0.10)' : 'var(--ocean-surface)',
        borderColor: active === key ? 'color-mix(in oklab, var(--ocean-primary), var(--ocean-border))' : 'var(--ocean-border)'
      }}
    >
      {label}
    </button>
  );

  return (
    <div className="container">
      <div className="card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
          <div style={{ fontWeight: 800, fontSize: 18 }}>Admin</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {tab('dashboard', 'Dashboard')}
            {tab('recipes', 'Recipes')}
            {tab('approvals', 'Approvals')}
          </div>
        </div>
        <div>
          {children}
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
