import React from 'react';
import AdminLayout from './AdminLayout';
import { approveRecipe, rejectRecipe } from '../../data/adminRecipes';

/**
 * PUBLIC_INTERFACE
 * Admin Approvals page for pending recipes.
 */
const Approvals = ({ recipes, onRecipesChange }) => {
  const pending = recipes.filter((r) => r.status === 'pending');

  const onApprove = (id) => {
    const next = approveRecipe(id);
    onRecipesChange(next);
  };
  const onReject = (id, title) => {
    const ok = window.confirm(`Reject "${title}"? This will remove it.`);
    if (!ok) return;
    const next = rejectRecipe(id);
    onRecipesChange(next);
  };

  return (
    <AdminLayout active="approvals">
      <div className="alert">Pending submissions require admin approval.</div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead>
            <tr>
              <th style={th}>Title</th>
              <th style={th}>Category</th>
              <th style={th}>Submitted By</th>
              <th style={th}>Created</th>
              <th style={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pending.map((r) => (
              <tr key={r.id} style={{ background: 'var(--ocean-surface)' }}>
                <td style={td}>{r.title}</td>
                <td style={td}>{r.category}</td>
                <td style={td}>{r.submittedBy || 'user'}</td>
                <td style={td}>{r.createdAt ? new Date(r.createdAt).toLocaleString() : '-'}</td>
                <td style={td}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button className="theme-toggle" onClick={() => onApprove(r.id)} style={{ background: 'rgba(37,99,235,0.10)' }}>Approve</button>
                    <button className="theme-toggle" onClick={() => onReject(r.id, r.title)} style={{ background: 'rgba(239,68,68,0.12)' }}>Reject</button>
                  </div>
                </td>
              </tr>
            ))}
            {pending.length === 0 && (
              <tr><td colSpan={5} style={{ ...td, color: 'var(--ocean-muted)' }}>No pending submissions</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
};

const th = {
  textAlign: 'left',
  padding: '10px 12px',
  borderBottom: '1px solid var(--ocean-border)',
  background: 'color-mix(in oklab, var(--ocean-surface) 96%, transparent)',
  position: 'sticky',
  top: 0,
};
const td = {
  padding: '10px 12px',
  borderBottom: '1px solid var(--ocean-border)',
};

export default Approvals;
