const LS_KEY = 'favoriteRecipeIds:v1';

/**
 * Get the set of favorite recipe IDs from localStorage.
 * PUBLIC_INTERFACE
 */
export function getFavoriteIds() {
  try {
    const json = window.localStorage.getItem(LS_KEY);
    const arr = json ? JSON.parse(json) : [];
    if (!Array.isArray(arr)) return [];
    return arr.filter((v) => typeof v === 'number' || typeof v === 'string');
  } catch {
    return [];
  }
}

/**
 * Save favorite IDs to localStorage.
 * PUBLIC_INTERFACE
 */
export function setFavoriteIds(ids) {
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(Array.from(new Set(ids))));
  } catch {
    // ignore storage failures
  }
}

/**
 * Toggle a recipe ID in favorites and persist.
 * Returns the updated array.
 * PUBLIC_INTERFACE
 */
export function toggleFavorite(id) {
  const current = getFavoriteIds();
  const exists = current.includes(id);
  const next = exists ? current.filter((x) => x !== id) : [...current, id];
  setFavoriteIds(next);
  return next;
}

/**
 * Check if an id is in favorites.
 * PUBLIC_INTERFACE
 */
export function isFavorite(id) {
  const current = getFavoriteIds();
  return current.includes(id);
}
