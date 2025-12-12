import React from 'react';

/**
 * Header with brand, search input, category filter, favorites filter, and theme toggle.
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
 * - onAddRecipe?: () => void
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
  onAddRecipe = () => {},
}) => {
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

  return (
    <header className="header">
      <div className="header-inner">
        <div className="brand" aria-label="Recipe Explorer">
          <div className="logo" aria-hidden>Rx</div>
          <div>
            <div className="title">Recipe Explorer</div>
            <div className="subtitle">Discover, search, and cook</div>
          </div>
        </div>

        <label className="search-wrap" aria-label="Search recipes" style={{ minWidth: 0 }}>
          <span className="search-icon" aria-hidden>🔎</span>
          <input
            placeholder="Search by name or ingredients"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            aria-label="Search input"
          />
        </label>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
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

          {/* Fallback compact select for extremely small screens (kept for a11y; visually still usable) */}
          <select
            aria-label="Category select"
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
            style={{
              display: 'none',
              border: '1px solid var(--ocean-border)',
              background: 'var(--ocean-surface)',
              color: 'var(--ocean-text)',
              padding: '8px 12px',
              borderRadius: 999,
              boxShadow: 'var(--ocean-shadow)',
            }}
          >
            {categoryOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
          </select>

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

          <button
            className="theme-toggle"
            onClick={onAddRecipe}
            aria-label="Add Recipe"
            title="Add Recipe"
            style={{ background: 'rgba(37,99,235,0.10)' }}
          >
            ➕ Add Recipe
          </button>

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
    </header>
  );
};

export default Header;
