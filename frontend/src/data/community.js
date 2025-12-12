//
// Community features: identity, comments, likes, follows (client-side, localStorage)
// Ocean Professional theme friendly helpers
//

// Storage keys
export const COMMUNITY_KEYS = {
  comments: 'app_comments:v1',
  likes: 'app_likes:v1',
  follows: 'app_follows:v1',
  userId: 'app_user_id:v2',          // align with reviews if present but namespaced
  userProfile: 'app_user_profile:v1', // { id, displayName }
};

// PUBLIC_INTERFACE
export function getOrCreateCommunityUser() {
  /** Returns { id, displayName } ensuring a stable user id is persisted. */
  try {
    let profileRaw = window.localStorage.getItem(COMMUNITY_KEYS.userProfile);
    let profile = profileRaw ? JSON.parse(profileRaw) : null;

    if (profile && profile.id) {
      return { id: String(profile.id), displayName: String(profile.displayName || '') };
    }

    // Backward compat with reviews user id/name if present
    let id = window.localStorage.getItem('app_user_id:v1') || window.localStorage.getItem('app_user_id') || null;
    let name = window.localStorage.getItem('app_user_name:v1') || window.localStorage.getItem('app_user_name') || '';

    if (!id) id = genUUID();
    profile = { id, displayName: name || '' };
    window.localStorage.setItem(COMMUNITY_KEYS.userProfile, JSON.stringify(profile));
    return profile;
  } catch {
    // ephemeral fallback
    return { id: genUUID(), displayName: '' };
  }
}

// PUBLIC_INTERFACE
export function setCommunityDisplayName(displayName) {
  /** Updates user profile displayName in storage. */
  try {
    const current = getOrCreateCommunityUser();
    const next = { ...current, displayName: String(displayName || '') };
    window.localStorage.setItem(COMMUNITY_KEYS.userProfile, JSON.stringify(next));
    // Keep legacy name in sync for reviews integration
    try { window.localStorage.setItem('app_user_name:v1', String(displayName || '')); } catch {}
    return next;
  } catch {
    return null;
  }
}

// ---------- Comments ----------

// Shape: { id, recipeId, authorId, authorName?, comment, createdAt, updatedAt }

