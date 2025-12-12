//
// i18n.js - Client-side translation utilities with caching and pluggable adapters
//

/**
 * Simple in-memory UI dictionary for core UI strings and common cooking terms.
 * Keys are English source strings; values are per-language mapping.
 * Add more phrases as needed.
 */
const uiDictionary = {
  "Language": { hi: "भाषा", te: "భాష", en: "Language" },
  "Translated from English": { hi: "अंग्रेज़ी से अनुवादित", te: "ఆంగ్లం నుండి అనువదించబడింది", en: "Translated from English" },
  "View original": { hi: "मूल देखें", te: "అసలు చూడండి", en: "View original" },
  "View translation": { hi: "अनुवाद देखें", te: "అనువాదాన్ని చూడండి", en: "View translation" },
  "Close": { hi: "बंद करें", te: "మూసివేయి", en: "Close" },
  "Ingredients": { hi: "सामग्री", te: "పదార్థాలు", en: "Ingredients" },
  "Instructions": { hi: "निर्देश", te: "సూచనలు", en: "Instructions" },
  "Difficulty": { hi: "कठिनाई", te: "కష్టం", en: "Difficulty" },
  "Category": { hi: "श्रेणी", te: "వర్గం", en: "Category" },
  "Favorites": { hi: "पसंदीदा", te: "ఇష్టాలు", en: "Favorites" },
  "Search": { hi: "खोजें", te: "శోధించండి", en: "Search" },
  "Admin": { hi: "प्रशासन", te: "నిర్వాహకుడు", en: "Admin" },
  "Dashboard": { hi: "डैशबोर्ड", te: "డ్యాష్‌బోర్డ్", en: "Dashboard" },
  "Recipes": { hi: "व्यंजन", te: "వంటకాలు", en: "Recipes" },
};

/**
 * Supported languages. Extendable.
 */
export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी" },
  { code: "te", label: "తెలుగు" },
  // { code: "bn", label: "বাংলা" },
  // { code: "ta", label: "தமிழ்" },
];

const LS_LANGUAGE_KEY = "app_language";
const LS_TRANSLATION_CACHE_KEY = "app_translations";
const LS_TRANSLATION_STATS_KEY = "app_translation_stats";

/**
 * LocalStorage safe getters/setters
 */
function readLocalStorageJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}
function writeLocalStorageJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    // ignore
  }
}

// PUBLIC_INTERFACE
export function getSelectedLanguage() {
  /** Get the currently selected language from localStorage. Defaults to 'en'. */
  const lang = (typeof window !== "undefined" && localStorage.getItem(LS_LANGUAGE_KEY)) || "en";
  return lang || "en";
}

// PUBLIC_INTERFACE
export function setSelectedLanguage(lang) {
  /** Persist selected language to localStorage. */
  try {
    localStorage.setItem(LS_LANGUAGE_KEY, lang);
  } catch (e) {
    // ignore
  }
}

/**
 * UI translation function using the dictionary with fallback to English or source.
 */
// PUBLIC_INTERFACE
export function tUI(text, lang) {
  /** Translate common UI phrases. Falls back to source or English. */
  const target = lang || getSelectedLanguage();
  const entry = uiDictionary[text];
  if (!entry) return text;
  return entry[target] || entry["en"] || text;
}

/**
 * Pluggable Translator Interface
 * shape: {
 *   translate(text, targetLang): string
 *   translateArray(arr, targetLang): string[]
 * }
 * We start with a mock translator that performs deterministic, offline transforms.
 */
class MockTranslator {
  // Simple heuristics for cooking terms (demonstrative only)
  static termMap = {
    // Hindi
    hi: {
      "salt": "नमक",
      "water": "पानी",
      "oil": "तेल",
      "onion": "प्याज़",
      "garlic": "लहसुन",
      "tomato": "टमाटर",
      "chili": "मिर्च",
      "mix": "मिलाएं",
      "boil": "उबालें",
      "fry": "तलें",
      "serve": "परोसें",
    },
    // Telugu
    te: {
      "salt": "ఉప్పు",
      "water": "నీరు",
      "oil": "నూనె",
      "onion": "ఉల్లిపాయ",
      "garlic": "వెల్లుల్లి",
      "tomato": "టమోటా",
      "chili": "మిరపకాయ",
      "mix": "కలపండి",
      "boil": "మరిగించండి",
      "fry": "వేపండి",
      "serve": "పరిమార్చండి",
    },
  };

