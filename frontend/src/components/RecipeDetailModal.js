import React, { useEffect, useMemo, useState } from 'react';
import { getOrCreateUser, getReviewsForRecipe, getRatingSummary, upsertMyReview, deleteMyReview } from '../data/reviews';
import { addComment, deleteMyComment, editMyComment, getCommentsForRecipe, getOrCreateCommunityUser, getChefIdForRecipe, getChefNameForRecipe, getFollowerCount, getLikeCount, isFollowing, isLikedByMe, shareRecipe, toggleFollow, toggleLike } from '../data/community';
import { getSelectedLanguage, translateRecipe, tUI, recordTranslatedView } from '../data/i18n';

/**
 * RecipeDetailModal renders selected recipe details in a modal, with multilingual support.
 * PUBLIC_INTERFACE
 * @param {{ key:string, label:string, onClick:() => void }[]} [extraActions]
 */
const RecipeDetailModal = ({
  recipe,
  onClose,
  isFavorite = () => false,
  onToggleFavorite = () => {},
  onEdit = () => {},
  onDelete = () => {},
  extraActions = [],
}) => {
  const rec = recipe || {};
  const recipeId = rec.id;

  const [lang, setLang] = useState(getSelectedLanguage());
  const [showOriginal, setShowOriginal] = useState(false);

  useEffect(() => {
    if (!recipe) return;
    function onEsc(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onEsc);
    document.body.classList.add('body-lock');
    // Optional compact chips for collections (ensure defined)
  let collectionChips = [];
  try {
    const { getRecipeCollections } = require('../data/collections');
    collectionChips = recipeId ? getRecipeCollections(recipeId) : [];
  } catch (e) {
    collectionChips = [];
  }

  return () => {
      document.removeEventListener('keydown', onEsc);
      document.body.classList.remove('body-lock');
    };
  }, [recipe, onClose]);

  useEffect(() => {
    setLang(getSelectedLanguage());
  }, []);

  useEffect(() => {
    if (lang !== 'en') recordTranslatedView(lang);
  }, [lang]);

  const fav = recipe ? isFavorite(recipe.id) : false;

  const [reviews, setReviews] = useState(() => (recipe ? getReviewsForRecipe(recipe.id) : []));
  // Optional compact chips for collections (ensure defined in scope before render)
  let collectionChips = [];
  try {
    const { getRecipeCollections } = require('../data/collections');
    collectionChips = recipeId ? getRecipeCollections(recipeId) : [];
  } catch (e) {
    collectionChips = [];
  }
  // Community state: likes, follows, comments
  const [likeCount, setLikeCount] = useState(() => (recipe ? getLikeCount(recipe.id) : 0));
  const [liked, setLiked] = useState(() => (recipe ? isLikedByMe(recipe.id) : false));
  const chefId = useMemo(() => (recipe ? getChefIdForRecipe(recipe) : ''), [recipe]);
  const chefName = useMemo(() => (recipe ? getChefNameForRecipe(recipe) : ''), [recipe]);
  const [following, setFollowing] = useState(() => (chefId ? isFollowing(chefId) : false));
  const [followers, setFollowers] = useState(() => (chefId ? getFollowerCount(chefId) : 0));
  const [comments, setComments] = useState(() => (recipe ? getCommentsForRecipe(recipe.id) : []));
  const [commentText, setCommentText] = useState('');
  const [commentsShow, setCommentsShow] = useState(5);
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
    if (recipe) {
      setReviews(getReviewsForRecipe(recipe.id));
      setShowCount(5);
    } else {
      setReviews([]);
      setShowCount(5);
    }
  }, [recipe]);

  useEffect(() => {
    if (recipe) {
      setLikeCount(getLikeCount(recipe.id));
      setLiked(isLikedByMe(recipe.id));
      setComments(getCommentsForRecipe(recipe.id));
      setCommentsShow(5);
      setFollowing(isFollowing(chefId));
      setFollowers(getFollowerCount(chefId));
    } else {
      setComments([]);
      setCommentText('');
      setLikeCount(0);
      setLiked(false);
      setFollowing(false);
      setFollowers(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipe?.id, chefId]);

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

  const translated = useMemo(() => {
    if (!recipe) return null;
    if (lang && lang !== 'en') {
      return translateRecipe(recipe, lang);
    }
    return recipe;
  }, [recipe, lang]);

  if (!recipe) {
    return null;
  }

  const active = showOriginal || lang === 'en' ? recipe : (translated || recipe);

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={`Recipe details for ${String(recipe.title || '')}`} onClick={onClose}>
      <div className="modal" onClick={(e)=>e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span>{active.title || recipe.title}</span>
            {(summary.reviewCount > 0) && (
              <span className="tag" aria-label={`Average rating ${summary.averageRating} from ${summary.reviewCount} reviews`} style={{ background: 'rgba(37,99,235,0.08)', borderColor: 'color-mix(in oklab, var(--ocean-primary), var(--ocean-border))' }}>
                ⭐ {summary.averageRating} ({summary.reviewCount})
              </span>
            )}
            {Array.isArray(collectionChips) && collectionChips.length > 0 && (
              <>
                {collectionChips.map((c) => (
                  <span key={c.id} className="tag" title="Collection" style={{ background: 'rgba(37,99,235,0.06)', borderColor: 'color-mix(in oklab, var(--ocean-primary), var(--ocean-border))' }}>
                    📚 {c.name}
                  </span>
                ))}
              </>
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
            {(Number.isFinite(Number(recipe.calories)) || Number.isFinite(Number(recipe.protein))) && (
              <>
                {Number.isFinite(Number(recipe.calories)) && (
                  <span className="tag" aria-label={`Calories ${recipe.calories}`} style={{ background: 'rgba(37,99,235,0.08)', borderColor: 'color-mix(in oklab, var(--ocean-primary), var(--ocean-border))' }}>
                    🔥 {Number(recipe.calories)} kcal
                  </span>
                )}
                {Number.isFinite(Number(recipe.protein)) && (
                  <span className="tag" aria-label={`Protein ${recipe.protein} grams`} style={{ background: 'rgba(37,99,235,0.08)', borderColor: 'color-mix(in oklab, var(--ocean-primary), var(--ocean-border))' }}>
                    💪 {Number(recipe.protein)} g
                  </span>
                )}
              </>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <select
              aria-label={tUI('Language', lang)}
              value={lang}
              onChange={(e)=> setLang(e.target.value)}
              className="theme-toggle"
              style={{ padding: '6px 10px' }}
            >
              <option value="en">English</option>
              <option value="hi">हिन्दी</option>
              <option value="te">తెలుగు</option>
            </select>
            {lang !== 'en' && (
              <div
                className="alert"
                role="status"
                aria-live="polite"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: '#EFF6FF',
                  borderColor: '#BFDBFE',
                  color: '#111827'
                }}
              >
                {tUI('Translated from English', lang)}
                <button
                  className="theme-toggle"
                  onClick={() => setShowOriginal((s) => !s)}
                  aria-pressed={showOriginal}
                  style={{ background: 'rgba(245,158,11,0.20)' }}
                >
                  {showOriginal ? tUI('View translation', lang) : tUI('View original', lang)}
                </button>
              </div>
            )}
            <button
              aria-label={fav ? 'Remove from favorites' : 'Add to favorites'}
              title={fav ? 'Remove from favorites' : 'Add to favorites'}
              onClick={() => onToggleFavorite(recipe.id)}
              className="theme-toggle"
              style={{ padding: '6px 10px' }}
            >
              {fav ? '❤️ Favorited' : '💝 Favorite'}
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
              onClick={() => {
                const { liked: l, count } = toggleLike(recipe.id);
                setLiked(l); setLikeCount(count);
              }}
              aria-pressed={liked}
              aria-label={liked ? 'Unlike recipe' : 'Like recipe'}
              title={liked ? 'Unlike' : 'Like'}
              style={{ padding: '6px 10px', background: liked ? 'rgba(37,99,235,0.10)' : undefined }}
            >
              {liked ? '💙' : '🫶'} {likeCount > 0 ? likeCount : ''}
            </button>
            <button
              className="theme-toggle"
              onClick={async () => {
                const url = `${window.location.origin}${window.location.pathname}#/?id=${encodeURIComponent(String(recipe.id))}`;
                await shareRecipe({ title: recipe.title, text: 'Check out this recipe!', url });
              }}
              aria-label="Share recipe"
              title="Share"
              style={{ padding: '6px 10px' }}
            >
              🔗 Share
            </button>
            <span className="tag" aria-label={`Chef ${chefName}`} style={{ background: 'rgba(37,99,235,0.06)', borderColor: 'color-mix(in oklab, var(--ocean-primary), var(--ocean-border))' }}>
              👨‍🍳 {chefName} · {followers} followers
            </span>
            <button
              className="theme-toggle"
              onClick={() => { const now = toggleFollow(chefId); setFollowing(now); setFollowers(getFollowerCount(chefId)); }}
              aria-pressed={following}
              aria-label={following ? 'Unfollow chef' : 'Follow chef'}
              title={following ? 'Following' : 'Follow'}
              style={{ padding: '6px 10px', background: following ? 'rgba(37,99,235,0.10)' : undefined }}
            >
              {following ? 'Following' : 'Follow'}
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
            {extraActions.length > 0 && extraActions.map((a) => (
              <button key={a.key} className="theme-toggle" onClick={a.onClick} style={{ padding: '6px 10px', background: 'rgba(37,99,235,0.10)' }}>
                {a.label}
              </button>
            ))}
            <button className="modal-close" onClick={onClose} aria-label={tUI('Close', lang)}>✕</button>
          </div>
        </div>
        <div className="modal-body" role="document">
          <img
            className="detail-img"
            src={recipe.image || `https://source.unsplash.com/featured/800x400?recipe,food&sig=${recipe.id}`}
            alt={recipe.title || 'Recipe image'}
            onError={(e) => { e.currentTarget.src = `https://source.unsplash.com/featured/800x400?recipe,food&sig=${recipe.id}`; }}
          />
          {active.category && (
            <div className="taglist" style={{ marginTop: 8, marginBottom: 8 }}>
              <span
                className="tag"
                aria-label={`Category ${active.category}`}
                style={{
                  borderColor: 'color-mix(in oklab, var(--ocean-secondary), var(--ocean-border))',
                  background: 'rgba(245,158,11,0.10)',
                }}
              >
                {active.category}
              </span>
            </div>
          )}

          {active.description && <p className="card-desc" style={{marginBottom: 12}}>{active.description}</p>}

          {Array.isArray(active.dietTags) && active.dietTags.length > 0 && (
            <div className="taglist" style={{ marginBottom: 8 }}>
              {active.dietTags.map((t, i) => (
                <span key={i} className="tag" style={{ background: 'rgba(245,158,11,0.10)', borderColor: 'color-mix(in oklab, var(--ocean-secondary), var(--ocean-border))' }}>{t}</span>
              ))}
            </div>
          )}

          {Array.isArray(active.ingredients) && active.ingredients.length > 0 && (
            <>
              <div className="section-title">{tUI('Ingredients', lang)}</div>
              <ul className="list">
                {active.ingredients.map((ing, i) => (
                  <li key={i}>{typeof ing === 'string' ? ing : String(ing)}</li>
                ))}
              </ul>
            </>
          )}
          {!Array.isArray(active.ingredients) && typeof active.ingredients === 'string' && active.ingredients && (
            <>
              <div className="section-title">{tUI('Ingredients', lang)}</div>
              <p>{active.ingredients}</p>
            </>
          )}

          {(Array.isArray(active.steps) && active.steps.length > 0) && (
            <>
              <div className="section-title">{tUI('Instructions', lang)}</div>
              <ol className="list">
                {active.steps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
            </>
          )}
          {!Array.isArray(active.steps) && !Array.isArray(active.instructions) && (active.instructions || active.steps) && (
            <>
              <div className="section-title">{tUI('Instructions', lang)}</div>
              <p style={{ whiteSpace: 'pre-wrap' }}>{active.instructions || active.steps}</p>
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

          {/* Comments */}
          <div className="section-title" style={{ marginTop: 16 }}>Comments</div>
          {comments.slice(0, commentsShow).map((c) => (
            <div key={c.id} className="card" style={{ padding: 12, marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 700 }}>{c.authorName || 'Anonymous'}</span>
                  <span style={{ color: 'var(--ocean-muted)', fontSize: 12 }}>
                    {c.updatedAt ? new Date(c.updatedAt).toLocaleString() : ''}
                  </span>
                </div>
                {String(c.authorId) === String(getOrCreateCommunityUser().id) && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="theme-toggle" onClick={() => {
                      const text = window.prompt('Edit your comment', c.comment || '');
                      if (text != null) {
                        const next = editMyComment(c.id, String(text).slice(0, 1000));
                        setComments(next);
                      }
                    }}>
                      Edit
                    </button>
                    <button className="theme-toggle" style={{ background: 'rgba(239,68,68,0.12)', borderColor: 'color-mix(in oklab, var(--ocean-error), var(--ocean-border))' }}
                      onClick={() => {
                        const next = deleteMyComment(c.id);
                        setComments(next);
                      }}>
                      Delete
                    </button>
                  </div>
                )}
              </div>
              <p style={{ marginTop: 8, marginBottom: 0 }}>{c.comment}</p>
            </div>
          ))}
          {comments.length === 0 && <div className="alert">No comments yet. Be the first to comment.</div>}
          {comments.length > commentsShow && (
            <button className="theme-toggle" onClick={() => setCommentsShow((n) => n + 5)} style={{ marginBottom: 8 }}>
              Show more
            </button>
          )}

          <div className="card" style={{ padding: 12, marginTop: 8 }}>
            <div style={{ fontWeight: 800, marginBottom: 8 }}>Add a comment</div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const text = String(commentText || '').trim();
              if (!text) return;
              const next = addComment({ recipeId: recipe.id, text });
              setComments(next);
              setCommentText('');
            }} style={{ display: 'grid', gap: 10 }}>
              <label htmlFor="comment-text" style={{ fontWeight: 700, fontSize: 13 }}>Comment</label>
              <textarea
                id="comment-text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write your comment (max 1000 chars)"
                maxLength={1000}
                style={{ width: '100%', minHeight: 80, resize: 'vertical', border: '1px solid var(--ocean-border)', background: 'var(--ocean-surface)', color: 'var(--ocean-text)', borderRadius: 10, padding: '10px 12px' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="submit" className="theme-toggle" style={{ background: 'rgba(37,99,235,0.10)' }}>
                  Post Comment
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
