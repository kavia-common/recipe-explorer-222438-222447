import React, { useEffect, useMemo, useState } from 'react';
import { getOrCreateUser, getReviewsForRecipe, getRatingSummary, upsertMyReview, deleteMyReview } from '../data/reviews';

/**
 * RecipeDetailModal renders selected recipe details in a modal.
 * PUBLIC_INTERFACE
 */
const RecipeDetailModal = ({ recipe, onClose, isFavorite = () => false, onToggleFavorite = () => {}, onEdit = () => {}, onDelete = () => {} }) => {
  // Ensure hooks are always called in same order; guard props with defaults.
  const rec = recipe || {};
  const recipeId = rec.id;

  useEffect(() => {
    function onEsc(e) { if (e.key === 'Escape') onClose(); }
    if (recipe) {
      document.addEventListener('keydown', onEsc);
      // lock body scroll while modal is open
      document.body.classList.add('body-lock');
    }
    if (!recipe) return null;

  return () => {
      document.removeEventListener('keydown', onEsc);
      document.body.classList.remove('body-lock');
    };
  }, [recipe, onClose]);

  const fav = recipe ? isFavorite(recipe.id) : false;

  const [reviews, setReviews] = useState(() => (recipe ? getReviewsForRecipe(recipe.id) : []));
  const [showCount, setShowCount] = useState(5);
  const me = getOrCreateUser();

  const myReview = useMemo(() => {
    if (!recipe) return undefined;
    return reviews.find(r => String(r.authorId) === String(me.id));
  }, [reviews, me.id, recipe]);

  const summary = useMemo(() => {
    if (!recipe) return { averageRating: 0, reviewCount: 0 };
    return getRatingSummary(recipe.id);
  }, [reviews, recipe]);

  const [ratingInput, setRatingInput] = useState(myReview?.rating || 0);
  const [commentInput, setCommentInput] = useState(myReview?.comment || '');
  const [error, setError] = useState('');

  useEffect(() => {
    setRatingInput(myReview?.rating || 0);
    setCommentInput(myReview?.comment || '');
  }, [myReview?.id]);

  useEffect(() => {
    // When recipe changes, load its reviews
    if (recipe) {
      setReviews(getReviewsForRecipe(recipe.id));
      setShowCount(5);
    } else {
      setReviews([]);
      setShowCount(5);
    }
  }, [recipe]);

  const submitReview = (e) => {
    e.preventDefault();
    if (!recipe) return;
    setError('');
    const n = Number(ratingInput);
    if (!(n >= 1 && n <= 5)) {
      setError('Please select a rating from 1 to 5.');
      return;
    }
    if (String(commentInput || '').length > 1000) {
      setError('Comment is too long (max 1000 characters).');
      return;
    }
    const next = upsertMyReview({ recipeId: recipe.id, rating: n, comment: commentInput });
    setReviews(next);
  };

  const removeReview = () => {
    if (!recipe) return;
    const next = deleteMyReview(recipe.id);
    setReviews(next);
  };

  const StarInput = ({ value, onChange }) => {
    // accessible star selector 1..5
    const stars = [1,2,3,4,5];
    return (
      <div role="group" aria-label="Rating" style={{ display: 'flex', gap: 6 }}>
        {stars.map((s) => {
          const active = value >= s;
          return (
            <button
              key={s}
              type="button"
              onClick={() => onChange(s)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight') onChange(Math.min(5, (value || 0) + 1));
                if (e.key === 'ArrowLeft') onChange(Math.max(1, (value || 0) - 1));
              }}
              aria-pressed={active}
              aria-label={`${s} star${s>1?'s':''}`}
              className="theme-toggle"
              style={{
                padding: '6px 8px',
                background: active ? 'rgba(245,158,11,0.12)' : 'var(--ocean-surface)',
                borderColor: active ? 'color-mix(in oklab, var(--ocean-secondary), var(--ocean-border))' : 'var(--ocean-border)'
              }}
            >
              {active ? '⭐' : '☆'}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={`Recipe details for ${recipe.title}`} onClick={onClose}>
      <div className="modal" onClick={(e)=>e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span>{recipe.title}</span>
            {(summary.reviewCount > 0) && (
              <span className="tag" aria-label={`Average rating ${summary.averageRating} from ${summary.reviewCount} reviews`} style={{ background: 'rgba(37,99,235,0.08)', borderColor: 'color-mix(in oklab, var(--ocean-primary), var(--ocean-border))' }}>
                ⭐ {summary.averageRating} ({summary.reviewCount})
              </span>
            )}
            {Number.isFinite(Number(recipe.cookingTime)) && Number(recipe.cookingTime) >= 0 && (
              <span className="tag" aria-label={`Cooking time ${recipe.cookingTime} minutes`} style={{ background: 'rgba(37,99,235,0.08)', borderColor: 'color-mix(in oklab, var(--ocean-primary), var(--ocean-border))' }}>
                ⏱️ {Number(recipe.cookingTime)}m
              </span>
            )}
            {recipe.difficulty && (
              <span className="tag" aria-label={`Difficulty ${recipe.difficulty}`} style={{ background: 'rgba(245,158,11,0.10)', borderColor: 'color-mix(in oklab, var(--ocean-secondary), var(--ocean-border))' }}>
                🎯 {recipe.difficulty}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button
              aria-label={fav ? 'Remove from favorites' : 'Add to favorites'}
              title={fav ? 'Remove from favorites' : 'Add to favorites'}
              onClick={() => onToggleFavorite(recipe.id)}
              className="theme-toggle"
              style={{ padding: '6px 10px' }}
            >
              {fav ? '❤️ Favorited' : '🤍 Favorite'}
            </button>
            <button
              className="theme-toggle"
              onClick={() => onEdit(recipe)}
              aria-label="Edit recipe"
              title="Edit"
              style={{ padding: '6px 10px' }}
            >
              ✏️ Edit
            </button>
            <button
              className="theme-toggle"
              onClick={() => onDelete(recipe)}
              aria-label="Delete recipe"
              title="Delete"
              style={{ padding: '6px 10px', background: 'rgba(239,68,68,0.12)', borderColor: 'color-mix(in oklab, var(--ocean-error), var(--ocean-border))' }}
            >
              🗑️ Delete
            </button>
            <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
          </div>
        </div>
        <div className="modal-body" role="document">
          <img
            className="detail-img"
            src={recipe.image}
            alt={recipe.title}
            onError={(e) => { e.currentTarget.src = `https://source.unsplash.com/featured/800x400?recipe,food&sig=${recipe.id}`; }}
          />
          {/* Category chip */}
          {recipe.category && (
            <div className="taglist" style={{ marginTop: 8, marginBottom: 8 }}>
              <span
                className="tag"
                aria-label={`Category ${recipe.category}`}
                style={{
                  borderColor: 'color-mix(in oklab, var(--ocean-secondary), var(--ocean-border))',
                  background: 'rgba(245,158,11,0.10)',
                }}
              >
                {recipe.category}
              </span>
            </div>
          )}

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

          <div className="section-title">Reviews</div>
          {summary.reviewCount === 0 && (
            <div className="alert">No reviews yet. Be the first to review this recipe.</div>
          )}

          {reviews.slice(0, showCount).map((rev) => (
            <div key={rev.id} className="card" style={{ padding: 12, marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span aria-label={`Rating ${rev.rating} out of 5`} className="tag" style={{ background: 'rgba(245,158,11,0.12)', borderColor: 'color-mix(in oklab, var(--ocean-secondary), var(--ocean-border))' }}>
                    {'⭐'.repeat(Math.max(1, Math.min(5, Number(rev.rating)||0)))}
                  </span>
                  <span style={{ fontWeight: 700 }}>{rev.authorName || 'Anonymous'}</span>
                  <span style={{ color: 'var(--ocean-muted)', fontSize: 12 }}>
                    {rev.updatedAt ? new Date(rev.updatedAt).toLocaleDateString() : ''}
                  </span>
                </div>
                {String(rev.authorId) === String(me.id) && (
                  <button className="theme-toggle" onClick={() => { setRatingInput(rev.rating); setCommentInput(rev.comment || ''); }}>
                    Edit mine
                  </button>
                )}
              </div>
              {rev.comment && <p style={{ marginTop: 8, marginBottom: 0 }}>{rev.comment}</p>}
            </div>
          ))}
          {reviews.length > showCount && (
            <button className="theme-toggle" onClick={() => setShowCount((c)=>c+5)} style={{ marginBottom: 8 }}>
              Show more
            </button>
          )}

          <div className="card" style={{ padding: 12, marginTop: 8 }}>
            <div style={{ fontWeight: 800, marginBottom: 8 }}>{myReview ? 'Edit your review' : 'Add a review'}</div>
            {error && <div className="alert alert-warn" role="alert">{error}</div>}
            <form onSubmit={submitReview} style={{ display: 'grid', gap: 10 }}>
              <div>
                <StarInput value={ratingInput} onChange={setRatingInput} />
              </div>
              <div>
                <label htmlFor="review-comment" style={{ fontWeight: 700, fontSize: 13 }}>Comment</label>
                <textarea
                  id="review-comment"
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  placeholder="Share your thoughts..."
                  style={{ width: '100%', minHeight: 80, resize: 'vertical', border: '1px solid var(--ocean-border)', background: 'var(--ocean-surface)', color: 'var(--ocean-text)', borderRadius: 10, padding: '10px 12px' }}
                  maxLength={1000}
                />
                <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--ocean-muted)' }}>
                  {String(commentInput || '').length}/1000
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                {myReview && (
                  <button type="button" className="theme-toggle" style={{ background: 'rgba(239,68,68,0.12)', borderColor: 'color-mix(in oklab, var(--ocean-error), var(--ocean-border))' }} onClick={removeReview}>
                    Delete my review
                  </button>
                )}
                <button type="submit" className="theme-toggle" style={{ background: 'rgba(37,99,235,0.10)' }}>
                  {myReview ? 'Save review' : 'Add review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeDetailModal;
