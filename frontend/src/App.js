import React, { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import './index.css';
import { fetchRecipes } from './data/api';
import { mockRecipes } from './data/mock';
import RecipeGrid from './components/RecipeGrid';
import RecipeDetailModal from './components/RecipeDetailModal';
import Header from './components/Header';
import { getFavoriteIds, toggleFavorite } from './data/favorites';
import RecipeForm from './components/RecipeForm';
import ConfirmDialog from './components/ConfirmDialog';
import { mergeWithLocal, upsertLocalRecipe, deleteLocalRecipe, genId } from './data/recipes';
import { getRatingSummary } from './data/reviews';
import { getCurrentRoute, navigateTo, getLastRoute } from './data/admin';
import { RECIPE_STATUS, RECIPE_SOURCE, normalizeAdminFields, getApprovedRecipes as filterApproved } from './data/adminRecipes';
import AdminLayout from './components/admin/AdminLayout';
import Dashboard from './components/admin/Dashboard';
import RecipesAdmin from './components/admin/RecipesAdmin';
import Approvals from './components/admin/Approvals';

const CATEGORY_LS_KEY = 'recipeExplorer:selectedCategory:v1';
const DIFFICULTY_LS_KEY = 'recipeExplorer:selectedDifficulty:v1';
const CATEGORY_OPTIONS = ['All', 'Veg', 'Non-Veg', 'Desserts', 'Drinks'];
const DIFFICULTY_OPTIONS = ['All', 'Easy', 'Medium', 'Hard'];

/**
 * Root Recipe Explorer application with Ocean Professional theme.
 * - Header: logo/title + search + favorites filter + category filter
 * - Content: recipe grid with favorite hearts
 * - Detail: modal view for selected recipe with heart
 */
function App() {
  const [theme, setTheme] = useState('light');
  const [recipes, setRecipes] = useState([]);
  const [route, setRoute] = useState(getCurrentRoute() || getLastRoute() || '/');
  const [query, setQuery] = useState('');
  // Keep a debounced value to avoid excessive re-renders when typing
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const debounceTimerRef = useRef(null);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [favoriteIds, setFavoriteIdsState] = useState(() => getFavoriteIds());
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [category, setCategory] = useState(() => {
    try {
      return window.localStorage.getItem(CATEGORY_LS_KEY) || 'All';
    } catch {
      return 'All';
    }
  });
  const [difficulty, setDifficulty] = useState(() => {
    try {
      return window.localStorage.getItem(DIFFICULTY_LS_KEY) || 'All';
    } catch {
      return 'All';
    }
  });

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Persist selected category
  useEffect(() => {
    try {
      window.localStorage.setItem(CATEGORY_LS_KEY, category);
    } catch {
      // ignore storage errors
    }
  }, [category]);

  // Persist selected difficulty
  useEffect(() => {
    try {
      window.localStorage.setItem(DIFFICULTY_LS_KEY, difficulty);
    } catch {
      // ignore
    }
  }, [difficulty]);

  // Debounce search query updates (200ms)
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedQuery(query);
    }, 200);
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [query]);

  // Load recipes from API if configured; otherwise fallback to mock
  useEffect(() => {
    let cancelled = false;
    const normalizeCategory = (rec) => {
      // If API lacks category, default to 'Veg' for vegetarian-like tags else 'Veg' as a safe default.
      const cat = rec.category;
      if (typeof cat === 'string' && cat.trim()) return cat;
      const tags = (rec.tags || []).map((t) => String(t).toLowerCase());
      if (tags.some(t => ['dessert', 'desserts', 'sweet', 'parfait', 'cake'].includes(t))) return 'Desserts';
      if (tags.some(t => ['drink', 'drinks', 'juice', 'beverage', 'smoothie'].includes(t))) return 'Drinks';
      if (tags.some(t => ['chicken', 'beef', 'pork', 'seafood', 'shrimp', 'fish'].includes(t))) return 'Non-Veg';
      if (tags.some(t => ['veg', 'vegetarian', 'vegan', 'tofu', 'salad'].includes(t))) return 'Veg';
      return 'Veg';
    };

    const load = async () => {
      setLoading(true);
      setErr('');
      try {
        const apiBaseEnv = process.env.REACT_APP_API_BASE || process.env.REACT_APP_BACKEND_URL || '';
        let data = [];
        if (apiBaseEnv) {
          // Try API; if it fails for network or response reasons, fall back to mock and show a mild notice.
          try {
            data = await fetchRecipes(apiBaseEnv);
          } catch (apiErr) {
            // Only show an alert if a usable API base was provided but the call failed.
            // If base is invalid, message is still a gentle info and we continue with mock.
            data = mockRecipes;
            if (!cancelled) {
              setErr('Failed to load from API. Showing offline data.');
            }
          }
        } else {
          // No API configured -> use mock quietly (no warning)
          data = mockRecipes;
        }

        if (!cancelled) {
          const arr = Array.isArray(data) ? data : [];
          // ensure category and ingredients fields exist/normalized
          const merged = mergeWithLocal(arr);
          const normalized = merged.map((r) => {
            // Normalize ingredients: allow string or array, store as array of strings for UI, and a joined string for searching
            const ingRaw = r.ingredients;
            let ingredientsArray = [];
            if (Array.isArray(ingRaw)) {
              ingredientsArray = ingRaw.map((x) => String(x));
            } else if (typeof ingRaw === 'string') {
              // Split on commas as a simple heuristic, fallback to full string if no comma present
              const parts = ingRaw.includes(',') ? ingRaw.split(',') : [ingRaw];
              ingredientsArray = parts.map((p) => p.trim()).filter(Boolean);
            } else if (ingRaw && typeof ingRaw === 'object') {
              // If some APIs send { items: [...] }
              if (Array.isArray(ingRaw.items)) {
                ingredientsArray = ingRaw.items.map((x) => String(x));
              }
            }
            const ingredientsText = ingredientsArray.join(' ');
            const base = {
              ...r,
              category: normalizeCategory(r),
              ingredients: ingredientsArray,
              // new fields with defaults for backward compatibility
              cookingTime: Number.isFinite(Number(r.cookingTime)) && Number(r.cookingTime) >= 0 ? Number(r.cookingTime) : 0,
              difficulty: ['Easy','Medium','Hard'].includes(r.difficulty) ? r.difficulty : 'Medium',
            };
            const withAdmin = normalizeAdminFields(
              // mock defaults: source mock; approved
              base,
              { defaultStatus: RECIPE_STATUS.APPROVED, source: RECIPE_SOURCE.MOCK, submittedBy: 'mock' }
            );
            const rating = getRatingSummary(withAdmin.id);
            return {
              ...withAdmin,
              averageRating: rating.averageRating,
              reviewCount: rating.reviewCount,
              _ingredientsText: ingredientsText.toLowerCase(), // cached lowercased text for search
              _titleText: String(withAdmin.title || '').toLowerCase(),
              _descText: String(withAdmin.description || '').toLowerCase(),
              _tagsText: (withAdmin.tags || []).map((t) => String(t)).join(' ').toLowerCase(),
              _categoryText: String(withAdmin.category || '').toLowerCase(),
              _difficultyText: String(withAdmin.difficulty || 'Medium').toLowerCase(),
            };
          });
          // If after merge there are no approved recipes, seed by ensuring at least two are approved
          const approved = filterApproved(normalized);
          if (approved.length === 0 && normalized.length > 0) {
            const toApproveIds = normalized.slice(0, Math.min(2, normalized.length)).map(r => r.id);
            const seeded = normalized.map(r => toApproveIds.includes(r.id) ? { ...r, status: 'approved' } : r);
            try {
              // persist to local storage so refresh keeps them approved
              const { setLocalRecipes } = require('./data/recipes');
              setLocalRecipes(seeded);
            } catch {}
            setRecipes(seeded);
          } else {
            setRecipes(normalized);
          }
        }
      } catch {
        // Any unexpected error -> fallback to mock silently; keep UI responsive
        if (!cancelled) {
          const merged = mergeWithLocal(mockRecipes);
          const normalized = merged.map((r) => {
            const ingRaw = r.ingredients;
            let ingredientsArray = [];
            if (Array.isArray(ingRaw)) {
              ingredientsArray = ingRaw.map((x) => String(x));
            } else if (typeof ingRaw === 'string') {
              const parts = ingRaw.includes(',') ? ingRaw.split(',') : [ingRaw];
              ingredientsArray = parts.map((p) => p.trim()).filter(Boolean);
            }
            const ingredientsText = ingredientsArray.join(' ');
            const cat = r.category || 'Veg';
            const withAdmin = normalizeAdminFields(
              { 
                ...r, 
                category: cat, 
                ingredients: ingredientsArray,
                cookingTime: Number.isFinite(Number(r.cookingTime)) && Number(r.cookingTime) >= 0 ? Number(r.cookingTime) : 0,
                difficulty: ['Easy','Medium','Hard'].includes(r.difficulty) ? r.difficulty : 'Medium',
              },
              { defaultStatus: RECIPE_STATUS.APPROVED, source: RECIPE_SOURCE.MOCK, submittedBy: 'mock' }
            );
            const rating = getRatingSummary(withAdmin.id);
            return {
              ...withAdmin,
              averageRating: rating.averageRating,
              reviewCount: rating.reviewCount,
              _ingredientsText: ingredientsText.toLowerCase(),
              _titleText: String(withAdmin.title || '').toLowerCase(),
              _descText: String(withAdmin.description || '').toLowerCase(),
              _tagsText: (withAdmin.tags || []).map((t) => String(t)).join(' ').toLowerCase(),
              _categoryText: String(cat).toLowerCase(),
              _difficultyText: String(withAdmin.difficulty || 'Medium').toLowerCase(),
            };
          });
          setRecipes(normalized);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Router: listen for hash changes
  useEffect(() => {
    const onHash = () => {
      const r = getCurrentRoute() || '/';
      setRoute(r);
    };
    window.addEventListener('hashchange', onHash);
    // initial correction to root if no hash
    if (!window.location.hash) {
      navigateTo('/');
    }
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // Keep favorites state in sync if storage changes (multi-tab)
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key && e.key.startsWith('favoriteRecipeIds')) {
        setFavoriteIdsState(getFavoriteIds());
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const filtered = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    // For main feed, only approved recipes should be visible
    let base = filterApproved(recipes);

    // Favorites filter
    if (showOnlyFavorites) {
      const favSet = new Set(favoriteIds);
      base = base.filter((r) => favSet.has(r.id));
    }

    // Category filter
    if (category && category !== 'All') {
      base = base.filter((r) => {
        const rc = (r.category || '').toString();
        return rc.toLowerCase() === category.toLowerCase();
      });
    }

    // Difficulty filter (optional header control)
    if (difficulty && difficulty !== 'All') {
      const d = difficulty.toLowerCase();
      base = base.filter((r) => (r._difficultyText || String(r.difficulty || 'Medium').toLowerCase()) === d);
    }

    // Search filter (combined: title/name and ingredients; also include tags/desc as before)
    if (!q) return base;
    return base.filter((r) => {
      // Prefer precomputed lowercased fields when present
      const titleMatch = (r._titleText ?? String(r.title || '').toLowerCase()).includes(q);
      const ingredientsMatch = (r._ingredientsText ??
        (Array.isArray(r.ingredients) ? r.ingredients.join(' ').toLowerCase() : String(r.ingredients || '').toLowerCase())
      ).includes(q);
      const tagsMatch = (r._tagsText ?? (r.tags || []).map((t) => String(t)).join(' ').toLowerCase()).includes(q);
      const descMatch = (r._descText ?? String(r.description || '').toLowerCase()).includes(q);
      // Combined match: name/title OR ingredients (and we keep tags/desc for broader search like before)
      return titleMatch || ingredientsMatch || tagsMatch || descMatch;
    });
  }, [recipes, debouncedQuery, favoriteIds, showOnlyFavorites, category, difficulty]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));

  // PUBLIC_INTERFACE
  const onToggleFavorite = (id) => {
    const next = toggleFavorite(id);
    setFavoriteIdsState(next);
  };

  // PUBLIC_INTERFACE
  const isFav = (id) => favoriteIds.includes(id);

  const openAdd = () => {
    setEditing(null);
    setShowForm(true);
  };

  // Allow external trigger (from RecipeGrid empty CTA) to open Add Recipe
  useEffect(() => {
    const handler = () => openAdd();
    window.addEventListener('openAddRecipe', handler);
    return () => window.removeEventListener('openAddRecipe', handler);
  }, []);

  const openEditFromCard = (recipe) => {
    setEditing(recipe);
    setShowForm(true);
  };

  const openEditFromModal = (recipe) => {
    setEditing(recipe);
    setShowForm(true);
  };

  const openDelete = (recipe) => {
    setToDelete(recipe);
    setConfirmOpen(true);
  };

  const normalizeForSearch = (r) => {
    const ing = Array.isArray(r.ingredients) ? r.ingredients : [];
    const cat = r.category || 'Veg';
    const difficulty = ['Easy','Medium','Hard'].includes(r.difficulty) ? r.difficulty : 'Medium';
    const cookingTime = Number.isFinite(Number(r.cookingTime)) && Number(r.cookingTime) >= 0 ? Number(r.cookingTime) : 0;
    return {
      ...r,
      category: cat,
      difficulty,
      cookingTime,
      _ingredientsText: ing.join(' ').toLowerCase(),
      _titleText: String(r.title || '').toLowerCase(),
      _descText: String(r.description || '').toLowerCase(),
      _tagsText: (r.tags || []).map((t) => String(t)).join(' ').toLowerCase(),
      _categoryText: String(cat).toLowerCase(),
      _difficultyText: difficulty.toLowerCase(),
    };
  };

  const saveRecipe = (draft) => {
    const now = new Date().toISOString();
    let toSave = { ...draft };
    if (!toSave.id) {
      toSave.id = genId();
      toSave.createdAt = now;
    } else {
      // preserve createdAt if exists
      toSave.createdAt = draft.createdAt || now;
    }
    toSave.updatedAt = now;
    if (!toSave.category) toSave.category = 'Veg';

    // Assign admin fields:
    // If called from main UI (not Admin editor), create as pending by default.
    if (!toSave.status) {
      // infer admin mode by presence of explicit status on draft
      toSave.status = RECIPE_STATUS.PENDING;
    }
    if (!toSave.source) toSave.source = RECIPE_SOURCE.USER;
    if (!toSave.submittedBy) toSave.submittedBy = 'user';

    // Persist to localStorage first
    upsertLocalRecipe(toSave);

    // Update in-memory list (preserve favorites by id)
    setRecipes((prev) => {
      const idKey = String(toSave.id);
      const idx = prev.findIndex((r) => String(r.id) === idKey);
      const normalized = normalizeForSearch(toSave);
      const rs = getRatingSummary(toSave.id);
      normalized.averageRating = rs.averageRating;
      normalized.reviewCount = rs.reviewCount;
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = normalized;
        return next;
      }
      const rs2 = getRatingSummary(toSave.id);
      return [{ ...normalized, averageRating: rs2.averageRating, reviewCount: rs2.reviewCount }, ...prev];
    });

    setShowForm(false);
    setEditing(null);
  };

  const confirmDelete = () => {
    if (!toDelete) return;
    const idKey = String(toDelete.id);

    // Remove from local storage
    deleteLocalRecipe(idKey);
    try {
      const { purgeReviewsForRecipe } = require('./data/reviews');
      purgeReviewsForRecipe(idKey);
    } catch {}

    // Remove in memory and clean favorite if set
    setRecipes((prev) => prev.filter((r) => String(r.id) !== idKey));
    if (favoriteIds.includes(toDelete.id)) {
      // remove from favorites and persist
      const nextFavs = favoriteIds.filter((fid) => String(fid) !== idKey);
      try {
        window.localStorage.setItem('favoriteRecipeIds:v1', JSON.stringify(nextFavs));
      } catch {}
      setFavoriteIdsState(nextFavs);
    }

    setConfirmOpen(false);
    setToDelete(null);
    if (selected && String(selected.id) === idKey) setSelected(null);
  };

  // Lock background scroll when any modal is open
  const anyModalOpen = Boolean(selected) || showForm || confirmOpen;
  useEffect(() => {
    const body = document.body;
    if (anyModalOpen) {
      body.classList.add('body-lock');
    } else {
      body.classList.remove('body-lock');
    }
    return () => body.classList.remove('body-lock');
  }, [anyModalOpen]);

  const AdminRouter = ({ route, recipes, setRecipes, err }) => {
    // pass full recipes array (all statuses) to admin pages
    const routeKey = route.replace(/^\/admin\/?/, '') || 'dashboard';
    if (routeKey.startsWith('recipes')) {
      return <RecipesAdmin recipes={recipes} onRecipesChange={setRecipes} />;
    }
    if (routeKey.startsWith('approvals')) {
      return <Approvals recipes={recipes} onRecipesChange={setRecipes} />;
    }
    // default dashboard
    return (
      <AdminLayout active="dashboard">
        {err && <div role="alert" className="alert alert-warn">{err}</div>}
        <Dashboard recipes={recipes} />
      </AdminLayout>
    );
  };

  return (
    <div className="app-root">
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        query={query}
        onQueryChange={setQuery}
        showOnlyFavorites={showOnlyFavorites}
        onToggleFavoritesFilter={() => setShowOnlyFavorites(v => !v)}
        favoritesCount={favoriteIds.length}
        category={category}
        onCategoryChange={(c) => setCategory(c)}
        categoryOptions={CATEGORY_OPTIONS}
        difficulty={difficulty}
        onDifficultyChange={(d) => setDifficulty(d)}
        difficultyOptions={DIFFICULTY_OPTIONS}
        onAddRecipe={openAdd}
      />
      {/* Routing: "/" main feed, "/admin/*" admin pages */}
      {route.startsWith('/admin') ? (
        <AdminRouter
          route={route}
          recipes={recipes}
          setRecipes={setRecipes}
          err={err}
        />
      ) : (
        <main className="container">
          {err && <div role="alert" className="alert alert-warn">{err}</div>}
          {loading ? (
            <div className="skeleton-grid">
              {Array.from({ length: 8 }).map((_, i) => (
                <div className="skeleton-card" key={i} />
              ))}
            </div>
          ) : (
            <RecipeGrid
              items={filtered}
              onSelect={setSelected}
              isFavorite={isFav}
              onToggleFavorite={onToggleFavorite}
              onEdit={openEditFromCard}
              onDelete={openDelete}
            />
          )}
        </main>
      )}
      <RecipeDetailModal
        recipe={selected}
        onClose={() => {
          if (selected) {
            // refresh rating fields for this id
            const rs = getRatingSummary(selected.id);
            setRecipes((prev) => prev.map((r) => String(r.id) === String(selected.id) ? { ...r, averageRating: rs.averageRating, reviewCount: rs.reviewCount } : r));
          }
          setSelected(null);
        }}
        isFavorite={isFav}
        onToggleFavorite={onToggleFavorite}
        onEdit={openEditFromModal}
        onDelete={openDelete}
      />

      {showForm && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={editing ? 'Edit Recipe' : 'Add Recipe'} onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e)=>e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{editing ? 'Edit Recipe' : 'Add Recipe'}</div>
              <button className="modal-close" aria-label="Close" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <div className="modal-body" role="document">
              <RecipeForm
                initial={editing}
                onCancel={() => setShowForm(false)}
                onSave={saveRecipe}
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
      <footer className="footer">
        <span>Recipe Explorer</span>
        <span className="dot">•</span>
        <span>Ocean Professional Theme</span>
      </footer>
    </div>
  );
}

export default App;
