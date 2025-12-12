import React, { useMemo, useState } from 'react';
import { getChefIdForRecipe, getChefNameForRecipe, getLikeCount, isLikedByMe, toggleLike, shareRecipe, isFollowing, toggleFollow } from '../data/community';
import { getSelectedLanguage } from '../data/i18n';

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

  // Language badge
  const lang = getSelectedLanguage();
  const showLang = lang && lang !== 'en';

  // Community local state
  const [likeCount, setLikeCount] = useState(() => getLikeCount(recipe.id));
  const [liked, setLiked] = useState(() => isLikedByMe(recipe.id));
  const chefId = useMemo(() => getChefIdForRecipe(recipe), [recipe]);
  const chefName = useMemo(() => getChefNameForRecipe(recipe), [recipe]);
  const [following, setFollowing] = useState(() => isFollowing(chefId));

  const onToggleLike = (e) => {
    e.stopPropagation();
    const { liked: l, count } = toggleLike(recipe.id);
    setLiked(l);
    setLikeCount(count);
  };
  const onShare = async (e) => {
    e.stopPropagation();
    const url = `${window.location.origin}${window.location.pathname}#/?id=${encodeURIComponent(String(recipe.id))}`;
    await shareRecipe({ title: recipe.title, text: 'Check out this recipe!', url });
  };
  const onToggleFollow = (e) => {
    e.stopPropagation();
    const now = toggleFollow(chefId);
    setFollowing(now);
  };

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
      {showLang && (
        <span
          aria-label={`Language ${lang}`}
          title={`Language: ${lang}`}
          className="tag"
          style={{
            position: 'absolute',
            top: 10,
            right: 110,
            zIndex: 1,
            background: 'rgba(37,99,235,0.10)',
            borderColor: 'color-mix(in oklab, var(--ocean-primary), var(--ocean-border))'
          }}
        >
          {lang.toUpperCase()}
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
        {fav ? '❤️' : '🫶'}
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
        src={image || `https://source.unsplash.com/featured/640x360?food,meal&sig=${recipe.id}`}
        alt={title || 'Recipe image'}
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
        {(Number(recipe.averageRating) > 0 || Number(recipe.reviewCount) > 0) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span className="tag" aria-label={`Average rating ${recipe.averageRating} out of 5`} style={{ background: 'rgba(37,99,235,0.08)', borderColor: 'color-mix(in oklab, var(--ocean-primary), var(--ocean-border))' }}>
              ⭐ {Number(recipe.averageRating || 0).toFixed(1)}
            </span>
            <span style={{ fontSize: 12, color: 'var(--ocean-muted)' }}>({Number(recipe.reviewCount || 0)})</span>
          </div>
        )}
        <p className="card-desc">{description}</p>
        {tags.length > 0 && (
          <div className="taglist" aria-label="tags">
            {tags.map((t, i) => (
              <span className="tag" key={i}>#{t}</span>
            ))}
          </div>
        )}

        {/* Community actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              aria-pressed={liked}
              aria-label={liked ? 'Unlike recipe' : 'Like recipe'}
              className="theme-toggle"
              onClick={onToggleLike}
              title={liked ? 'Unlike' : 'Like'}
              style={{ padding: '6px 10px', background: liked ? 'rgba(37,99,235,0.10)' : undefined }}
            >
              {liked ? '💙' : '🫶'} {likeCount > 0 ? likeCount : ''}
            </button>
            <button
              type="button"
              aria-label="Share recipe"
              className="theme-toggle"
              onClick={onShare}
              title="Share"
              style={{ padding: '6px 10px' }}
            >
              🔗 Share
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="tag" aria-label={`Chef ${chefName}`} style={{ background: 'rgba(37,99,235,0.06)', borderColor: 'color-mix(in oklab, var(--ocean-primary), var(--ocean-border))' }}>
              👨‍🍳 {chefName}
            </span>
            <button
              type="button"
              aria-pressed={following}
              aria-label={following ? 'Unfollow chef' : 'Follow chef'}
              className="theme-toggle"
              onClick={onToggleFollow}
              title={following ? 'Following' : 'Follow'}
              style={{ padding: '6px 10px', background: following ? 'rgba(37,99,235,0.10)' : undefined }}
            >
              {following ? 'Following' : 'Follow'}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

export default RecipeCard;