// PUBLIC_INTERFACE
export function getAllComments() {
  /** Returns array of all comments. */
  try {
    const raw = window.localStorage.getItem(COMMUNITY_KEYS.comments);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

// PUBLIC_INTERFACE
export function setAllComments(comments) {
  /** Persists full comments array to storage. */
  try {
    window.localStorage.setItem(COMMUNITY_KEYS.comments, JSON.stringify(Array.isArray(comments) ? comments : []));
  } catch {
    // ignore
  }
}

// PUBLIC_INTERFACE
export function getCommentsForRecipe(recipeId) {
  /** Returns sorted comments for a recipe (newest first). */
  const idKey = String(recipeId);
  const list = getAllComments().filter(c => String(c.recipeId) === idKey);
  return list.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
}

// PUBLIC_INTERFACE
export function addComment({ recipeId, text }) {
  /** Adds a comment as current user; returns updated comments for recipe. */
  const user = getOrCreateCommunityUser();
  const now = new Date().toISOString();
  const trimmed = String(text || '').slice(0, 1000);
  const next = [...getAllComments(), {
    id: genUUID(),
    recipeId,
    authorId: user.id,
    authorName: user.displayName || '',
    comment: trimmed,
    createdAt: now,
    updatedAt: now,
  }];
  setAllComments(next);
  return getCommentsForRecipe(recipeId);
}

// PUBLIC_INTERFACE
export function editMyComment(commentId, newText) {
  /** Edits a comment if current user is the author. Returns updated comments for that recipe. */
  const me = getOrCreateCommunityUser();
  const all = getAllComments();
  const idx = all.findIndex(c => String(c.id) === String(commentId));
  if (idx === -1) return all;
  const c = all[idx];
  if (String(c.authorId) !== String(me.id)) return getCommentsForRecipe(c.recipeId);
  const now = new Date().toISOString();
  all[idx] = { ...c, comment: String(newText || '').slice(0, 1000), updatedAt: now, authorName: me.displayName || c.authorName || '' };
  setAllComments(all);
  return getCommentsForRecipe(c.recipeId);
}

// PUBLIC_INTERFACE
export function deleteMyComment(commentId) {
  /** Deletes a comment if current user is the author. Returns updated comments for the recipe. */
  const me = getOrCreateCommunityUser();
  const all = getAllComments();
  const idx = all.findIndex(c => String(c.id) === String(commentId));
  if (idx === -1) return all;
  const c = all[idx];
  if (String(c.authorId) !== String(me.id)) return getCommentsForRecipe(c.recipeId);
  const next = all.filter((_, i) => i !== idx);
  setAllComments(next);
  return getCommentsForRecipe(c.recipeId);
}

// PUBLIC_INTERFACE
export function purgeCommentsForRecipe(recipeId) {
  /** Remove all comments for a recipe (on delete/reject). */
  const idKey = String(recipeId);
  const next = getAllComments().filter(c => String(c.recipeId) !== idKey);
  setAllComments(next);
}

// ---------- Likes ----------

// Shape: app_likes: { [userId]: { [recipeId]: true } }

// PUBLIC_INTERFACE
export function getLikesState() {
  /** Returns entire likes state object. */
  try {
    const raw = window.localStorage.getItem(COMMUNITY_KEYS.likes);
    const obj = raw ? JSON.parse(raw) : {};
    return isPlainObject(obj) ? obj : {};
  } catch {
    return {};
  }
}

// PUBLIC_INTERFACE
export function setLikesState(state) {
  /** Persists the entire likes state object. */
  try {
    window.localStorage.setItem(COMMUNITY_KEYS.likes, JSON.stringify(isPlainObject(state) ? state : {}));
  } catch {
    // ignore
  }
}

// PUBLIC_INTERFACE
export function toggleLike(recipeId) {
  /** Toggle like for current user; returns { liked: boolean, count: number } */
  const me = getOrCreateCommunityUser();
  const all = getLikesState();
  const u = all[me.id] || {};
  const idKey = String(recipeId);
  if (u[idKey]) delete u[idKey];
  else u[idKey] = true;
  all[me.id] = u;
  setLikesState(all);
  return { liked: !!u[idKey], count: getLikeCount(recipeId) };
}

// PUBLIC_INTERFACE
export function isLikedByMe(recipeId) {
  /** Returns if current user liked recipe. */
  const me = getOrCreateCommunityUser();
  const all = getLikesState();
  return !!(all?.[me.id]?.[String(recipeId)]);
}

// PUBLIC_INTERFACE
export function getLikeCount(recipeId) {
  /** Returns total like count across all users for a recipe. */
  const idKey = String(recipeId);
  const all = getLikesState();
  let count = 0;
  for (const uid of Object.keys(all)) {
    if (all[uid] && all[uid][idKey]) count += 1;
  }
  return count;
}

// PUBLIC_INTERFACE
export function purgeLikesForRecipe(recipeId) {
  /** Removes all likes for a recipe across all users (on delete/reject). */
  const idKey = String(recipeId);
  const all = getLikesState();
  let changed = false;
  for (const uid of Object.keys(all)) {
    if (all[uid] && all[uid][idKey]) {
      delete all[uid][idKey];
      changed = true;
    }
  }
  if (changed) setLikesState(all);
}

// ---------- Follows / Chefs ----------

// Shape: app_follows { [userId]: { followingChefIds: string[] } }
// Chef id strategy: prefer recipe.submittedBy or recipe.authorId; else generate pseudo stable id from recipeId prefix.

function getFollowsState() {
  try {
    const raw = window.localStorage.getItem(COMMUNITY_KEYS.follows);
    const obj = raw ? JSON.parse(raw) : {};
    return isPlainObject(obj) ? obj : {};
  } catch {
    return {};
  }
}
function setFollowsState(state) {
  try {
    window.localStorage.setItem(COMMUNITY_KEYS.follows, JSON.stringify(isPlainObject(state) ? state : {}));
  } catch {}
}

// PUBLIC_INTERFACE
export function toggleFollow(chefId) {
  /** Toggle follow a chef by current user; returns boolean following. */
  const me = getOrCreateCommunityUser();
  const all = getFollowsState();
  const current = all[me.id]?.followingChefIds || [];
  const set = new Set(current.map(String));
  const key = String(chefId);
  if (set.has(key)) set.delete(key); else set.add(key);
  const next = Array.from(set);
  all[me.id] = { followingChefIds: next };
  setFollowsState(all);
  return next.includes(key);
}

// PUBLIC_INTERFACE
export function isFollowing(chefId) {
  /** Returns whether current user is following this chef id. */
  const me = getOrCreateCommunityUser();
  const all = getFollowsState();
  return !!(all[me.id]?.followingChefIds || []).map(String).includes(String(chefId));
}

// PUBLIC_INTERFACE
export function getFollowerCount(chefId) {
  /** Returns total followers for a chef. */
  const all = getFollowsState();
  const key = String(chefId);
  let count = 0;
  for (const uid of Object.keys(all)) {
    const arr = all[uid]?.followingChefIds || [];
    if (arr.map(String).includes(key)) count += 1;
  }
  return count;
}

// PUBLIC_INTERFACE
export function discoverChefsFromRecipes(recipes) {
  /** Derives a list of chef objects: { id, name, recipeIds: string[] } */
  const arr = Array.isArray(recipes) ? recipes : [];
  const map = new Map();
  for (const r of arr) {
    const id = getChefIdForRecipe(r);
    const name = getChefNameForRecipe(r);
    const entry = map.get(id) || { id, name, recipeIds: [] };
    entry.recipeIds.push(String(r.id));
    map.set(id, entry);
  }
  return Array.from(map.values());
}

// PUBLIC_INTERFACE
export function getChefIdForRecipe(recipe) {
  /** Returns stable chefId for a recipe. */
  const r = recipe || {};
  if (r.authorId) return String(r.authorId);
  if (r.submittedBy) return `user:${String(r.submittedBy)}`;
  // pseudo stable by id
  return `chef:${String(r.id).slice(0, 6)}`;
}

// PUBLIC_INTERFACE
export function getChefNameForRecipe(recipe) {
  /** Friendly display name for a chef derived from recipe. */
  const r = recipe || {};
  if (r.authorName) return String(r.authorName);
  if (r.submittedBy && typeof r.submittedBy === 'string') return capitalCase(r.submittedBy);
  if (r.source === 'mock') return 'Mock Chef';
  return 'Chef';
}

// ---------- Share ----------

// PUBLIC_INTERFACE
export async function shareRecipe({ title, text, url }) {
  /** Uses Web Share API if available, else copies url to clipboard and dispatches a toast. */
  const fallback = async () => {
    try {
      await navigator.clipboard.writeText(String(url || window.location.href));
      dispatchToast({ title: 'Link copied', body: 'Recipe link copied to clipboard.' });
    } catch {
      // eslint-disable-next-line no-alert
      alert('Link copied to clipboard');
    }
  };
  try {
    if (navigator.share) {
      await navigator.share({ title: title || 'Recipe', text: text || '', url: url || window.location.href });
    } else {
      await fallback();
    }
  } catch {
    await fallback();
  }
}

// ---------- Admin analytics helpers ----------

// PUBLIC_INTERFACE
export function getCommunityMetrics(recipes) {
  /** Returns { totalComments, totalLikes, topMostLiked:[{id,title,count}], mostFollowedChefs:[{id,name,count}] } */
  const arr = Array.isArray(recipes) ? recipes : [];
  // comments
  const comments = getAllComments();
  const totalComments = comments.length;

  // likes
  const likeCounts = new Map();
  for (const r of arr) {
    const c = getLikeCount(r.id);
    likeCounts.set(String(r.id), c);
  }
  const totalLikes = Array.from(likeCounts.values()).reduce((a, b) => a + b, 0);
  const topMostLiked = [...likeCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([rid, count]) => {
      const rec = arr.find(x => String(x.id) === String(rid));
      return { id: rid, title: rec?.title || String(rid), count };
    });

  // follows
  const chefs = discoverChefsFromRecipes(arr);
  const followed = chefs.map(c => ({ ...c, count: getFollowerCount(c.id) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map(c => ({ id: c.id, name: c.name, count: c.count }));

  return { totalComments, totalLikes, topMostLiked, mostFollowedChefs: followed };
}

// ---------- Utils ----------

function isPlainObject(v) { return v && typeof v === 'object' && !Array.isArray(v); }
function capitalCase(s) { const str = String(s || '').replace(/[_-]+/g,' ').trim(); return str ? str[0].toUpperCase() + str.slice(1) : ''; }
function genUUID() { return 'u-' + Math.random().toString(36).slice(2) + '-' + Date.now().toString(36); }
function dispatchToast({ title, body }) {
  try { window.dispatchEvent(new CustomEvent('app:toast', { detail: { title, body } })); } catch {}
}
