# Recipe Explorer - Ocean Professional Theme

A lightweight React SPA to browse, search, and view recipes with a modern, clean UI.

## Features
- Ocean Professional theme with blue and amber accents
- Header with logo/title, search, and theme toggle (light/dark)
- Responsive recipe grid with cards
- Detail modal with image, ingredients, and steps
- Optional API integration; falls back to offline mock data
- Client-side recipe management (add, edit, delete) with localStorage persistence
- Admin section with Dashboard, Recipes management, and Approvals (fully client-side)

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

## Notes
- Port 3000 is used as per environment preview.
- No external UI frameworks; pure CSS with subtle shadows and rounded corners.

## Recipe Management
- Click "➕ Add Recipe" in the header to create a new recipe. Category is required (Veg, Non-Veg, Desserts, Drinks; Veg by default).
- In the main (non-admin) UI, newly added recipes are saved as status: `pending` (not visible to the main feed until approved).
- Edit or Delete an existing recipe via:
  - The recipe card overflow menu (⋯) on each card, or
  - The recipe detail modal (✏️ Edit / 🗑️ Delete).
- All changes are stored locally in your browser (localStorage key: `app_recipes:v1`). These local recipes are merged with API/mock data on load; local items override by id.
- Favorites are preserved when editing (same id). Deleting a recipe removes it from favorites if needed.

## Admin
- Access the Admin section from the header "🛠️ Admin" button or by navigating to `/#/admin` (Dashboard), `/#/admin/recipes`, or `/#/admin/approvals`.
- Navigation tabs: Dashboard | Recipes | Approvals
- Data model extensions stored in localStorage:
  - `status`: `approved` | `pending` (main feed shows approved only)
  - `source`: `mock` | `user`
  - `createdAt`, `updatedAt` (ISO strings)
  - `submittedBy` (defaults to `"user"`)
- Approvals:
  - Pending recipes appear under Approvals.
  - Approve sets `status: approved` (becomes visible in main feed).
  - Reject deletes the recipe and cleans up favorites if it was favorited.
- Admin Recipes:
  - List all recipes (any status).
  - View, Edit, Delete. Admin Add/Edit allows setting `status` before saving.
- Dashboard:
  - Totals and approved vs pending counts.
  - Category distribution (Veg, Non-Veg, Desserts, Drinks).
  - Favorites count total and top 5 favorited recipes.
  - Recently added (last 5 by createdAt).

## Accessibility & Modals
- Modals (RecipeForm, ConfirmDialog, DetailModal) prevent background scroll while open using a body lock class and are internally scrollable.

