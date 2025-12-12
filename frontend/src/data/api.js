const handle = async (res) => {
  // Convert non-2xx to an error so callers can decide fallback behavior.
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json();
};

/**
 * Validate and normalize an API base URL string.
 * Returns a normalized base string (no trailing slash) or empty string if invalid.
 * PUBLIC_INTERFACE
 */
export function validateApiBase(maybeBase) {
  try {
    const raw = (maybeBase || '').toString().trim();
    if (!raw) return '';
    let urlStr = raw;

    // If protocol is missing, try to resolve against window.location.origin
    if (!/^https?:\/\//i.test(urlStr)) {
      if (typeof window !== 'undefined' && window.location && window.location.origin) {
        urlStr = `${window.location.origin}${raw.startsWith('/') ? '' : '/'}${raw}`;
      } else {
        return '';
      }
    }

    const u = new URL(urlStr);
    if (!u.hostname) return '';
    // Normalize: origin + pathname without trailing slashes
    return `${u.origin}${u.pathname}`.replace(/\/*$/, '');
  } catch {
    return '';
  }
}

/**
 * Fetch list of recipes from API if available.
 * PUBLIC_INTERFACE
 * @param {string} apiBase - The API base URL or path. Example: "https://api.example.com" or "/api"
 * @returns {Promise<Array>} array of recipe objects
 */
export async function fetchRecipes(apiBase) {
  const baseValidated = validateApiBase(apiBase);
  if (!baseValidated) {
    // Signal to caller that base is not usable; let caller fallback to mock.
    const err = new Error('API base URL invalid');
    err.code = 'INVALID_API_BASE';
    throw err;
  }
  const url = `${baseValidated}/recipes`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  return handle(res);
}
