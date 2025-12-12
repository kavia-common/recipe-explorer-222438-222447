import React, { useEffect, useMemo, useState } from 'react';
import { listCollections, createCollection, getRecipeCollections, addRecipeToCollection, removeRecipeFromCollection } from '../data/collections';

/**
 * PUBLIC_INTERFACE
 * Modal to select collections for a recipe, supporting inline create.
 */
const CollectionSelectModal = ({ recipe, open, onClose }) => {
  const [collections, setCollections] = useState(() => listCollections());
  const [selected, setSelected] = useState(() => new Set());

  useEffect(() => {
    if (!open) return;
    setCollections(listCollections());
    const current = getRecipeCollections(recipe?.id || '').map((c) => String(c.id));
    setSelected(new Set(current));
  }, [open, recipe?.id]);

  useEffect(() => {
    function onEsc(e) { if (e.key === 'Escape') onClose(); }
    if (open) {
      document.addEventListener('keydown', onEsc);
      document.body.classList.add('body-lock');
    }
    return () => {
      document.removeEventListener('keydown', onEsc);
      document.body.classList.remove('body-lock');
    };
  }, [open, onClose]);

  if (!open) return null;

  const toggle = (id) => {
    const idKey = String(id);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(idKey)) next.delete(idKey); else next.add(idKey);
      return next;
    });
  };

  const onCreate = () => {
    const name = window.prompt('Collection name', 'New Collection');
    if (name == null) return;
    const desc = window.prompt('Description (optional)', '') || '';
    const model = createCollection(name, desc);
    setCollections(listCollections());
    setSelected((prev) => new Set(prev).add(String(model.id)));
  };

  const save = () => {
    const all = listCollections();
    const sel = selected;
    const rid = recipe?.id;
    // add/remove diffs
    all.forEach((c) => {
      const has = sel.has(String(c.id));
      const currentlyHas = getRecipeCollections(rid).some((x) => String(x.id) === String(c.id));
      if (has && !currentlyHas) addRecipeToCollection(c.id, rid);
      if (!has && currentlyHas) removeRecipeFromCollection(c.id, rid);
    });
    onClose();
  };

  const isChecked = (id) => selected.has(String(id));

  const title = `Add "${String(recipe?.title || 'recipe')}" to Collections`;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={title} onClick={onClose}>
      <div className="modal" onClick={(e)=>e.stopPropagation()} style={{ maxWidth: 460 }}>
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button className="modal-close" aria-label="Close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" role="document">
          {collections.length === 0 && <div className="alert">No collections yet. Create one below.</div>}
          <div className="card" style={{ padding: 10 }}>
            <ul className="list" aria-label="Select collections">
              {collections.map((c) => (
                <li key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={isChecked(c.id)}
                      onChange={() => toggle(c.id)}
                      aria-label={`Select ${c.name}`}
                    />
                    <span>{c.name}</span>
                  </label>
                  <span className="tag" title="Count">{c.count}</span>
                </li>
              ))}
            </ul>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 10 }}>
            <button className="theme-toggle" onClick={onCreate} style={{ background: 'rgba(37,99,235,0.10)' }}>
              + Create Collection
            </button>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="theme-toggle" onClick={onClose}>Cancel</button>
              <button className="theme-toggle" onClick={save} style={{ background: 'rgba(37,99,235,0.10)' }}>
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollectionSelectModal;
