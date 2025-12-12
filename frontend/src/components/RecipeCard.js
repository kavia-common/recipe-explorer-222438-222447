import React from 'react';

/**
 * RecipeCard shows a single recipe preview.
 * Props:
 * - recipe: { id, title, image, description, tags, category }
 * - onClick: function (card click)
 * - isFavorite?: (id) => boolean
 * - onToggleFavorite?: (id) => void
 */
const RecipeCard = ({ recipe, onClick, isFavorite = () => false, onToggleFavorite = () => {} }) => {
  const { title, image, description, tags = [], category } = recipe;
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
      <img
        className="card-img"
        src={image}
        alt={title}
        onError={(e) => { e.currentTarget.src = `https://source.unsplash.com/featured/640x360?food,meal&sig=${recipe.id}`; }}
      />
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
