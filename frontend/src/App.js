import React, { useEffect, useMemo, useState } from 'react';
import './App.css';
import './index.css';
import { fetchRecipes } from './data/api';
import { mockRecipes } from './data/mock';
import RecipeGrid from './components/RecipeGrid';
import RecipeDetailModal from './components/RecipeDetailModal';
import Header from './components/Header';

/**
 * Root Recipe Explorer application with Ocean Professional theme.
 * - Header: logo/title + search
 * - Content: recipe grid
 * - Detail: modal view for selected recipe
 */
function App() {
  const [theme, setTheme] = useState('light');
  const [recipes, setRecipes] = useState([]);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return recipes;
    return recipes.filter(r => {
      const hay = [
        r.title,
        r.description,
        ...(r.tags || []),
        ...(r.ingredients || []),
      ].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [recipes, query]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));

  return (
    <div className="app-root">
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        query={query}
        onQueryChange={setQuery}
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
          <RecipeGrid items={filtered} onSelect={setSelected} />
        )}
      </main>
      <RecipeDetailModal
        recipe={selected}
        onClose={() => setSelected(null)}
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