  translate(text, targetLang) {
    if (!text || !targetLang || targetLang === "en") return text;
    const lower = String(text);
    const words = lower.split(/(\s+|[,.!?:;])/g);
    const map = MockTranslator.termMap[targetLang] || {};
    const mapped = words
      .map((w) => {
        const key = w.toLowerCase();
        if (map[key]) {
          // preserve capitalization rudimentarily
          if (w[0] === w[0]?.toUpperCase()) {
            return map[key];
          }
          return map[key];
        }
        return w;
      })
      .join("");
    // wrap to indicate mock translation; stable to allow tests
    return `[${targetLang}] ${mapped}`;
  }

  translateArray(arr, targetLang) {
    if (!Array.isArray(arr)) return arr;
    return arr.map((s) => this.translate(s, targetLang));
  }
}

const translator = new MockTranslator();

function getCache() {
  return readLocalStorageJSON(LS_TRANSLATION_CACHE_KEY, {});
}
function setCache(cache) {
  writeLocalStorageJSON(LS_TRANSLATION_CACHE_KEY, cache);
}

// PUBLIC_INTERFACE
export function translateText(text, targetLang) {
  /**
   * Translate arbitrary text using the mock translator with no external calls.
   * For 'en' returns original; otherwise returns a stable mock-translation.
   */
  if (!text) return text;
  if (targetLang === "en" || !targetLang) return text;
  return translator.translate(text, targetLang);
}

// Normalize instructions field to array of strings and return also the original type.
function normalizeInstructions(instructions) {
  if (!instructions) return { type: "none", list: [] };
  if (Array.isArray(instructions)) return { type: "array", list: instructions.map((x) => String(x)) };
  return { type: "string", list: [String(instructions)] };
}
function reassembleInstructions(list, originalType) {
  if (originalType === "array") return list;
  if (originalType === "string") return list.join("\n");
  return undefined;
}

function incrementStats(lang) {
  if (!lang || lang === "en") return;
  const stats = readLocalStorageJSON(LS_TRANSLATION_STATS_KEY, {});
  stats[lang] = (stats[lang] || 0) + 1;
  writeLocalStorageJSON(LS_TRANSLATION_STATS_KEY, stats);
}

// PUBLIC_INTERFACE
export function getTranslationStats() {
  /** Return counts per language for translated recipe views from localStorage. */
  return readLocalStorageJSON(LS_TRANSLATION_STATS_KEY, {});
}

/**
 * Build a stable cache key for a recipe+lang
 */
function cacheKey(recipeId, lang) {
  return `${recipeId}__${lang}`;
}

// PUBLIC_INTERFACE
export function translateRecipe(recipe, lang) {
  /**
   * Returns a derived copy of recipe with translated fields (instructions/steps, optionally
   * description and ingredients when strings). Uses localStorage cache to avoid recomputation.
   * Does not mutate the original object.
   */
  if (!recipe || !recipe.id || !lang || lang === "en") return recipe;

  const key = cacheKey(recipe.id, lang);
  const cache = getCache();
  if (cache[key]) {
    return cache[key];
  }

  const derived = { ...recipe };

  // Translate description if string
  if (typeof derived.description === "string") {
    derived.description = translateText(derived.description, lang);
  }

  // Translate ingredients either array or string
  if (Array.isArray(derived.ingredients)) {
    derived.ingredients = translator.translateArray(derived.ingredients, lang);
  } else if (typeof derived.ingredients === "string") {
    derived.ingredients = translateText(derived.ingredients, lang);
  }

  // Translate instructions or steps
  if (derived.instructions || derived.steps) {
    const base = derived.instructions ?? derived.steps;
    const norm = normalizeInstructions(base);
    const translatedList = translator.translateArray(norm.list, lang);
    const reassembled = reassembleInstructions(translatedList, norm.type);
    if (derived.instructions !== undefined) {
      derived.instructions = reassembled;
    } else {
      derived.steps = reassembled;
    }
  }

  cache[key] = derived;
  setCache(cache);
  return derived;
}

// PUBLIC_INTERFACE
export function recordTranslatedView(lang) {
  /** Increment local stats when a non-English translation is viewed. */
  incrementStats(lang);
}
