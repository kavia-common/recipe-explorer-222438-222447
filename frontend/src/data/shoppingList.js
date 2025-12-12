//
// Shopping List data model and helpers
//
import { readStorage, writeStorage, STORAGE_KEYS } from './storage';

// PUBLIC_INTERFACE
export function getShoppingList() {
  /** Returns the full shopping list array from localStorage. */
  const data = readStorage(STORAGE_KEYS.shopping);
  if (!Array.isArray(data)) return [];
  return data;
}

// PUBLIC_INTERFACE
export function setShoppingList(items) {
  /** Overwrites shopping list in localStorage with provided array. */
  writeStorage(STORAGE_KEYS.shopping, Array.isArray(items) ? items : []);
}

// PUBLIC_INTERFACE
export function addShoppingItem({ name, quantity = '', unit = '', recipeId = null }) {
  /** Adds a single shopping item and persists. Returns created item. */
  const list = getShoppingList();
  const item = {
    id: crypto.randomUUID(),
    name: String(name || '').trim(),
    quantity: String(quantity || ''),
    unit: String(unit || ''),
    recipeId: recipeId ?? null,
    purchased: false,
    addedAt: new Date().toISOString(),
  };
  setShoppingList([item, ...list]);
  return item;
}

// PUBLIC_INTERFACE
export function updateShoppingItem(id, patch) {
  /** Updates fields for item with id. */
  const list = getShoppingList();
  const next = list.map((it) => (it.id === id ? { ...it, ...patch } : it));
  setShoppingList(next);
}

// PUBLIC_INTERFACE
export function removeShoppingItem(id) {
  /** Removes item by id. */
  const list = getShoppingList();
  setShoppingList(list.filter((it) => it.id !== id));
}

// PUBLIC_INTERFACE
export function togglePurchased(id) {
  /** Toggles purchased flag for an item by id. */
  const list = getShoppingList();
  const next = list.map((it) => (it.id === id ? { ...it, purchased: !it.purchased } : it));
  setShoppingList(next);
}

// PUBLIC_INTERFACE
export function clearPurchased() {
  /** Removes all purchased items from list. */
  const list = getShoppingList();
  setShoppingList(list.filter((it) => !it.purchased));
}

/**
 * Normalize a single ingredient value (string).
 * Lowercase for key, Title Case for display.
 */
export function normalizeIngredientName(str) {
  const s = String(str || '').trim();
  const lowered = s.toLowerCase();
  const title = lowered.replace(/\b\w/g, (m) => m.toUpperCase());
  return { key: lowered, display: title };
}

/**
 * Parse ingredients which may be:
 * - array of strings
 * - single string separated by commas or newlines
 * - array of objects { name, quantity, unit }
 */
export function parseIngredients(raw) {
  if (!raw) return [];
  let items = [];
  if (Array.isArray(raw)) {
    items = raw;
  } else if (typeof raw === 'string') {
    items = raw
      .split(/[\n,]/g)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  } else {
    return [];
  }

  // Normalize to { name, quantity, unit }
  return items
    .map((it) => {
      if (typeof it === 'string') {
        return { name: it, quantity: '', unit: '' };
      }
      if (it && typeof it === 'object') {
        return {
          name: String(it.name || '').trim(),
          quantity: String(it.quantity ?? '').trim(),
          unit: String(it.unit ?? '').trim(),
        };
      }
      return null;
    })
    .filter(Boolean)
    .filter((it) => it.name.length > 0);
}

/**
 * Merge duplicates by normalized name; sum numeric-like quantities else keep non-empty latest.
 */
export function mergeIngredients(ings) {
  const map = new Map(); // key -> { nameDisplay, quantity, unit }
  for (const ing of ings) {
    const { key, display } = normalizeIngredientName(ing.name);
    const prev = map.get(key);
    const qtyNum = parseFloat(String(ing.quantity).replace(',', '.'));
    const isNum = !Number.isNaN(qtyNum) && String(ing.quantity).trim() !== '';

    if (!prev) {
      map.set(key, {
        nameDisplay: display,
        quantity: ing.quantity || '',
        unit: ing.unit || '',
      });
    } else {
      // merge
      let quantity = prev.quantity;
      let unit = prev.unit;

      const prevNum = parseFloat(String(prev.quantity).replace(',', '.'));
      const prevIsNum = !Number.isNaN(prevNum) && String(prev.quantity).trim() !== '';

      if (isNum && prevIsNum && (!ing.unit || ing.unit === prev.unit)) {
        // sum numbers when units match or absent
        const sum = prevNum + qtyNum;
        quantity = String(sum);
      } else if (String(ing.quantity).trim()) {
        // take latest non-empty quantity/unit
        quantity = ing.quantity;
        if (ing.unit) unit = ing.unit;
      }

      map.set(key, { nameDisplay: display, quantity, unit });
    }
  }

  return Array.from(map.entries()).map(([key, v]) => ({
    key,
    display: v.nameDisplay,
    quantity: v.quantity,
    unit: v.unit,
  }));
}

// PUBLIC_INTERFACE
export function addRecipeIngredientsToShoppingList(recipe) {
  /** Adds all ingredients from a recipe to the shopping list (merged). */
  if (!recipe) return [];

  const parsed = parseIngredients(recipe.ingredients);
  if (parsed.length === 0) return [];

  const merged = mergeIngredients(parsed);
  const existing = getShoppingList();

  // Insert merged items referencing recipeId
  const newItems = merged.map((m) => ({
    id: crypto.randomUUID(),
    name: m.display,
    quantity: m.quantity || '',
    unit: m.unit || '',
    recipeId: recipe.id ?? null,
    purchased: false,
    addedAt: new Date().toISOString(),
  }));

  setShoppingList([...newItems, ...existing]);
  return newItems;
}
