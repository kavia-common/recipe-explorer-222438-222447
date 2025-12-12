import React, { useEffect } from 'react';

/**
 * RecipeDetailModal renders selected recipe details in a modal.
 * PUBLIC_INTERFACE
 */
const RecipeDetailModal = ({ recipe, onClose }) => {
  useEffect(() => {
    function onEsc(e) { if (e.key === 'Escape') onClose(); }
    if (recipe) {
      document.addEventListener('keydown', onEsc);
    }
    return () => document.removeEventListener('keydown', onEsc);
  }, [recipe, onClose]);

  if (!recipe) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={`Recipe details for ${recipe.title}`} onClick={onClose}>
      <div className="modal" onClick={(e)=>e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">{recipe.title}</div>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="modal-body">
          <img
            className="detail-img"
            src={recipe.image}
            alt={recipe.title}
            onError={(e) => { e.currentTarget.src = `https://source.unsplash.com/featured/800x400?recipe,food&sig=${recipe.id}`; }}
          />
          {recipe.description && <p className="card-desc" style={{marginBottom: 12}}>{recipe.description}</p>}

          {Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0 && (
            <>
              <div className="section-title">Ingredients</div>
              <ul className="list">
                {recipe.ingredients.map((ing, i) => (
                  <li key={i}>{ing}</li>
                ))}
              </ul>
            </>
          )}

          {Array.isArray(recipe.steps) && recipe.steps.length > 0 && (
            <>
              <div className="section-title">Steps</div>
              <ol className="list">
                {recipe.steps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecipeDetailModal;
