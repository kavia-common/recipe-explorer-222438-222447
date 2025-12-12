import React, { useEffect, useMemo, useState } from 'react';
import './App.css';
import './index.css';
import { fetchRecipes } from './data/api';
import { mockRecipes } from './data/mock';
import RecipeGrid from './components/RecipeGrid';
import RecipeDetailModal from './components/RecipeDetailModal';
import Header from './components/Header';
import { getFavoriteIds, toggleFavorite } from './data/favorites';

const CATEGORY_LS_KEY = 'recipeExplorer:selectedCategory:v1';
const CATEGORY_OPTIONS = ['All', 'Veg', 'Non-Veg', 'Desserts', 'Drinks'];

/**
 * Root Recipe Explorer application with Ocean Professional theme.
 * - Header: logo/title + search + favorites filter + category filter
 * - Content: recipe grid with favorite hearts
 * - Detail: modal view for selected recipe with heart
 */
function App() {
  const [theme, setTheme] = useState('light');
  const [recipes, setRecipes] = useState([]);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [favoriteIds, setFavoriteIdsState] = useState(() => getFavoriteIds());
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [category, setCategory] = useState(() => {
    try {
      return window.localStorage.getItem(CATEGORY_LS_KEY) || 'All';
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
          // ensure category field exists
          const withCat = arr.map((r) => ({ ...r, category: normalizeCategory(r) }));
          setRecipes(withCat);
        }
      } catch {
        // Any unexpected error -> fallback to mock silently; keep UI responsive
        if (!cancelled) {
          const withCat = mockRecipes.map((r) => ({ ...r, category: r.category || 'Veg' }));
          setRecipes(withCat);
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
    const q = query.trim().toLowerCase();
    let base = recipes;

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

    // Search filter
    if (!q) return base;
    return base.filter(r => {
      const hay = [
        r.title,
        r.description,
        r.category,
        ...(r.tags || []),
        ...(r.ingredients || []),
      ].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [recipes, query, favoriteIds, showOnlyFavorites, category]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));

  // PUBLIC_INTERFACE
  const onToggleFavorite = (id) => {
    const next = toggleFavorite(id);
    setFavoriteIdsState(next);
  };

  // PUBLIC_INTERFACE
  const isFav = (id) => favoriteIds.includes(id);

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
      />
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
          />
        )}
      </main>
      <RecipeDetailModal
        recipe={selected}
        onClose={() => setSelected(null)}
        isFavorite={isFav}
        onToggleFavorite={onToggleFavorite}
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
