//
// Weekly Meal Plan helpers (client-side only)
//
import { readStorage, writeStorage, STORAGE_KEYS } from './storage';
import { parseIngredients, mergeIngredients } from './shoppingList';

/**
 * Compute week start (Monday) for provided date (Date or ISO string).
 */
export function getWeekStartMondayISO(dateLike = new Date()) {
  const d = new Date(dateLike);
  // Make Monday the first day: (0=Sun -> 6), (1=Mon -> 0), ...
  const day = (d.getDay() + 6) % 7;
  const monday = new Date(d);
  monday.setDate(d.getDate() - day);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().slice(0, 10);
}

export const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

// PUBLIC_INTERFACE
export function loadMealPlanForWeek(weekStartISO) {
  /** Loads the plan map from storage and returns the plan for a given weekStartISO. */
  const all = readStorage(STORAGE_KEYS.mealPlan) || {};
  const plan = all[weekStartISO];
  if (plan && plan.weekStartISO === weekStartISO) return plan;
  return {
    weekStartISO,
    days: {
      mon: [],
      tue: [],
      wed: [],
      thu: [],
      fri: [],
      sat: [],
      sun: [],
    },
  };
}

// PUBLIC_INTERFACE
export function saveMealPlanForWeek(plan) {
  /** Persists the provided plan into storage keyed by weekStartISO. */
  const all = readStorage(STORAGE_KEYS.mealPlan) || {};
  all[plan.weekStartISO] = plan;
  writeStorage(STORAGE_KEYS.mealPlan, all);
}

// PUBLIC_INTERFACE
export function addRecipeToDay(weekStartISO, dayKey, recipe) {
  /** Adds a recipe entry to a day in the weekly plan. */
  const plan = loadMealPlanForWeek(weekStartISO);
  if (!plan.days[dayKey]) plan.days[dayKey] = [];
  const entry = {
    id: crypto.randomUUID(),
    recipeId: recipe?.id ?? null,
    title: recipe?.title ?? 'Untitled',
    category: recipe?.category ?? '',
    cookingTime: recipe?.cookingTime ?? recipe?.time ?? '',
    difficulty: recipe?.difficulty ?? '',
  };
  plan.days[dayKey] = [entry, ...plan.days[dayKey]];
  saveMealPlanForWeek(plan);
  return entry;
}

// PUBLIC_INTERFACE
export function removeRecipeFromDay(weekStartISO, dayKey, entryId) {
  /** Removes a recipe entry from a day by entry id. */
  const plan = loadMealPlanForWeek(weekStartISO);
  if (!plan.days[dayKey]) return;
  plan.days[dayKey] = plan.days[dayKey].filter((it) => it.id !== entryId);
  saveMealPlanForWeek(plan);
}

// PUBLIC_INTERFACE
export function clearDay(weekStartISO, dayKey) {
  /** Clears all entries for a day. */
  const plan = loadMealPlanForWeek(weekStartISO);
  plan.days[dayKey] = [];
  saveMealPlanForWeek(plan);
}

/**
 * Aggregate ingredients for a list of recipes (handles missing ingredients gracefully).
 */
export function aggregateIngredientsFromRecipes(recipes) {
  const raw = [];
  for (const r of recipes || []) {
    const parsed = parseIngredients(r?.ingredients);
    raw.push(...parsed);
  }
  return mergeIngredients(raw);
}
