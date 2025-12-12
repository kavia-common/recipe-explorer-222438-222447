//
// Client-side Recipe Collections: localStorage persistence and helpers
//

const COLLECTIONS_KEY = 'app_collections';
const MEMBERS_KEY = 'app_collection_members';

/**
 * Read JSON from localStorage safely
 */
function safeRead(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

/**
 * Write JSON to localStorage safely
 */
function safeWrite(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // best-effort only
  }
}

/**
 * INTERNAL: load collections array
 */
function loadCollections() {
  const arr = safeRead(COLLECTIONS_KEY, []);
  return Array.isArray(arr) ? arr : [];
}

/**
 * INTERNAL: persist collections array
 */
function saveCollections(arr) {
  const list = Array.isArray(arr) ? arr : [];
  safeWrite(COLLECTIONS_KEY, list);
}

/**
 * INTERNAL: load membership map { [collectionId]: string[]recipeIds }
 */
function loadMembers() {
  const obj = safeRead(MEMBERS_KEY, {});
  return obj && typeof obj === 'object' ? obj : {};
}

/**
 * INTERNAL: persist membership map
 */
function saveMembers(map) {
  const obj = map && typeof map === 'object' ? map : {};
  safeWrite(MEMBERS_KEY, obj);
}

/**
 * PUBLIC_INTERFACE
 * Generate id
 */
export function genCollectionId() {
  const ts = Date.now().toString(36);
  const rnd = Math.random().toString(36).slice(2, 7);
  return `c_${ts}_${rnd}`;
}

/**
 * PUBLIC_INTERFACE
 * List collections (with count field derived).
 */
export function listCollections() {
  const cols = loadCollections();
  const members = loadMembers();
  return cols.map((c) => ({
    ...c,
    count: Array.isArray(members[String(c.id)]) ? members[String(c.id)].length : 0,
  }));
}

/**
 * PUBLIC_INTERFACE
 * Create a new collection
 */
export function createCollection(name, description = '') {
  const now = new Date().toISOString();
  const cols = loadCollections();
  const id = genCollectionId();
  const model = { id, name: String(name || 'Untitled'), description: String(description || ''), createdAt: now, updatedAt: now };
  saveCollections([model, ...cols]);
  const members = loadMembers();
  if (!Array.isArray(members[id])) members[id] = [];
  saveMembers(members);
  return model;
}

/**
 * PUBLIC_INTERFACE
 * Rename/update description for a collection by id.
 */
export function renameCollection(id, name, description = undefined) {
  const cols = loadCollections();
  const idKey = String(id);
  const idx = cols.findIndex((c) => String(c.id) === idKey);
  if (idx < 0) return cols;
  const now = new Date().toISOString();
  const next = [...cols];
  next[idx] = {
    ...next[idx],
    name: name != null ? String(name) : next[idx].name,
    description: description != null ? String(description) : next[idx].description,
    updatedAt: now,
  };
  saveCollections(next);
  return next[idx];
}

/**
 * PUBLIC_INTERFACE
 * Delete a collection and its memberships.
 */
export function deleteCollection(id) {
  const idKey = String(id);
  const cols = loadCollections().filter((c) => String(c.id) !== idKey);
  saveCollections(cols);
  const members = loadMembers();
  if (members[idKey]) {
    delete members[idKey];
    saveMembers(members);
  }
  return cols;
}

/**
 * PUBLIC_INTERFACE
 * Add a recipeId to a collection
 */
export function addRecipeToCollection(collectionId, recipeId) {
  const idKey = String(collectionId);
  const rid = String(recipeId);
  const members = loadMembers();
  const arr = Array.isArray(members[idKey]) ? members[idKey] : [];
  if (!arr.includes(rid)) {
    members[idKey] = [...arr, rid];
    saveMembers(members);
    // bump updatedAt
    const cols = loadCollections();
    const idx = cols.findIndex((c) => String(c.id) === idKey);
    if (idx >= 0) {
      const next = [...cols];
      next[idx] = { ...next[idx], updatedAt: new Date().toISOString() };
      saveCollections(next);
    }
  }
  return members[idKey] || [];
}

/**
 * PUBLIC_INTERFACE
 * Remove a recipeId from a collection
 */
export function removeRecipeFromCollection(collectionId, recipeId) {
  const idKey = String(collectionId);
  const rid = String(recipeId);
  const members = loadMembers();
  const arr = Array.isArray(members[idKey]) ? members[idKey] : [];
  const next = arr.filter((x) => String(x) !== rid);
  members[idKey] = next;
  saveMembers(members);
  // bump updatedAt
  const cols = loadCollections();
  const idx = cols.findIndex((c) => String(c.id) === idKey);
  if (idx >= 0) {
    const upd = [...cols];
    upd[idx] = { ...upd[idx], updatedAt: new Date().toISOString() };
    saveCollections(upd);
  }
  return next;
}

/**
 * PUBLIC_INTERFACE
 * Get array of recipeIds for a collection
 */
export function getCollectionRecipes(collectionId) {
  const idKey = String(collectionId);
  const members = loadMembers();
  const arr = Array.isArray(members[idKey]) ? members[idKey] : [];
  return arr.slice();
}

/**
 * PUBLIC_INTERFACE
 * Get array of collections a recipe belongs to
 */
export function getRecipeCollections(recipeId) {
  const rid = String(recipeId);
  const cols = loadCollections();
  const members = loadMembers();
  const result = [];
  for (const c of cols) {
    const ids = Array.isArray(members[String(c.id)]) ? members[String(c.id)] : [];
    if (ids.includes(rid)) result.push(c);
  }
  return result;
}
