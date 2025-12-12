//
// Local storage helpers for Shopping List and Meal Plan
//

const STORAGE_KEYS = {
  shopping: 'app_shopping_list',
  mealPlan: 'app_meal_plan',
};

/**
 * Safe JSON.parse wrapper
 */
function safeParse(json, fallback) {
  try {
    const parsed = JSON.parse(json);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

/**
 * Read a namespaced key from localStorage
 * @param {'app_shopping_list'|'app_meal_plan'} key
 * @returns {any}
 */
export function readStorage(key) {
  const raw = window.localStorage.getItem(key);
  return safeParse(raw, null);
}

/**
 * Write a namespaced key to localStorage
 * @param {'app_shopping_list'|'app_meal_plan'} key
 * @param {any} value
 */
export function writeStorage(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // best-effort only
  }
}

export { STORAGE_KEYS };
