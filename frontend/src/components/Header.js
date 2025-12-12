import React, { useEffect, useState } from 'react';
import { navigateTo } from '../data/admin';
import NotificationSettings from './NotificationSettings';
import { SUPPORTED_LANGUAGES, getSelectedLanguage, setSelectedLanguage, tUI } from '../data/i18n';

/**
 * Header with brand, search input, category filter, favorites filter, theme toggle, nav, and language selector.
 * Props:
 * - theme: 'light' | 'dark'
 * - onToggleTheme: function to toggle theme
 * - query: string value
 * - onQueryChange: setter for query
 * - showOnlyFavorites: boolean
 * - onToggleFavoritesFilter: function
 * - favoritesCount: number
 * - category: string
 * - onCategoryChange: (cat: string) => void
 * - categoryOptions: string[]
 * - difficulty: string
 * - onDifficultyChange: (d: string) => void
 * - difficultyOptions: string[]
 * - onAddRecipe?: () => void
 * - cookTime: string ('All' | '<10' | '<30' | '>=60')
 * - onCookTimeChange: (v: string) => void
 * - quickSnacksOnly: boolean
 * - onToggleQuickSnacks: () => void
 */
const Header = ({
  theme,
  onToggleTheme,
  query,
  onQueryChange,
  showOnlyFavorites = false,
  onToggleFavoritesFilter = () => {},
  favoritesCount = 0,
  category = 'All',
  onCategoryChange = () => {},
  categoryOptions = ['All', 'Veg', 'Non-Veg', 'Desserts', 'Drinks'],
  difficulty = 'All',
  onDifficultyChange = () => {},
  difficultyOptions = ['All', 'Easy', 'Medium', 'Hard'],
  onAddRecipe = () => {},
  cookTime = 'All',
  onCookTimeChange = () => {},
  quickSnacksOnly = false,
  onToggleQuickSnacks = () => {},
}) => {
  const [showNotif, setShowNotif] = useState(false);
  const [lang, setLang] = useState(getSelectedLanguage());

  useEffect(() => {
    setLang(getSelectedLanguage());
  }, []);

  const Pill = ({ label, active, onClick }) => (
    <button
      type="button"
      onClick={onClick}
      className="theme-toggle"
      aria-pressed={active}
      style={{
        padding: '6px 10px',
        background: active ? 'rgba(37,99,235,0.08)' : 'var(--ocean-surface)',
        borderColor: active ? 'color-mix(in oklab, var(--ocean-primary), var(--ocean-border))' : 'var(--ocean-border)',
      }}
    >
      {label}
    </button>
  );

  const go = (path) => navigateTo(path);

  const onLangChange = (e) => {
    const value = e.target.value;
    setLang(value);
    setSelectedLanguage(value);
  };

  return (
    <header className="header">
      <div className="header-inner">
        <div
          className="brand"
          aria-label="Recipe Explorer"
          role="link"
          tabIndex={0}
          onClick={() => go('/')}
          onKeyDown={(e) => e.key === 'Enter' && go('/')}
          style={{ cursor: 'pointer' }}
        >
          <div className="logo" aria-hidden>Rx</div>
          <div>
            <div className="title">Recipe Explorer</div>
            <div className="subtitle">Discover, search, and cook</div>
          </div>
        </div>

        <label className="search-wrap" aria-label={tUI('Search', lang)} style={{ minWidth: 0 }}>
          <span className="search-icon" aria-hidden>🔎</span>
          <input
            placeholder="Search by name or ingredients"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            aria-label="Search input"
          />
        </label>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {/* Primary navigation */}
          <nav aria-label="Primary" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button className="theme-toggle" onClick={() => go('/')} title="Home">Home</button>
            <button className="theme-toggle" onClick={() => go('/shopping')} title="Shopping">Shopping</button>
            <button className="theme-toggle" onClick={() => go('/plan')} title="Planning">Planning</button>
            <button className="theme-toggle" onClick={() => go('/chefs')} title="Chefs">Chefs</button>
            <button className="theme-toggle" onClick={() => go('/settings')} title="Settings">Settings</button>
            <button
              className="theme-toggle"
              onClick={onAddRecipe}
              aria-label="Add Recipe"
              title="Add Recipe"
              style={{ background: 'rgba(37,99,235,0.10)' }}
            >
              ➕ {tUI('Recipes', lang)}
            </button>
          </nav>

          {/* Category selector - pills on wide screens */}
          <div aria-label="Category filter" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {categoryOptions.map((opt) => (
              <Pill
                key={opt}
                label={opt}
                active={category === opt}
                onClick={() => onCategoryChange(opt)}
              />
            ))}
          </div>

          {/* Difficulty selector - compact */}
          <div aria-label="Difficulty filter" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--ocean-muted)' }}>{tUI('Difficulty', lang)}</span>
            <select
              aria-label="Difficulty select"
              value={difficulty}
              onChange={(e) => onDifficultyChange(e.target.value)}
              style={{
                border: '1px solid var(--ocean-border)',
                background: 'var(--ocean-surface)',
                color: 'var(--ocean-text)',
                padding: '8px 12px',
                borderRadius: 999,
                boxShadow: 'var(--ocean-shadow)'
              }}
            >
              {difficultyOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>

          {/* Cook Time selector */}
          <div aria-label="Cook Time filter" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--ocean-muted)' }}>Cook Time</span>
            <select
              aria-label="Cook Time select"
              value={cookTime}
              onChange={(e) => onCookTimeChange(e.target.value)}
              style={{
                border: '1px solid var(--ocean-border)',
                background: 'var(--ocean-surface)',
                color: 'var(--ocean-text)',
                padding: '8px 12px',
                borderRadius: 999,
                boxShadow: 'var(--ocean-shadow)'
              }}
            >
              {['All', '<10', '<30', '>=60'].map((opt) => <option key={opt} value={opt}>{opt === '<10' ? 'Under 10 minutes' : opt === '<30' ? 'Under 30 minutes' : opt === '>=60' ? 'Long recipes (>=60)' : 'All'}</option>)}
            </select>
          </div>

          {/* Quick Snacks toggle */}
          <button
            className="theme-toggle"
            onClick={onToggleQuickSnacks}
            aria-pressed={quickSnacksOnly}
            aria-label="Quick Snacks only"
            title="Quick Snacks"
            style={{
              borderColor: quickSnacksOnly ? 'color-mix(in oklab, var(--ocean-primary), var(--ocean-border))' : undefined,
              background: quickSnacksOnly ? 'rgba(37,99,235,0.08)' : undefined
            }}
          >
            🍪 Quick Snacks
          </button>

          {/* Favorites */}
          <button
            className="theme-toggle"
            onClick={onToggleFavoritesFilter}
            aria-pressed={showOnlyFavorites}
            aria-label="Toggle favorites filter"
            title="Show only favorites"
            style={{
              borderColor: showOnlyFavorites ? 'color-mix(in oklab, var(--ocean-primary), var(--ocean-border))' : undefined,
              background: showOnlyFavorites ? 'rgba(37,99,235,0.08)' : undefined
            }}
          >
            <span aria-hidden>❤️</span> Favorites{favoritesCount ? ` (${favoritesCount})` : ''}
          </button>

          {/* Admin */}
          <button
            className="theme-toggle"
            onClick={() => navigateTo('/admin/dashboard')}
            aria-label="Admin"
            title="Admin"
            style={{ borderColor: 'var(--ocean-border)' }}
          >
            🛠️ {tUI('Admin', lang)}
          </button>

          {/* Notifications bell */}
          <button
            className="theme-toggle"
            onClick={() => setShowNotif(true)}
            aria-label="Notifications"
            title="Notifications"
            style={{ borderColor: 'var(--ocean-border)' }}
          >
            🔔
          </button>

          {/* Language selector */}
          <div aria-label={tUI('Language', lang)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span aria-hidden title={tUI('Language', lang)}>🌐</span>
            <label htmlFor="language-select" className="sr-only">{tUI('Language', lang)}</label>
            <select
              id="language-select"
              aria-label={tUI('Language', lang)}
              value={lang}
              onChange={onLangChange}
              style={{
                border: '1px solid var(--ocean-border)',
                background: 'var(--ocean-surface)',
                color: 'var(--ocean-text)',
                padding: '8px 12px',
                borderRadius: 999,
                boxShadow: 'var(--ocean-shadow)',
                cursor: 'pointer',
              }}
            >
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          {/* Theme toggle */}
          <button
            className="theme-toggle"
            onClick={onToggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            title="Toggle theme"
          >
            {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
          </button>
        </div>
      </div>
      {showNotif && <NotificationSettings onClose={() => setShowNotif(false)} />}
    </header>
  );
};

export default Header;
