import React, { useEffect, useMemo, useState } from 'react';
import './App.css';
import './index.css';
import { fetchRecipes } from './data/api';
import { mockRecipes } from './data/mock';
import RecipeGrid from './components/RecipeGrid';
import RecipeDetailModal from './components/RecipeDetailModal';
import Header from './components/Header';
import { getFavoriteIds, toggleFavorite } from './data/favorites';

/**
 * Root Recipe Explorer application with Ocean Professional theme.
 * - Header: logo/title + search + favorites filter
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

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Load recipes from API if configured; otherwise fallback to mock
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setErr('');
      try {
        const apiBase = process.env.REACT_APP_API_BASE || process.env.REACT_APP_BACKEND_URL || '';
        const useApi = Boolean(apiBase);
        let data = [];
        if (useApi) {
          data = await fetchRecipes(apiBase);
        } else {
          // fallback to mock
          data = mockRecipes;
        }
        if (!cancelled) {
          setRecipes(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        if (!cancelled) {
          setErr('Failed to load recipes. Showing offline data.');
          setRecipes(mockRecipes);
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
    if (showOnlyFavorites) {
      const favSet = new Set(favoriteIds);
      base = recipes.filter((r) => favSet.has(r.id));
    }
    if (!q) return base;
    return base.filter(r => {
      const hay = [
        r.title,
        r.description,
        ...(r.tags || []),
        ...(r.ingredients || []),
      ].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [recipes, query, favoriteIds, showOnlyFavorites]);

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
