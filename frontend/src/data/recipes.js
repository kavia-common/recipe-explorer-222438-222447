const RECIPES_LS_KEY = 'app_recipes:v1';

/**
 * PUBLIC_INTERFACE
 * Return array of recipes stored in localStorage, or [].
 */
export function getLocalRecipes() {
  try {
    const json = window.localStorage.getItem(RECIPES_LS_KEY);
    const arr = json ? JSON.parse(json) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

/**
 * PUBLIC_INTERFACE
 * Persist recipes array to localStorage safely.
 */
export function setLocalRecipes(recipes) {
  try {
    const arr = Array.isArray(recipes) ? recipes : [];
    window.localStorage.setItem(RECIPES_LS_KEY, JSON.stringify(arr));
  } catch {
    // ignore storage errors
  }
}

/**
 * PUBLIC_INTERFACE
 * Generate a stable string id using timestamp and random segment.
 */
export function genId() {
  const ts = Date.now().toString(36);
  const rnd = Math.random().toString(36).slice(2, 7);
  return `${ts}-${rnd}`;
}

/**
 * PUBLIC_INTERFACE
 * Merge base recipes with local recipes from storage.
 * If ids overlap, local overrides.
 */
export function mergeWithLocal(baseRecipes) {
  const base = Array.isArray(baseRecipes) ? baseRecipes : [];
  const local = getLocalRecipes();
  if (!local.length) return base;

  const map = new Map();
  for (const r of base) map.set(String(r.id), r);
  for (const lr of local) map.set(String(lr.id), lr); // local overrides
  return Array.from(map.values());
}

/**
 * PUBLIC_INTERFACE
 * Upsert a recipe into local storage by id. Returns updated array.
 */
export function upsertLocalRecipe(recipe) {
  const arr = getLocalRecipes();
  const idKey = String(recipe.id);
  const idx = arr.findIndex((r) => String(r.id) === idKey);
  if (idx >= 0) {
    arr[idx] = recipe;
  } else {
    arr.push(recipe);
  }
  setLocalRecipes(arr);
  return arr;
}

/**
 * PUBLIC_INTERFACE
 * Delete a recipe id from local storage. Returns updated array.
 */
export function deleteLocalRecipe(id) {
  const idKey = String(id);
  const arr = getLocalRecipes().filter((r) => String(r.id) !== idKey);
  setLocalRecipes(arr);
  return arr;
}
