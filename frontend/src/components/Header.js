import React from 'react';

/**
 * Header with brand, search input, and theme toggle.
 * Props:
 * - theme: 'light' | 'dark'
 * - onToggleTheme: function to toggle theme
 * - query: string value
 * - onQueryChange: setter for query
 */
const Header = ({ theme, onToggleTheme, query, onQueryChange }) => {
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

        <button
          className="theme-toggle"
          onClick={onToggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          title="Toggle theme"
        >
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>
      </div>
    </header>
  );
};

export default Header;
