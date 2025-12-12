import React from 'react';
import RecipeCard from './RecipeCard';

/**
 * RecipeGrid renders a responsive grid of RecipeCard components.
 * PUBLIC_INTERFACE
 */
const RecipeGrid = ({ items, onSelect, isFavorite = () => false, onToggleFavorite = () => {}, onEdit = () => {}, onDelete = () => {} }) => {
  if (!items || items.length === 0) {
    return (
      <div className="card" role="status" style={{ padding: 20, textAlign: 'center' }}>
        <div style={{ fontWeight: 800, marginBottom: 6 }}>No recipes to show</div>
        <div style={{ color: 'var(--ocean-muted)', marginBottom: 12 }}>
          Try clearing filters (Favorites, Category, Difficulty, Cook Time, Quick Snacks, Calories, High Protein, Diet) or add a new recipe.
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button className="theme-toggle" onClick={() => window.location.reload()}>
            Reset filters
          </button>
          <button className="theme-toggle" onClick={() => window.dispatchEvent(new CustomEvent('openAddRecipe'))} style={{ background: 'rgba(37,99,235,0.10)' }}>
            + Add Recipe
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid" role="list">
      {items.map((r) => (
        <RecipeCard
          key={r.id}
          recipe={r}
          onClick={() => onSelect(r)}
          isFavorite={isFavorite}
          onToggleFavorite={onToggleFavorite}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default RecipeGrid;
