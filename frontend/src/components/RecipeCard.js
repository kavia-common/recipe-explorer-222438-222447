import React from 'react';

/**
 * RecipeCard shows a single recipe preview.
 * Props:
 * - recipe: { id, title, image, description, tags, category }
 * - onClick: function (card click)
 * - isFavorite?: (id) => boolean
 * - onToggleFavorite?: (id) => void
 * - onEdit?: (recipe) => void
 * - onDelete?: (recipe) => void
 */
const RecipeCard = ({ recipe, onClick, isFavorite = () => false, onToggleFavorite = () => {}, onEdit = () => {}, onDelete = () => {} }) => {
  const { title, image, description, tags = [], category, cookingTime, difficulty } = recipe;
  const fav = isFavorite(recipe.id);

  const catChipStyle = {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 1,
    border: '1px solid color-mix(in oklab, var(--ocean-secondary), var(--ocean-border))',
    background: 'rgba(245,158,11,0.10)',
    color: 'var(--ocean-text)',
    padding: '4px 8px',
    borderRadius: 999,
    fontSize: 11,
    boxShadow: 'var(--ocean-shadow)',
  };

  return (
    <article
      className="card"
      role="listitem"
      onClick={onClick}
      tabIndex={0}
      onKeyDown={(e)=>{ if(e.key==='Enter'){ onClick(); }}}
      style={{ position: 'relative' }}
    >
      {category && (
        <span style={catChipStyle} aria-label={`Category ${category}`}>
          {category}
        </span>
      )}
      <button
        aria-label={fav ? 'Remove from favorites' : 'Add to favorites'}
        title={fav ? 'Remove from favorites' : 'Add to favorites'}
        onClick={(e) => { e.stopPropagation(); onToggleFavorite(recipe.id); }}
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          zIndex: 1,
          border: '1px solid var(--ocean-border)',
          background: 'var(--ocean-surface)',
          color: fav ? 'var(--ocean-primary)' : 'var(--ocean-text)',
          padding: '6px 10px',
          borderRadius: 999,
          cursor: 'pointer',
          boxShadow: 'var(--ocean-shadow)'
        }}
      >
        {fav ? '❤️' : '🤍'}
      </button>
      <button
        aria-label="More actions"
        title="More"
        onClick={(e) => { e.stopPropagation(); const menu = e.currentTarget.nextSibling; if (menu) menu.style.display = menu.style.display === 'none' ? 'block' : 'none'; }}
        style={{
          position: 'absolute',
          top: 10,
          right: 60,
          zIndex: 1,
          border: '1px solid var(--ocean-border)',
          background: 'var(--ocean-surface)',
          color: 'var(--ocean-text)',
          padding: '6px 10px',
          borderRadius: 999,
          cursor: 'pointer',
          boxShadow: 'var(--ocean-shadow)'
        }}
      >
        ⋯
      </button>
      <div
        style={{
          display: 'none',
          position: 'absolute',
          top: 46,
          right: 10,
          zIndex: 2,
          border: '1px solid var(--ocean-border)',
          background: 'var(--ocean-surface)',
          borderRadius: 12,
          boxShadow: 'var(--ocean-shadow)',
          overflow: 'hidden',
          minWidth: 140
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="theme-toggle"
          style={{ width: '100%', border: 'none', borderRadius: 0 }}
          onClick={() => onEdit(recipe)}
        >
          ✏️ Edit
        </button>
        <button
          className="theme-toggle"
          style={{ width: '100%', border: 'none', borderRadius: 0, background: 'rgba(239,68,68,0.12)', borderColor: 'color-mix(in oklab, var(--ocean-error), var(--ocean-border))' }}
          onClick={() => onDelete(recipe)}
        >
          🗑️ Delete
        </button>
      </div>
      <img
        className="card-img"
        src={image}
        alt={title}
        onError={(e) => { e.currentTarget.src = `https://source.unsplash.com/featured/640x360?food,meal&sig=${recipe.id}`; }}
      />
      {/* Badges row */}
      <div style={{ position: 'absolute', bottom: 150, left: 10, display: 'flex', gap: 6 }}>
        {Number.isFinite(Number(cookingTime)) && Number(cookingTime) >= 0 && (
          <span className="tag" aria-label={`Cooking time ${cookingTime} minutes`} style={{ background: 'rgba(37,99,235,0.08)', borderColor: 'color-mix(in oklab, var(--ocean-primary), var(--ocean-border))' }}>
            ⏱️ {Number(cookingTime)}m
          </span>
        )}
        {difficulty && (
          <span className="tag" aria-label={`Difficulty ${difficulty}`} style={{ background: 'rgba(245,158,11,0.10)', borderColor: 'color-mix(in oklab, var(--ocean-secondary), var(--ocean-border))' }}>
            🎯 {difficulty}
          </span>
        )}
      </div>
      <div className="card-body">
        <h3 className="card-title">{title}</h3>
        <p className="card-desc">{description}</p>
        {tags.length > 0 && (
          <div className="taglist" aria-label="tags">
            {tags.map((t, i) => (
              <span className="tag" key={i}>#{t}</span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
};

export default RecipeCard;
