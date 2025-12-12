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
import ShoppingListPage from './components/ShoppingListPage';
import MealPlanPage from './components/MealPlanPage';
import { addRecipeIngredientsToShoppingList } from './data/shoppingList';
import ToastContainer from './components/ToastContainer';
import { startNotificationScheduler, getNotificationSettings, saveNotificationSettings } from './data/notifications';

const CATEGORY_LS_KEY = 'recipeExplorer:selectedCategory:v1';
const DIFFICULTY_LS_KEY = 'recipeExplorer:selectedDifficulty:v1';
const CATEGORY_OPTIONS = ['All', 'Veg', 'Non-Veg', 'Desserts', 'Drinks'];
const DIFFICULTY_OPTIONS = ['All', 'Easy', 'Medium', 'Hard'];

/**
 * Root Recipe Explorer application with Ocean Professional theme.
 * - Header: logo/title + search + favorites filter + category filter + nav
 * - Content: recipe grid or feature pages
 * - Detail: modal view for selected recipe with heart and extra actions
 */
function App() {
  const [theme, setTheme] = useState('light');
  const [recipes, setRecipes] = useState([]);
  const [route, setRoute] = useState(getCurrentRoute() || getLastRoute() || '/');
  const [query, setQuery] = useState('');
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
    try { return window.localStorage.getItem(CATEGORY_LS_KEY) || 'All'; } catch { return 'All'; }
  });
  const [difficulty, setDifficulty] = useState(() => {
    try { return window.localStorage.getItem(DIFFICULTY_LS_KEY) || 'All'; } catch { return 'All'; }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    try { window.localStorage.setItem(CATEGORY_LS_KEY, category); } catch {}
  }, [category]);
  useEffect(() => {
    try { window.localStorage.setItem(DIFFICULTY_LS_KEY, difficulty); } catch {}
  }, [difficulty]);

  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => setDebouncedQuery(query), 200);
    return () => { if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current); };
  }, [query]);

  // Load recipes
  useEffect(() => {
    let cancelled = false;
    const normalizeCategory = (rec) => {
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
      setLoading(true); setErr('');
      try {
        const apiBaseEnv = process.env.REACT_APP_API_BASE || process.env.REACT_APP_BACKEND_URL || '';
        let data = [];
        if (apiBaseEnv) {
          try { data = await fetchRecipes(apiBaseEnv); }
          catch { data = mockRecipes; if (!cancelled) setErr('Failed to load from API. Showing offline data.'); }
        } else {
          data = mockRecipes;
        }
        if (!cancelled) {
          const arr = Array.isArray(data) ? data : [];
          const merged = mergeWithLocal(arr);
          const normalized = merged.map((r) => {
            const ingRaw = r.ingredients;
            let ingredientsArray = [];
            if (Array.isArray(ingRaw)) ingredientsArray = ingRaw.map((x) => String(x));
            else if (typeof ingRaw === 'string') {
              const parts = ingRaw.includes(',') ? ingRaw.split(',') : [ingRaw];
              ingredientsArray = parts.map((p) => p.trim()).filter(Boolean);
            } else if (ingRaw && typeof ingRaw === 'object' && Array.isArray(ingRaw.items)) {
              ingredientsArray = ingRaw.items.map((x) => String(x));
            }
            const ingredientsText = ingredientsArray.join(' ');
            const base = {
              ...r,
              category: normalizeCategory(r),
              ingredients: ingredientsArray,
              cookingTime: Number.isFinite(Number(r.cookingTime)) && Number(r.cookingTime) >= 0 ? Number(r.cookingTime) : 0,
              difficulty: ['Easy','Medium','Hard'].includes(r.difficulty) ? r.difficulty : 'Medium',
            };
            const withAdmin = normalizeAdminFields(base, { defaultStatus: RECIPE_STATUS.APPROVED, source: RECIPE_SOURCE.MOCK, submittedBy: 'mock' });
            const rating = getRatingSummary(withAdmin.id);
            return {
              ...withAdmin,
              averageRating: rating.averageRating,
              reviewCount: rating.reviewCount,
              _ingredientsText: ingredientsText.toLowerCase(),
              _titleText: String(withAdmin.title || '').toLowerCase(),
              _descText: String(withAdmin.description || '').toLowerCase(),
              _tagsText: (withAdmin.tags || []).map((t) => String(t)).join(' ').toLowerCase(),
              _categoryText: String(withAdmin.category || '').toLowerCase(),
              _difficultyText: String(withAdmin.difficulty || 'Medium').toLowerCase(),
            };
          });
          const approved = filterApproved(normalized);
          if (approved.length === 0 && normalized.length > 0) {
            const toApproveIds = normalized.slice(0, Math.min(2, normalized.length)).map(r => r.id);
            const seeded = normalized.map(r => toApproveIds.includes(r.id) ? { ...r, status: 'approved' } : r);
            try {
              const { setLocalRecipes } = require('./data/recipes');
              setLocalRecipes(seeded);
            } catch {}
            setRecipes(seeded);
            // Seed newRecipeAlerts seen set
            try {
              const s = getNotificationSettings?.();
              if (s && s.newRecipeAlerts && Array.isArray(s.newRecipeAlerts.lastSeenRecipeIds) && s.newRecipeAlerts.lastSeenRecipeIds.length === 0) {
                const approvedIds = seeded.filter(r => String(r.status).toLowerCase() === 'approved').map(r => String(r.id));
                s.newRecipeAlerts.lastSeenRecipeIds = approvedIds;
                saveNotificationSettings?.(s);
              }
            } catch {}
          } else {
            setRecipes(normalized);
            try {
              const s = getNotificationSettings?.();
              if (s && s.newRecipeAlerts && Array.isArray(s.newRecipeAlerts.lastSeenRecipeIds) && s.newRecipeAlerts.lastSeenRecipeIds.length === 0) {
                const approvedIds = normalized.filter(r => String(r.status).toLowerCase() === 'approved').map(r => String(r.id));
                s.newRecipeAlerts.lastSeenRecipeIds = approvedIds;
                saveNotificationSettings?.(s);
              }
            } catch {}
          }
        }
      } catch {
        if (!cancelled) {
          const merged = mergeWithLocal(mockRecipes);
          const normalized = merged.map((r) => {
            const ingRaw = r.ingredients;
            let ingredientsArray = [];
            if (Array.isArray(ingRaw)) ingredientsArray = ingRaw.map((x) => String(x));
            else if (typeof ingRaw === 'string') {
              const parts = ingRaw.includes(',') ? ingRaw.split(',') : [ingRaw];
              ingredientsArray = parts.map((p) => p.trim()).filter(Boolean);
            }
            const ingredientsText = ingredientsArray.join(' ');
            const cat = r.category || 'Veg';
            const withAdmin = normalizeAdminFields(
              { ...r, category: cat, ingredients: ingredientsArray, cookingTime: Number(r.cookingTime) || 0, difficulty: ['Easy','Medium','Hard'].includes(r.difficulty) ? r.difficulty : 'Medium' },
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
      } finally { if (!cancelled) setLoading(false); }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  // Router
  useEffect(() => {
    const onHash = () => setRoute(getCurrentRoute() || '/');
    window.addEventListener('hashchange', onHash);
    if (!window.location.hash) navigateTo('/');
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // Favorites sync
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key && e.key.startsWith('favoriteRecipeIds')) {
        setFavoriteIdsState(getFavoriteIds());
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Notification scheduler initialization (runs every 60s)
  useEffect(() => {
    const getApproved = () => {
      try {
        const { getApprovedRecipes } = require('./data/adminRecipes');
        return getApprovedRecipes(recipes);
      } catch {
        return recipes.filter(r => String(r.status).toLowerCase() === 'approved');
      }
    };
    const getTodayPlan = () => {
      try {
        const { getWeekStartMondayISO, loadMealPlanForWeek, DAYS } = require('./data/mealPlan');
        const today = new Date();
        const weekISO = getWeekStartMondayISO(today);
        const plan = loadMealPlanForWeek(weekISO);
        const dow = (today.getDay() + 6) % 7; // Monday index 0
        const dayKey = DAYS[dow];
        const entries = plan?.days?.[dayKey] || [];
        return [{ entries }];
      } catch {
        return [];
      }
    };
    const stop = startNotificationScheduler({
      getApprovedRecipes: getApproved,
      getTodayPlan,
    });
    return () => { try { stop(); } catch {} };
  }, [recipes]);

  const filtered = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    let base = filterApproved(recipes);
    if (showOnlyFavorites) {
      const favSet = new Set(favoriteIds);
      base = base.filter((r) => favSet.has(r.id));
    }
    if (category && category !== 'All') {
      base = base.filter((r) => (r.category || '').toString().toLowerCase() === category.toLowerCase());
    }
    if (difficulty && difficulty !== 'All') {
      const d = difficulty.toLowerCase();
      base = base.filter((r) => (r._difficultyText || String(r.difficulty || 'Medium').toLowerCase()) === d);
    }
    if (!q) return base;
    return base.filter((r) => {
      const titleMatch = (r._titleText ?? String(r.title || '').toLowerCase()).includes(q);
      const ingredientsMatch = (r._ingredientsText ?? (Array.isArray(r.ingredients) ? r.ingredients.join(' ').toLowerCase() : String(r.ingredients || '').toLowerCase())).includes(q);
      const tagsMatch = (r._tagsText ?? (r.tags || []).map((t) => String(t)).join(' ').toLowerCase()).includes(q);
      const descMatch = (r._descText ?? String(r.description || '').toLowerCase()).includes(q);
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

  const openAdd = () => { setEditing(null); setShowForm(true); };
  useEffect(() => {
    const handler = () => openAdd();
    window.addEventListener('openAddRecipe', handler);
    return () => window.removeEventListener('openAddRecipe', handler);
  }, []);
  const openEditFromCard = (recipe) => { setEditing(recipe); setShowForm(true); };
  const openEditFromModal = (recipe) => { setEditing(recipe); setShowForm(true); };
  const openDelete = (recipe) => { setToDelete(recipe); setConfirmOpen(true); };

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
    if (!toSave.id) { toSave.id = genId(); toSave.createdAt = now; }
    else { toSave.createdAt = draft.createdAt || now; }
    toSave.updatedAt = now;
    if (!toSave.category) toSave.category = 'Veg';
    if (!toSave.status) { toSave.status = RECIPE_STATUS.PENDING; }
    if (!toSave.source) toSave.source = RECIPE_SOURCE.USER;
    if (!toSave.submittedBy) toSave.submittedBy = 'user';

    upsertLocalRecipe(toSave);

    setRecipes((prev) => {
      const idKey = String(toSave.id);
      const idx = prev.findIndex((r) => String(r.id) === idKey);
      const normalized = normalizeForSearch(toSave);
      const rs = getRatingSummary(toSave.id);
      normalized.averageRating = rs.averageRating;
      normalized.reviewCount = rs.reviewCount;
      if (idx >= 0) {
        const next = [...prev]; next[idx] = normalized; return next;
      }
      return [normalized, ...prev];
    });

    setShowForm(false); setEditing(null);
  };

  const confirmDelete = () => {
    if (!toDelete) return;
    const idKey = String(toDelete.id);
    deleteLocalRecipe(idKey);
    try {
      const { purgeReviewsForRecipe } = require('./data/reviews');
      purgeReviewsForRecipe(idKey);
    } catch {}
    setRecipes((prev) => prev.filter((r) => String(r.id) !== idKey));
    if (favoriteIds.includes(toDelete.id)) {
      const nextFavs = favoriteIds.filter((fid) => String(fid) !== idKey);
      try { window.localStorage.setItem('favoriteRecipeIds:v1', JSON.stringify(nextFavs)); } catch {}
      setFavoriteIdsState(nextFavs);
    }
    setConfirmOpen(false); setToDelete(null);
    if (selected && String(selected.id) === idKey) setSelected(null);
  };

  const anyModalOpen = Boolean(selected) || showForm || confirmOpen;
  useEffect(() => {
    const body = document.body;
    if (anyModalOpen) body.classList.add('body-lock'); else body.classList.remove('body-lock');
    return () => body.classList.remove('body-lock');
  }, [anyModalOpen]);

  const AdminRouter = ({ route, recipes, setRecipes, err }) => {
    const routeKey = route.replace(/^\/admin\/?/, '') || 'dashboard';
    if (routeKey.startsWith('recipes')) {
      return <RecipesAdmin recipes={recipes} onRecipesChange={setRecipes} />;
    }
    if (routeKey.startsWith('approvals')) {
      return <Approvals recipes={recipes} onRecipesChange={setRecipes} />;
    }
    return (
      <AdminLayout active="dashboard">
        {err && <div role="alert" className="alert alert-warn">{err}</div>}
        <Dashboard recipes={recipes} />
      </AdminLayout>
    );
  };

  // Add ingredients from the modal action
  const addIngredientsFromModal = (recipe) => {
    try {
      addRecipeIngredientsToShoppingList(recipe);
      // Simple feedback; maintains modal scroll behavior (no navigation)
      // eslint-disable-next-line no-alert
      alert('Ingredients added to shopping list.');
    } catch (e) {
      // ignore
    }
  };

  const renderMain = () => {
    if (route.startsWith('/admin')) {
      return (
        <AdminRouter
          route={route}
          recipes={recipes}
          setRecipes={setRecipes}
          err={err}
        />
      );
    }
    if (route === '/shopping') {
      return (
        <main className="container">
          <ShoppingListPage />
        </main>
      );
    }
    if (route === '/plan') {
      return (
        <main className="container">
          <MealPlanPage />
        </main>
      );
    }
    // Home
    return (
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
        onAddRecipe={() => setShowForm(true)}
      />

      {renderMain()}

      <RecipeDetailModal
        recipe={selected}
        onClose={() => {
          if (selected) {
            const rs = getRatingSummary(selected.id);
            setRecipes((prev) => prev.map((r) => String(r.id) === String(selected.id) ? { ...r, averageRating: rs.averageRating, reviewCount: rs.reviewCount } : r));
          }
          setSelected(null);
        }}
        isFavorite={isFav}
        onToggleFavorite={onToggleFavorite}
        onEdit={openEditFromModal}
        onDelete={openDelete}
        extraActions={[
          selected && {
            key: 'add-to-shopping',
            label: 'Add ingredients to shopping list',
            onClick: () => addIngredientsFromModal(selected),
          },
        ].filter(Boolean)}
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
      <ToastContainer />
      <footer className="footer">
        <span>Recipe Explorer</span>
        <span className="dot">•</span>
        <span>Ocean Professional Theme</span>
      </footer>
    </div>
  );
}

export default App;
