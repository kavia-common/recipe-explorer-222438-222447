import React from 'react';

/**
 * RecipeCard shows a single recipe preview.
 * Props:
 * - recipe: { id, title, image, description, tags }
 * - onClick: function
 */
const RecipeCard = ({ recipe, onClick }) => {
  const { title, image, description, tags = [] } = recipe;
  return (
    <article className="card" role="listitem" onClick={onClick} tabIndex={0} onKeyDown={(e)=>{ if(e.key==='Enter'){ onClick(); }}}>
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
