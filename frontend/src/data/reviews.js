const REVIEWS_LS_KEY = 'app_reviews:v1';
const USER_ID_LS_KEY = 'app_user_id:v1';
const USER_NAME_LS_KEY = 'app_user_name:v1';

/**
 * PUBLIC_INTERFACE
 * Get or create a stable local user id and optional display name.
 */
export function getOrCreateUser() {
  try {
    let id = window.localStorage.getItem(USER_ID_LS_KEY);
    if (!id) {
      id = genUUID();
      window.localStorage.setItem(USER_ID_LS_KEY, id);
    }
    const name = window.localStorage.getItem(USER_NAME_LS_KEY) || '';
    return { id, name };
  } catch {
    // fallback ephemeral id
    return { id: genUUID(), name: '' };
  }
}

/**
 * PUBLIC_INTERFACE
 * Set/update local display name.
 */
export function setUserDisplayName(name) {
  try {
    window.localStorage.setItem(USER_NAME_LS_KEY, String(name || ''));
  } catch {
    // ignore
  }
}

/**
 * PUBLIC_INTERFACE
 * Read all reviews array from storage.
 */
export function getAllReviews() {
  try {
    const raw = window.localStorage.getItem(REVIEWS_LS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

/**
 * PUBLIC_INTERFACE
 * Persist all reviews.
 */
export function setAllReviews(reviews) {
  try {
    const arr = Array.isArray(reviews) ? reviews : [];
    window.localStorage.setItem(REVIEWS_LS_KEY, JSON.stringify(arr));
  } catch {
    // ignore
  }
}

/**
 * PUBLIC_INTERFACE
 * Get reviews for a specific recipe id.
 */
export function getReviewsForRecipe(recipeId) {
  const idKey = String(recipeId);
  return getAllReviews().filter(r => String(r.recipeId) === idKey);
}

/**
 * PUBLIC_INTERFACE
 * Compute average rating and review count for a recipe.
 */
export function getRatingSummary(recipeId) {
  const list = getReviewsForRecipe(recipeId);
  const count = list.length;
  if (!count) return { averageRating: 0, reviewCount: 0 };
  const avg = list.reduce((a, b) => a + Number(b.rating || 0), 0) / count;
  return { averageRating: Math.round(avg * 10) / 10, reviewCount: count };
}

/**
 * PUBLIC_INTERFACE
 * Upsert a review by the current user for a recipe. Only one per user per recipe.
 * Input shape: { recipeId, rating:1-5, comment }
 */
export function upsertMyReview({ recipeId, rating, comment }) {
  const r = clampRating(rating);
  const user = getOrCreateUser();
  const now = new Date().toISOString();
  const all = getAllReviews();
  const idx = all.findIndex(
    (rev) => String(rev.recipeId) === String(recipeId) && String(rev.authorId) === String(user.id)
  );
  if (idx >= 0) {
    all[idx] = {
      ...all[idx],
      rating: r,
      comment: truncateComment(comment),
      authorName: user.name || all[idx].authorName || '',
      updatedAt: now,
    };
  } else {
    all.push({
      id: genUUID(),
      recipeId,
      authorId: user.id,
      authorName: user.name || '',
      rating: r,
      comment: truncateComment(comment),
      createdAt: now,
      updatedAt: now,
    });
  }
  setAllReviews(all);
  return getReviewsForRecipe(recipeId);
}

/**
 * PUBLIC_INTERFACE
 * Delete my review for a recipe.
 */
export function deleteMyReview(recipeId) {
  const user = getOrCreateUser();
  const all = getAllReviews();
  const next = all.filter(
    (rev) => !(String(rev.recipeId) === String(recipeId) && String(rev.authorId) === String(user.id))
  );
  setAllReviews(next);
  return getReviewsForRecipe(recipeId);
}

/**
 * PUBLIC_INTERFACE
 * Remove all reviews for a specific recipe (called when recipe is deleted/rejected).
 */
export function purgeReviewsForRecipe(recipeId) {
  const idKey = String(recipeId);
  const after = getAllReviews().filter((r) => String(r.recipeId) !== idKey);
  setAllReviews(after);
}

/**
 * PUBLIC_INTERFACE
 * Compute analytics across recipes:
 * - averageRatingAcrossApproved
 * - ratingDistribution {1..5}
 * - map { recipeId -> { averageRating, reviewCount } }
 */
export function computeRatingsAnalytics(recipes) {
  const all = getAllReviews();
  const approvedIds = new Set(
    (Array.isArray(recipes) ? recipes : [])
      .filter((r) => (r.status || 'approved') === 'approved')
      .map((r) => String(r.id))
  );

  // per recipe summary
  const perRecipe = new Map();
  for (const id of approvedIds) {
    const list = all.filter((rev) => String(rev.recipeId) === id);
    const count = list.length;
    const avg =
      count > 0 ? Math.round((list.reduce((a, b) => a + Number(b.rating || 0), 0) / count) * 10) / 10 : 0;
    perRecipe.set(id, { averageRating: avg, reviewCount: count });
  }

  // average rating across approved recipes with at least 1 review
  const withReviews = Array.from(perRecipe.values()).filter((s) => s.reviewCount > 0);
  const averageRatingAcrossApproved =
    withReviews.length > 0
      ? Math.round((withReviews.reduce((a, b) => a + b.averageRating, 0) / withReviews.length) * 10) / 10
      : 0;

  // distribution of individual review ratings (1..5)
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const rev of all) {
    const n = Number(rev.rating);
    if (n >= 1 && n <= 5) distribution[n] += 1;
  }

  return { perRecipe, averageRatingAcrossApproved, ratingDistribution: distribution };
}

/**
 * Truncate comment to 1000 chars.
 */
function truncateComment(s) {
  const str = String(s || '');
  return str.length > 1000 ? str.slice(0, 1000) : str;
}

function clampRating(r) {
  const n = Number(r);
  if (!Number.isFinite(n)) return 0;
  return Math.min(5, Math.max(1, Math.round(n)));
}

function genUUID() {
  // lightweight uuid-ish
  return 'r-' + Math.random().toString(36).slice(2) + '-' + Date.now().toString(36);
}
