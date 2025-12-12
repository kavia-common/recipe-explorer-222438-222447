# Recipe Explorer - Ocean Professional Theme

A lightweight React SPA to browse, search, and view recipes with a modern, clean UI.

## Features
- Ocean Professional theme with blue and amber accents
- Header with logo/title, search, language selector, favorites filter, category pills, difficulty select, and theme toggle (light/dark)
- Responsive recipe grid with cards and ratings
- Detail modal with image, ingredients, steps, reviews, translation toggle, and extra actions
- Optional API integration; falls back to offline mock data
- Client-side recipe management (add, edit, delete) with localStorage persistence
- Admin section with Dashboard, Recipes management, and Approvals (fully client-side)
- Shopping List and Weekly Meal Planning (client-side via localStorage)
- Client-side Notifications (Web Notifications API with in-app toast fallback)
- Community features (client-side): Comments, Likes/Share, Follow chefs, Chefs page, and Admin community analytics
- NEW: Multilingual client-only translations with caching and fallbacks
- NEW: Collections — create your own recipe collections, add/remove recipes, and view them on the Collections page

## Collections

Client-side collections allow organizing recipes without any backend.

- Data model:
  - Collections: { id, name, description?, createdAt, updatedAt } stored under localStorage key app_collections.
  - Membership map: { [collectionId]: string[]recipeIds } stored under app_collection_members.
- Usage:
  - Navigate via the Collections link in the header (/collections).
  - Create/Rename/Delete collections in the left pane; select a collection to view its recipes on the right.
  - Add a recipe to collections from:
    - Recipe card “More (⋯)” menu → “Add to Collection”
    - Recipe detail modal → “Add to Collection” action
  - In the Collections page, remove recipes from the selected collection using inline remove buttons.
- Starter templates:
  - Party Recipes, Quick Snacks, Kids Lunch Box, Festival Specials — created empty on click.
- Admin:
  - Dashboard shows Top Collections by recipe count (local-only).

Persistence is local to your browser. Clearing storage will remove your collections.

## Multilingual Support

Client-side multilingual support is implemented without backend dependencies.

- Languages: English (en), Hindi (hi), Telugu (te). Structure allows adding more (e.g., Bengali bn, Tamil ta).
- Language selector: In the header and in the recipe detail modal. Persisted in localStorage with key `app_language` (default `en`).
- Translation approach: Offline mock translator implemented in `src/data/i18n.js`.
  - UI strings translated via a small in-browser dictionary.
  - Recipe content (instructions/steps/description/ingredients) translated by a mock adapter that applies deterministic rules and wraps output with a language tag (e.g., `[hi] ...`).
  - Translations are cached per recipe per language in `localStorage` (`app_translations`) to avoid repeated work.
- Fallbacks: If a recipe lacks instructions/steps, no translation is attempted. Search and filters continue to operate on the original English content.
- Accessibility: The modal shows a subtle “Translated from English” banner with a “View original” toggle; controls are keyboard accessible.

### Plugging in a real translation API later

The i18n module uses a pluggable translator interface. To integrate a real translation service:

1. Create a new class (e.g., `RealTranslator`) that implements:
   - `translate(text, targetLang): string`
   - `translateArray(arr, targetLang): string[]`
2. Replace the instantiated `translator` in `src/data/i18n.js` with `new RealTranslator(/* config */)`.
3. Keep the local cache logic to reduce repeated calls.
4. Do not store secrets in code; use environment variables via `.env` (ask ops for values and add them to `.env.example`).

Note: This app is frontend-only; any external API calls should handle CORS and rate limits appropriately.

### Analytics (Local-only)
Each time a recipe is viewed in a non-English language, a lightweight counter is incremented in `localStorage` under `app_translation_stats`. The Admin Dashboard shows a simple bar chart for counts per language. This data is device-local only.

## Getting Started
- `npm start` launches on http://localhost:3000 by default.
- Environment variables supported (optional):
  - `REACT_APP_API_BASE` or `REACT_APP_BACKEND_URL` for the API base URL (expects `/recipes` endpoint returning JSON array).
- If no API base is provided, the app uses local mock recipes.

## Structure
- `src/components/` Header, RecipeGrid, RecipeCard, RecipeDetailModal
- `src/components/admin/` AdminLayout, Dashboard, RecipesAdmin, Approvals
- `src/data/api.js` API wrapper (optional)
- `src/data/mock.js` Offline mock data
- `src/data/recipes.js` LocalStorage helpers for recipes
- `src/data/favorites.js` LocalStorage helpers for favorites
- `src/data/admin.js` Lightweight hash router (no external libs)
- `src/data/adminRecipes.js` Admin model helpers and analytics
- `src/data/storage.js` localStorage helpers
- `src/data/shoppingList.js` shopping list model/helpers (`app_shopping_list`)
- `src/data/mealPlan.js` meal planning helpers (`app_meal_plan`)
- `src/data/i18n.js` client-side multilingual helpers, cache, and translator interface

## Accessibility & Modals
- Modals (RecipeForm, ConfirmDialog, DetailModal) prevent background scroll while open using a body lock class and are internally scrollable.

## Community (Client-side only)
Data is stored in localStorage; no backend. Keys:
- app_comments:v1: array of comments { id, recipeId, authorId, authorName?, comment, createdAt, updatedAt }
- app_likes:v1: { [userId]: { [recipeId]: true } }
- app_follows:v1: { [userId]: { followingChefIds: string[] } }
- app_user_profile:v1: { id, displayName }

Features:
- Comments: add/edit/delete your own in the Recipe Detail modal; paginated display.
- Likes: like/unlike from the card or detail; counts update instantly.
- Share: uses Web Share API or copies link to clipboard with a toast fallback.
- Chefs: follow/unfollow derived chefs; Chefs page lists chefs with follower counts and top recipes.
- Settings: set your display name under /#/settings for use in comments.

Privacy:
- All data is local to your browser and never sent to a server.
- Clearing browser storage will remove your community data.

Admin:
- Dashboard shows total comments, total likes, top 5 most-liked recipes, most-followed chefs, and local translation view counts.
- Recipes table includes Likes and Comments columns.
