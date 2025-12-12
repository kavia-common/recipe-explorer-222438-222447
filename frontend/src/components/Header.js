import React from 'react';

/**
 * Header with brand, search input, favorites filter, and theme toggle.
 * Props:
 * - theme: 'light' | 'dark'
 * - onToggleTheme: function to toggle theme
 * - query: string value
 * - onQueryChange: setter for query
 * - showOnlyFavorites: boolean
 * - onToggleFavoritesFilter: function
 * - favoritesCount: number
 */
const Header = ({
  theme,
  onToggleTheme,
  query,
  onQueryChange,
  showOnlyFavorites = false,
  onToggleFavoritesFilter = () => {},
  favoritesCount = 0
}) => {
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

        <label className="search-wrap" aria-label="Search recipes">
          <span className="search-icon" aria-hidden>🔎</span>
          <input
            placeholder="Search recipes, ingredients, or tags..."
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            aria-label="Search input"
          />
        </label>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="theme-toggle"
            onClick={onToggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            title="Toggle theme"
          >
            {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
          </button>

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
        </div>
      </div>
    </header>
  );
};

export default Header;
