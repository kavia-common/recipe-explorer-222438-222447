import React, { useEffect } from 'react';

/**
 * PUBLIC_INTERFACE
 * ConfirmDialog modal.
 * Props:
 * - open: boolean
 * - title: string
 * - message: string
 * - onCancel: () => void
 * - onConfirm: () => void
 */
const ConfirmDialog = ({ open, title = 'Confirm', message = 'Are you sure?', onCancel = () => {}, onConfirm = () => {} }) => {
  useEffect(() => {
    function onEsc(e) { if (e.key === 'Escape') onCancel(); }
    if (open) document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={title} onClick={onCancel}>
      <div className="modal" onClick={(e)=>e.stopPropagation()} style={{ maxWidth: 440 }}>
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button className="modal-close" onClick={onCancel} aria-label="Close">✕</button>
        </div>
        <div className="modal-body">
          <p style={{ marginBottom: 14 }}>{message}</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button className="theme-toggle" onClick={onCancel}>Cancel</button>
            <button className="theme-toggle" style={{ background: 'rgba(239,68,68,0.12)', borderColor: 'color-mix(in oklab, var(--ocean-error), var(--ocean-border))' }} onClick={onConfirm}>
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
