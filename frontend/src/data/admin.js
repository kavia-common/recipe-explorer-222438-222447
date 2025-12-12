const ROUTE_LS_KEY = 'app_route:v1';

/**
 * PUBLIC_INTERFACE
 * Simple hash-based router utilities without external libs.
 * Routes supported: "/", "/admin", "/admin/dashboard", "/admin/recipes", "/admin/approvals"
 */
export function getCurrentRoute() {
  try {
    const hash = window.location.hash || '';
    const path = hash.replace(/^#/, '') || '/';
    return path;
  } catch {
    return '/';
  }
}

/**
 * PUBLIC_INTERFACE
 * Navigate to a new route by setting location.hash.
 */
export function navigateTo(path) {
  try {
    const next = path.startsWith('/') ? path : `/${path}`;
    if (window.location.hash !== `#${next}`) {
      window.location.hash = `#${next}`;
    } else {
      // force hashchange for same hash to notify listeners (optional)
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    }
    // remember last route for refresh UX
    window.localStorage.setItem(ROUTE_LS_KEY, next);
  } catch {
    // ignore
  }
}

/**
 * PUBLIC_INTERFACE
 * Read last persisted route, fallback "/".
 */
export function getLastRoute() {
  try {
    return window.localStorage.getItem(ROUTE_LS_KEY) || '/';
  } catch {
    return '/';
  }
}
