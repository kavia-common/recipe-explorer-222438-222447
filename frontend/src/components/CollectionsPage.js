import React, { useEffect, useMemo, useState } from 'react';
import { listCollections, createCollection, renameCollection, deleteCollection, getCollectionRecipes, removeRecipeFromCollection } from '../data/collections';
import { getApprovedRecipes } from '../data/adminRecipes';
import RecipeGrid from './RecipeGrid';
import ConfirmDialog from './ConfirmDialog';

/**
 * PUBLIC_INTERFACE
 * CollectionsPage renders a two-pane UI to manage recipe collections and view their recipes.
 */
const CollectionsPage = ({ allRecipes = [] }) => {
  const [collections, setCollections] = useState(() => listCollections());
  const [selectedId, setSelectedId] = useState(() => {
    if (collections && collections.length > 0) return collections[0].id;
    return null;
  });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  // refresh on storage changes from other tabs
  useEffect(() => {
    const onStorage = (e) => {
      if (!e.key) return;
      if (e.key === 'app_collections' || e.key === 'app_collection_members') {
        setCollections(listCollections());
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // derive selected
  useEffect(() => {
    if (!selectedId && collections.length > 0) {
      setSelectedId(collections[0].id);
      return;
    }
    if (selectedId && !collections.some((c) => String(c.id) === String(selectedId))) {
      if (collections.length > 0) {
        setSelectedId(collections[0].id);
      } else {
        setSelectedId(null);
      }
    }
  }, [collections, selectedId]);

  const approved = useMemo(() => getApprovedRecipes(allRecipes), [allRecipes]);

  const selectedRecipes = useMemo(() => {
    if (selectedId == null) return [];
    const recIds = getCollectionRecipes(selectedId) || [];
    const ids = new Set(recIds.map((x) => String(x)));
    return approved.filter((r) => ids.has(String(r.id)));
  }, [selectedId, approved, collections]);

  const onCreate = async () => {
    const name = window.prompt('Collection name', 'New Collection');
    if (name == null) return;
    const desc = window.prompt('Description (optional)', '') || '';
    const model = createCollection(name, desc);
    setCollections(listCollections());
    setSelectedId(model.id);
  };

  const onCreateStarter = (name) => {
    const model = createCollection(name, '');
    setCollections(listCollections());
    setSelectedId(model.id);
  };

  const onRename = () => {
    if (!selectedId) return;
    const current = collections.find(c => String(c.id) === String(selectedId));
    const currName = current && current.name ? current.name : '';
    const name = window.prompt('Rename collection', currName || '');
    if (name == null) return;
    const currDesc = current && typeof current.description === 'string' ? current.description : '';
    const inputDesc = window.prompt('Update description (optional)', currDesc || '');
    const desc = (inputDesc != null ? inputDesc : currDesc) || '';
    renameCollection(selectedId, name, desc);
    setCollections(listCollections());
  };

  const askDelete = () => {
    const current = collections.find(c => String(c.id) === String(selectedId));
    if (!current) return;
    setToDelete(current);
    setConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (!toDelete) return;
    deleteCollection(toDelete.id);
    setCollections(listCollections());
    setConfirmOpen(false);
    setToDelete(null);
  };

  const removeFromSelected = (rid) => {
    if (!selectedId) return;
    removeRecipeFromCollection(selectedId, rid);
    setCollections(listCollections());
  };

  const STARTERS = ['Party Recipes', 'Quick Snacks', 'Kids Lunch Box', 'Festival Specials'];

  return (
    <div className="container">
      <div className="card" style={{ padding: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ fontWeight: 800, fontSize: 18 }}>Collections</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="theme-toggle" onClick={onCreate} title="Create collection" style={{ background: 'rgba(37,99,235,0.10)' }}>
              + Create
            </button>
            <button className="theme-toggle" onClick={onRename} disabled={!selectedId} title="Rename collection">
              Rename
            </button>
            <button className="theme-toggle" onClick={askDelete} disabled={!selectedId}
              style={{ background: 'rgba(239,68,68,0.12)', borderColor: 'color-mix(in oklab, var(--ocean-error), var(--ocean-border))' }}>
              Delete
            </button>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 12, marginTop: 12 }}>
          <aside className="card" style={{ padding: 10 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Your Collections</div>
            <ul className="list" role="listbox" aria-label="Collections">
              {collections.length === 0 && (
                <li style={{ color: 'var(--ocean-muted)' }}>No collections yet.</li>
              )}
              {collections.map((c) => {
                const active = String(c.id) === String(selectedId);
                return (
                  <li key={c.id}>
                    <button
                      className="theme-toggle"
                      aria-pressed={active}
                      onClick={() => setSelectedId(c.id)}
                      style={{
                        width: '100%',
                        justifyContent: 'space-between',
                        background: active ? 'rgba(37,99,235,0.10)' : 'var(--ocean-surface)',
                        borderColor: active ? 'color-mix(in oklab, var(--ocean-primary), var(--ocean-border))' : 'var(--ocean-border)'
                      }}
                    >
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</span>
                      <span className="tag" title="Recipes count" style={{ marginLeft: 8 }}>{c.count}</span>
                    </button>
                  </li>
                );
              })}
            </ul>

            {collections.length === 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Starter templates</div>
                <div style={{ display: 'grid', gap: 6 }}>
                  {STARTERS.map((n) => (
                    <button key={n} className="theme-toggle" onClick={() => onCreateStarter(n)}>{n}</button>
                  ))}
                </div>
              </div>
            )}
          </aside>

          <section>
            {(selectedId == null) && (
              <div className="alert">Select a collection to view recipes.</div>
            )}
            {selectedId && (
              <>
                <div className="alert" role="status" style={{ marginBottom: 10 }}>
                  Showing recipes in this collection (ignoring other filters).
                </div>
                {(Array.isArray(selectedRecipes) && selectedRecipes.length === 0) ? (
                  <div className="card" style={{ padding: 20 }}>
                    <div style={{ fontWeight: 800, marginBottom: 6 }}>No recipes yet</div>
                    <div style={{ color: 'var(--ocean-muted)' }}>
                      Use "Add to Collection" on recipe cards or details to add recipes here.
                    </div>
                  </div>
                ) : (
                  <RecipeGrid
                    items={selectedRecipes}
                    onSelect={() => {}}
                    isFavorite={() => false}
                    onToggleFavorite={() => {}}
                    onEdit={() => {}}
                    onDelete={() => {}}
                  />
                )}
                {(Array.isArray(selectedRecipes) && selectedRecipes.length > 0) && (
                  <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {selectedRecipes.map((r) => (
                      <button key={r.id}
                        className="theme-toggle"
                        title={`Remove ${r.title} from this collection`}
                        onClick={() => removeFromSelected(r.id)}
                        style={{ background: 'rgba(239,68,68,0.12)', borderColor: 'color-mix(in oklab, var(--ocean-error), var(--ocean-border))' }}>
                        Remove {r.title}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete Collection"
        message={toDelete ? `Are you sure you want to delete "${(toDelete && toDelete.name) ? toDelete.name : ''}"?` : 'Are you sure you want to delete this collection?'}
        onCancel={() => { setConfirmOpen(false); setToDelete(null); }}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default CollectionsPage;
