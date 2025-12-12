import { getLocalRecipes, setLocalRecipes, upsertLocalRecipe, deleteLocalRecipe } from './recipes';
import { getFavoriteIds, setFavoriteIds } from './favorites';

export const RECIPE_STATUS = {
  APPROVED: 'approved',
  PENDING: 'pending',
  REJECTED: 'rejected',
};

export const RECIPE_SOURCE = {
  MOCK: 'mock',
  USER: 'user',
};

/**
 * PUBLIC_INTERFACE
 * Normalize a recipe object ensuring admin-required fields exist.
 */
export function normalizeAdminFields(recipe, { defaultStatus = RECIPE_STATUS.PENDING, source = RECIPE_SOURCE.USER, submittedBy = 'user' } = {}) {
  const now = new Date().toISOString();
  const r = { ...recipe };
  r.source = r.source || source;
  r.status = r.status || defaultStatus;
  r.submittedBy = r.submittedBy || submittedBy;
  r.createdAt = r.createdAt || now;
  r.updatedAt = now;
  return r;
}

/**
 * PUBLIC_INTERFACE
 * Return all recipes visible anywhere (mock+local merged should already be applied upstream).
 * Here we only operate on local storage set, which is the authoritative for mutations.
 */
export function getAllStoredRecipes() {
  return getLocalRecipes();
}

/**
 * PUBLIC_INTERFACE
 * Get recipes visible to main feed = only approved
 */
export function getApprovedRecipes(recipesArray) {
  const arr = Array.isArray(recipesArray) ? recipesArray : [];
  return arr.filter((r) => (r.status || RECIPE_STATUS.APPROVED) === RECIPE_STATUS.APPROVED);
}

/**
 * PUBLIC_INTERFACE
 * Get pending recipes for approvals page.
 */
export function getPendingRecipes(recipesArray) {
  const arr = Array.isArray(recipesArray) ? recipesArray : [];
  return arr.filter((r) => r.status === RECIPE_STATUS.PENDING);
}

/**
 * PUBLIC_INTERFACE
 * Approve a recipe by id (mutates localStorage).
 */
export function approveRecipe(id) {
  const arr = getLocalRecipes();
  const idx = arr.findIndex((r) => String(r.id) === String(id));
  if (idx >= 0) {
    arr[idx] = { ...arr[idx], status: RECIPE_STATUS.APPROVED, updatedAt: new Date().toISOString() };
    setLocalRecipes(arr);
  }
  return arr;
}

/**
 * PUBLIC_INTERFACE
 * Reject a recipe by id (delete for simplicity). Also cleanup favorites.
 */
export function rejectRecipe(id) {
  const idKey = String(id);
  const next = getLocalRecipes().filter((r) => String(r.id) !== idKey);
  setLocalRecipes(next);
  // cleanup favorites if needed
  const favs = getFavoriteIds();
  if (favs.includes(id)) {
    setFavoriteIds(favs.filter((fid) => String(fid) !== idKey));
  }
  return next;
}

/**
 * PUBLIC_INTERFACE
 * Upsert a recipe as admin. Allows setting status via editor UI.
 */
export function adminUpsert(recipeDraft) {
  const draft = { ...recipeDraft };
  draft.updatedAt = new Date().toISOString();
  if (!draft.createdAt) draft.createdAt = draft.updatedAt;
  if (!draft.source) draft.source = RECIPE_SOURCE.USER;
  if (!draft.status) draft.status = RECIPE_STATUS.APPROVED;
  upsertLocalRecipe(draft);
  return getLocalRecipes();
}

/**
 * PUBLIC_INTERFACE
 * Delete by id and cleanup favorites.
 */
export function hardDeleteRecipe(id) {
  const idKey = String(id);
  deleteLocalRecipe(idKey);
  const favs = getFavoriteIds();
  if (favs.includes(id)) {
    setFavoriteIds(favs.filter((fid) => String(fid) !== idKey));
  }
  return getLocalRecipes();
}

/**
 * PUBLIC_INTERFACE
 * Compute analytics metrics.
 */
export function computeAnalytics(recipesArray) {
  const arr = Array.isArray(recipesArray) ? recipesArray : [];
  const total = arr.length;
  const approved = arr.filter((r) => r.status === RECIPE_STATUS.APPROVED).length;
  const pending = arr.filter((r) => r.status === RECIPE_STATUS.PENDING).length;

  const categories = ['Veg', 'Non-Veg', 'Desserts', 'Drinks'];
  const categoryCounts = categories.reduce((acc, c) => {
    acc[c] = arr.filter((r) => (r.category || '').toLowerCase() === c.toLowerCase()).length;
    return acc;
  }, {});

  const favIds = new Set(getFavoriteIds());
  let favoritesTotal = 0;
  const favMap = new Map();
  for (const r of arr) {
    if (favIds.has(r.id)) {
      favoritesTotal += 1;
      favMap.set(String(r.id), r);
    }
  }
  const topFavorited = Array.from(favMap.values()).slice(0, 5);

  const recentlyAdded = [...arr]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 5);

  // Difficulty distribution
  const diffKeys = ['Easy','Medium','Hard'];
  const difficultyCounts = diffKeys.reduce((acc, d) => {
    acc[d] = arr.filter((r) => (r.difficulty || 'Medium') === d).length;
    return acc;
  }, {});
  // Average cooking time
  const times = arr
    .map((r) => Number(r.cookingTime))
    .filter((n) => Number.isFinite(n) && n >= 0);
  const averageCookingTime = times.length ? Math.round(times.reduce((a,b)=>a+b,0) / times.length) : 0;

  return { total, approved, pending, categoryCounts, favoritesTotal, topFavorited, recentlyAdded, difficultyCounts, averageCookingTime };
}
