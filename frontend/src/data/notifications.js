//
// Client-side Notifications: preferences, scheduler, and delivery helpers
//

const LS_KEY = 'app_notifications:v1';

// Defaults
const DEFAULTS = {
  dailySuggestion: {
    enabled: false,
    time: '09:00', // 24h local
    lastSentISO: null,
  },
  mealReminders: {
    enabled: false,
    time: '18:00', // single reminder per day
    lastSentISOByDate: {}, // map of yyyy-mm-dd => true (sent)
  },
  newRecipeAlerts: {
    enabled: false,
    lastSeenRecipeIds: [], // recipe ids observed as approved
  },
};

// PUBLIC_INTERFACE
export function getNotificationSettings() {
    /** Returns a safe merged notification settings object from localStorage. */
    try {
      const raw = window.localStorage.getItem(LS_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return deepMerge(DEFAULTS, parsed || {});
    } catch {
      return deepMerge(DEFAULTS, {});
    }
}

// PUBLIC_INTERFACE
export function saveNotificationSettings(next) {
    /** Persists notification settings safely to localStorage. */
    try {
      const safe = deepMerge(DEFAULTS, next || {});
      window.localStorage.setItem(LS_KEY, JSON.stringify(safe));
    } catch {
      // ignore
    }
}

// PUBLIC_INTERFACE
export async function requestBrowserPermission() {
    /** Requests Notification permission, returns 'granted' | 'denied' | 'default'. */
    if (!('Notification' in window)) return 'denied';
    try {
      const perm = await Notification.requestPermission();
      return perm;
    } catch {
      return Notification.permission || 'default';
    }
}

// PUBLIC_INTERFACE
export function getPermissionState() {
    /** Returns current Notification.permission or 'unsupported'. */
    if (!('Notification' in window)) return 'unsupported';
    return Notification.permission;
}

// PUBLIC_INTERFACE
export function notify({ title, body, icon, onClick }) {
    /**
     * Sends a notification:
     * - If Notification.permission === 'granted', show system notification
     * - Else, dispatch an in-app toast event for fallback UI
     */
    const payload = {
      title: title || 'Notification',
      body: body || '',
      icon: icon || getDefaultIcon(),
      timestamp: Date.now(),
    };

    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const n = new Notification(payload.title, {
          body: payload.body,
          icon: payload.icon,
          tag: 'recipe-explorer',
        });
        if (onClick) {
          n.onclick = (e) => {
            try { onClick(e); } catch {}
          };
        }
        return;
      } catch {
        // fall back to toast
      }
    }

    // Fallback toast
    try {
      const evt = new CustomEvent('app:toast', { detail: { ...payload, onClick } });
      window.dispatchEvent(evt);
    } catch {
      // eslint-disable-next-line no-alert
      alert(`${payload.title}\n\n${payload.body}`);
    }
}

// PUBLIC_INTERFACE
export function validateHHMM(s) {
    /** Returns normalized HH:MM (24h) or null if invalid. */
    if (typeof s !== 'string') return null;
    const m = s.trim().match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return null;
    let h = Number(m[1]);
    let mm = Number(m[2]);
    if (!Number.isFinite(h) || !Number.isFinite(mm)) return null;
    if (h < 0 || h > 23) return null;
    if (mm < 0 || mm > 59) return null;
    const hh = String(h).padStart(2, '0');
    const mins = String(mm).padStart(2, '0');
    return `${hh}:${mins}`;
}

// PUBLIC_INTERFACE
export function startNotificationScheduler({ getApprovedRecipes, getTodayPlan }) {
    /**
     * Starts the 60s polling scheduler to check due notifications.
     * Returns a stop function to clear the interval.
     *
     * getApprovedRecipes: () => Recipe[]
     * getTodayPlan: () => { dayKey: string, entries: {title, recipeId}[] }[] or similar
     */
    const id = window.setInterval(() => {
      try { tick({ getApprovedRecipes, getTodayPlan }); } catch {}
    }, 60 * 1000);

    // Fire one at start for immediate checks
    try { tick({ getApprovedRecipes, getTodayPlan }); } catch {}

    return () => window.clearInterval(id);
}

