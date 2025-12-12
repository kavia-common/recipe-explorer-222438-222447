import React, { useEffect, useMemo, useState } from 'react';
import {
  getNotificationSettings,
  saveNotificationSettings,
  requestBrowserPermission,
  getPermissionState,
  validateHHMM,
  notify,
} from '../data/notifications';

// Modal/panel for notifications settings.
// Props: { onClose?: () => void }
export default function NotificationSettings({ onClose = () => {} }) {
  const [state, setState] = useState(() => getNotificationSettings());
  const [perm, setPerm] = useState(getPermissionState());
  const [testStatus, setTestStatus] = useState('');

  useEffect(() => {
    setPerm(getPermissionState());
  }, []);

  const errors = useMemo(() => {
    const e = {};
    if (state?.dailySuggestion?.enabled && !validateHHMM(state.dailySuggestion.time)) {
      e.dailySuggestion = 'Time must be HH:MM (24h)';
    }
    if (state?.mealReminders?.enabled && !validateHHMM(state.mealReminders.time)) {
      e.mealReminders = 'Time must be HH:MM (24h)';
    }
    return e;
  }, [state]);

  const save = () => {
    saveNotificationSettings(state);
    onClose();
  };

  const onReqPerm = async () => {
    const p = await requestBrowserPermission();
    setPerm(p);
  };

  const onTest = () => {
    notify({
      title: 'Test notification',
      body: 'If permissions are granted, a system notification appears. Otherwise, this toast is shown.',
    });
    setTestStatus('Sent');
    setTimeout(() => setTestStatus(''), 2000);
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Notification Settings" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Notifications</div>
          <button className="modal-close" aria-label="Close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body" role="document">
          <div style={{ display: 'grid', gap: 16 }}>
            <section style={{ border: '1px solid var(--ocean-border)', padding: 12, borderRadius: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>Browser Permission</div>
                  <div style={{ fontSize: 12, color: 'var(--ocean-muted)' }}>
                    Current: {String(perm)}
                  </div>
                </div>
                <button className="theme-toggle" onClick={onReqPerm}>Request Permission</button>
              </div>
            </section>

            <section style={{ border: '1px solid var(--ocean-border)', padding: 12, borderRadius: 12 }}>
              <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={!!state.dailySuggestion?.enabled}
                  onChange={(e) => setState(s => ({ ...s, dailySuggestion: { ...s.dailySuggestion, enabled: e.target.checked } }))}
                />
                <span style={{ fontWeight: 600, color: 'var(--ocean-primary)' }}>Daily recipe suggestion</span>
              </label>
              <div style={{ marginTop: 8 }}>
                <label>
                  <span style={{ fontSize: 12, color: 'var(--ocean-muted)' }}>Time (HH:MM)</span>
                  <input
                    value={state.dailySuggestion?.time || '09:00'}
                    onChange={(e) => setState(s => ({ ...s, dailySuggestion: { ...s.dailySuggestion, time: e.target.value } }))}
                    style={{ display: 'block', padding: '8px 10px', border: '1px solid var(--ocean-border)', borderRadius: 8, width: 140 }}
                    aria-invalid={!!errors.dailySuggestion}
                  />
                </label>
                {errors.dailySuggestion && <div role="alert" style={{ color: 'var(--ocean-error)', fontSize: 12 }}>{errors.dailySuggestion}</div>}
              </div>
            </section>

            <section style={{ border: '1px solid var(--ocean-border)', padding: 12, borderRadius: 12 }}>
              <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={!!state.mealReminders?.enabled}
                  onChange={(e) => setState(s => ({ ...s, mealReminders: { ...s.mealReminders, enabled: e.target.checked } }))}
                />
                <span style={{ fontWeight: 600, color: 'var(--ocean-primary)' }}>Meal reminders</span>
              </label>
              <div style={{ marginTop: 8 }}>
                <label>
                  <span style={{ fontSize: 12, color: 'var(--ocean-muted)' }}>Reminder time (HH:MM)</span>
                  <input
                    value={state.mealReminders?.time || '18:00'}
                    onChange={(e) => setState(s => ({ ...s, mealReminders: { ...s.mealReminders, time: e.target.value } }))}
                    style={{ display: 'block', padding: '8px 10px', border: '1px solid var(--ocean-border)', borderRadius: 8, width: 140 }}
                    aria-invalid={!!errors.mealReminders}
                  />
                </label>
                {errors.mealReminders && <div role="alert" style={{ color: 'var(--ocean-error)', fontSize: 12 }}>{errors.mealReminders}</div>}
              </div>
              <div style={{ fontSize: 12, color: 'var(--ocean-muted)', marginTop: 4 }}>
                Sends once per day if you have planned meals for today.
              </div>
            </section>

            <section style={{ border: '1px solid var(--ocean-border)', padding: 12, borderRadius: 12 }}>
              <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={!!state.newRecipeAlerts?.enabled}
                  onChange={(e) => setState(s => ({ ...s, newRecipeAlerts: { ...s.newRecipeAlerts, enabled: e.target.checked } }))}
                />
                <span style={{ fontWeight: 600, color: 'var(--ocean-primary)' }}>New recipe added alerts</span>
              </label>
              <div style={{ fontSize: 12, color: 'var(--ocean-muted)', marginTop: 4 }}>
                Notifies when approved recipes are added.
              </div>
            </section>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="theme-toggle" onClick={onTest}>
                Test Notification {testStatus && <span aria-live="polite">({testStatus})</span>}
              </button>
              <button className="theme-toggle" onClick={save} style={{ background: 'rgba(37,99,235,0.10)' }}>
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
