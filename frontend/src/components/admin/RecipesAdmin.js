import React, { useMemo, useState } from 'react';
import AdminLayout from './AdminLayout';
import RecipeForm from '../RecipeForm';
import ConfirmDialog from '../ConfirmDialog';
import RecipeDetailModal from '../RecipeDetailModal';
import { hardDeleteRecipe, adminUpsert } from '../../data/adminRecipes';

/**
 * PUBLIC_INTERFACE
 * Admin Recipes management page: list all recipes, view, edit, delete.
 */
const RecipesAdmin = ({ recipes, onRecipesChange }) => {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const [sortTimeAsc, setSortTimeAsc] = useState(true);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let base = recipes;
    if (q) {
      base = base.filter((r) => {
        const title = String(r.title || '').toLowerCase();
        const category = String(r.category || '').toLowerCase();
        return title.includes(q) || category.includes(q);
      });
    }
    // optional sort by cooking time
    const sorted = [...base].sort((a, b) => {
      const at = Number.isFinite(Number(a.cookingTime)) ? Number(a.cookingTime) : 0;
      const bt = Number.isFinite(Number(b.cookingTime)) ? Number(b.cookingTime) : 0;
      return sortTimeAsc ? at - bt : bt - at;
    });
    return sorted;
  }, [recipes, query, sortTimeAsc]);

  const onEdit = (r) => { setEditing(r); };
  const onDelete = (r) => { setToDelete(r); setConfirmOpen(true); };

  const save = (draft) => {
    const next = adminUpsert(draft);
    onRecipesChange(next);
    setEditing(null);
  };

  const confirmDelete = () => {
    if (!toDelete) return;
    const next = hardDeleteRecipe(toDelete.id);
    onRecipesChange(next);
    setConfirmOpen(false);
    setToDelete(null);
    if (selected && String(selected.id) === String(toDelete.id)) setSelected(null);
  };

  return (
    <AdminLayout active="recipes">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title or category"
          aria-label="Admin search"
          style={{
            border: '1px solid var(--ocean-border)',
            background: 'var(--ocean-surface)',
            color: 'var(--ocean-text)',
            borderRadius: 10,
            padding: '10px 12px',
            minWidth: 240,
            flex: 1
          }}
        />
        <button className="theme-toggle" onClick={() => setEditing({ category: 'Veg', status: 'approved' })} style={{ background: 'rgba(37,99,235,0.10)' }}>
          ➕ Add Recipe (Admin)
        </button>
      </div>

      <div style={{ marginTop: 12, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead>
            <tr>
              <th style={th}>Title</th>
              <th style={th}>Category</th>
              <th style={th}>
                <button className="theme-toggle" onClick={() => setSortTimeAsc((v)=>!v)} title="Sort by cooking time" style={{ padding: '4px 8px' }}>
                  Time {sortTimeAsc ? '▲' : '▼'}
                </button>
              </th>
              <th style={th}>Time Bucket</th>
              <th style={th}>Difficulty</th>
              <th style={th}>Avg Rating</th>
              <th style={th}>Reviews</th>
              <th style={th}>Likes</th>
              <th style={th}>Comments</th>
              <th style={th}>Calories</th>
              <th style={th}>Protein</th>
              <th style={th}>Diet</th>
              <th style={th}>Status</th>
              <th style={th}>Source</th>
              <th style={th}>Created</th>
              <th style={th}>Updated</th>
              <th style={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} style={{ background: 'var(--ocean-surface)' }}>
                <td style={td}><button onClick={() => setSelected(r)} className="theme-toggle" style={{ padding: '4px 8px' }}>{r.title}</button></td>
                <td style={td}>{r.category}</td>
                <td style={td}>{Number.isFinite(Number(r.cookingTime)) ? `${Number(r.cookingTime)}m` : '-'}</td>
                <td style={td}>
                  {(() => {
                    const ct = Number.isFinite(Number(r.cookingTime)) && Number(r.cookingTime) >= 0 ? Number(r.cookingTime) : 30;
                    if (ct < 10) return '<10';
                    if (ct < 30) return '<30';
                    if (ct >= 60) return '60+';
                    return '30+';
                  })()}
                </td>
                <td style={td}>{r.difficulty || 'Medium'}</td>
                <td style={td}>{Number(r.averageRating || 0).toFixed(1)}</td>
                <td style={td}>{Number(r.reviewCount || 0)}</td>
                <td style={td}>{require('../../data/community').getLikeCount(r.id)}</td>
                <td style={td}>{require('../../data/community').getCommentsForRecipe(r.id).length}</td>
                <td style={td}>{Number.isFinite(Number(r.calories)) ? Number(r.calories) : '-'}</td>
                <td style={td}>{Number.isFinite(Number(r.protein)) ? `${Number(r.protein)}g` : '-'}</td>
                <td style={td}>{Array.isArray(r.dietTags) && r.dietTags.length ? r.dietTags.join(', ') : '-'}</td>
                <td style={td}><StatusBadge status={r.status} /></td>
                <td style={td}>{r.source || 'user'}</td>
                <td style={td}>{r.createdAt ? new Date(r.createdAt).toLocaleString() : '-'}</td>
                <td style={td}>{r.updatedAt ? new Date(r.updatedAt).toLocaleString() : '-'}</td>
                <td style={td}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button className="theme-toggle" onClick={() => setSelected(r)}>View</button>
                    <button className="theme-toggle" onClick={() => onEdit(r)}>Edit</button>
                    <button className="theme-toggle" onClick={() => onDelete(r)} style={{ background: 'rgba(239,68,68,0.12)' }}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} style={{ ...td, color: 'var(--ocean-muted)' }}>No recipes found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* View */}
      <RecipeDetailModal recipe={selected} onClose={() => setSelected(null)} />

      {/* Edit/Add with Admin fields */}
      {editing && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Edit Recipe" onClick={() => setEditing(null)}>
          <div className="modal" onClick={(e)=>e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{editing?.id ? 'Edit' : 'Add'} Recipe (Admin)</div>
              <button className="modal-close" aria-label="Close" onClick={() => setEditing(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="alert" style={{ marginBottom: 12 }}>
                Admin can set status: 
                <select
                  aria-label="Status select"
                  value={editing.status || 'approved'}
                  onChange={(e)=> setEditing(prev => ({ ...prev, status: e.target.value }))}
                  style={{ marginLeft: 8, border: '1px solid var(--ocean-border)', background: 'var(--ocean-surface)', color: 'var(--ocean-text)', borderRadius: 6, padding: '6px 8px' }}
                >
                  <option value="approved">approved</option>
                  <option value="pending">pending</option>
                </select>
              </div>
              <RecipeForm
                initial={editing}
                onCancel={() => setEditing(null)}
                onSave={(draft) => save({ ...editing, ...draft })}
              />
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Delete Recipe"
        message={toDelete ? `Are you sure you want to delete "${toDelete.title}"?` : 'Are you sure you want to delete this recipe?'}
        onCancel={() => { setConfirmOpen(false); setToDelete(null); }}
        onConfirm={confirmDelete}
      />
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

const StatusBadge = ({ status }) => {
  const st = String(status || 'approved');
  const map = {
    approved: { bg: 'rgba(37,99,235,0.10)', border: 'color-mix(in oklab, var(--ocean-primary), var(--ocean-border))' },
    pending: { bg: 'rgba(245,158,11,0.12)', border: 'color-mix(in oklab, var(--ocean-secondary), var(--ocean-border))' },
    rejected: { bg: 'rgba(239,68,68,0.12)', border: 'color-mix(in oklab, var(--ocean-error), var(--ocean-border))' },
  };
  const s = map[st] || map.approved;
  return (
    <span className="tag" style={{ background: s.bg, borderColor: s.border }}>{st}</span>
  );
};

export default RecipesAdmin;