// Core tick
function tick({ getApprovedRecipes, getTodayPlan }) {
  const settings = getNotificationSettings();
  const now = new Date();
  const todayISO = toISODate(now);

  // Daily suggestion: once per day at configured time
  if (settings.dailySuggestion?.enabled) {
    const due = isTimeReachedToday(now, settings.dailySuggestion.time);
    const lastDate = (settings.dailySuggestion.lastSentISO || '').slice(0, 10);
    if (due && lastDate !== todayISO) {
      const recipes = safeArr(getApprovedRecipes?.());
      const chosen = pickDaily(recipes, todayISO);
      if (chosen) {
        const title = 'Daily recipe suggestion';
        const body = `${chosen.title} • ${chosen.category || 'Recipe'} • ${formatCooking(chosen.cookingTime)}`;
        notify({ title, body });
        settings.dailySuggestion.lastSentISO = now.toISOString();
        saveNotificationSettings(settings);
      }
    }
  }

  // Meal reminders: once per day when time window reached and plan exists
  if (settings.mealReminders?.enabled) {
    const due = isTimeReachedToday(now, settings.mealReminders.time);
    const sentMap = settings.mealReminders.lastSentISOByDate || {};
    if (due && !sentMap[todayISO]) {
      const todayEntries = collectTodayPlan(getTodayPlan);
      if (todayEntries.length) {
        const preview = todayEntries.slice(0, 3).map(e => e.title).join(', ');
        const more = todayEntries.length > 3 ? ` +${todayEntries.length - 3} more` : '';
        notify({
          title: 'Meal reminder',
          body: `Planned today: ${preview}${more}`,
        });
        sentMap[todayISO] = true;
        settings.mealReminders.lastSentISOByDate = sentMap;
        saveNotificationSettings(settings);
      }
    }
  }

  // New recipe alerts: check for newly approved items
  if (settings.newRecipeAlerts?.enabled) {
    const recipes = safeArr(getApprovedRecipes?.());
    const lastSeen = new Set(settings.newRecipeAlerts.lastSeenRecipeIds || []);
    const newOnes = recipes.filter(r => !lastSeen.has(String(r.id)));
    if (newOnes.length) {
      for (const r of newOnes) {
        notify({
          title: 'New recipe added',
          body: `${r.title} • ${r.category || ''} • ${formatCooking(r.cookingTime)}`,
        });
        lastSeen.add(String(r.id));
      }
      settings.newRecipeAlerts.lastSeenRecipeIds = Array.from(lastSeen);
      saveNotificationSettings(settings);
    }
  }
}

// Utilities
function deepMerge(base, extra) {
  const out = Array.isArray(base) ? [...base] : { ...base };
  if (!extra || typeof extra !== 'object') return out;
  for (const k of Object.keys(extra)) {
    const bv = out[k];
    const ev = extra[k];
    if (isPlainObject(bv) && isPlainObject(ev)) out[k] = deepMerge(bv, ev);
    else out[k] = ev;
  }
  return out;
}
function isPlainObject(v) { return v && typeof v === 'object' && !Array.isArray(v); }
function toISODate(d = new Date()) { const x = new Date(d); x.setHours(0,0,0,0); return x.toISOString().slice(0,10); }
function safeArr(a) { return Array.isArray(a) ? a : []; }
function getDefaultIcon() {
  // try to use public icon path if exists
  return '/favicon.ico';
}
function formatCooking(mins) {
  const m = Number(mins);
  if (!Number.isFinite(m) || m <= 0) return 'time varies';
  return `${m} min`;
}
function parseHHMMToMinutes(hhmm) {
  const v = validateHHMM(hhmm);
  if (!v) return null;
  const [h, m] = v.split(':').map(Number);
  return h * 60 + m;
}
function isTimeReachedToday(now, hhmm) {
  const mins = parseHHMMToMinutes(hhmm);
  if (mins == null) return false;
  const cur = now.getHours() * 60 + now.getMinutes();
  // Consider due if current >= target and within same day
  return cur >= mins;
}
function collectTodayPlan(getTodayPlan) {
  try {
    const list = getTodayPlan?.();
    if (!Array.isArray(list)) return [];
    // Expect shape: [{ entries: [{title}] }, ...] OR just entries array
    const all = [];
    for (const day of list) {
      if (Array.isArray(day?.entries)) all.push(...day.entries);
    }
    return all;
  } catch { return []; }
}
function pickDaily(recipes, todayISO) {
  if (!recipes.length) return null;
  // rotate by date: hash the date to an index
  const idx = Math.abs(stringHash(todayISO)) % recipes.length;
  return recipes[idx];
}
function stringHash(s) {
  let h = 0; for (let i=0;i<s.length;i++) { h = ((h<<5)-h) + s.charCodeAt(i); h |= 0; }
  return h;
}
