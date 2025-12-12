const handle = async (res) => {
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json();
};

/**
 * Fetch list of recipes from API if available.
 * PUBLIC_INTERFACE
 */
export async function fetchRecipes(apiBase) {
  const base = apiBase?.replace(/\/+$/, '') || '';
  const url = `${base}/recipes`;
  const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
  return handle(res);
}
