import React from 'react';
import RecipeCard from './RecipeCard';

/**
 * RecipeGrid renders a responsive grid of RecipeCard components.
 * PUBLIC_INTERFACE
 */
const RecipeGrid = ({ items, onSelect }) => {
  if (!items || items.length === 0) {
    return (
      <div className="alert" role="status">
        No recipes found. Try a different search.
      </div>
    );
  }

  return (
    <div className="grid" role="list">
      {items.map((r) => (
        <RecipeCard key={r.id} recipe={r} onClick={() => onSelect(r)} />
      ))}
    </div>
  );
};

export default RecipeGrid;
