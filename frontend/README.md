# Recipe Explorer - Ocean Professional Theme

A lightweight React SPA to browse, search, and view recipes with a modern, clean UI.

## Features
- Ocean Professional theme with blue and amber accents
- Header with logo/title, search, favorites filter, category pills, difficulty select, and theme toggle (light/dark)
- Responsive recipe grid with cards and ratings
- Detail modal with image, ingredients, steps, reviews, and extra actions
- Optional API integration; falls back to offline mock data
- Client-side recipe management (add, edit, delete) with localStorage persistence
- Admin section with Dashboard, Recipes management, and Approvals (fully client-side)
- NEW: Shopping List and Weekly Meal Planning (client-side via localStorage)
- NEW: Client-side Notifications (Web Notifications API with in-app toast fallback)

## Notifications

Client-side only, time-based while the tab is open:
- Daily recipe suggestion (default 9:00 local, configurable)
- Meal reminders (default 18:00 local, configurable)
- New recipe added alerts (fires when an approved recipe appears)

How to use:
1. Click the bell icon in the header to open Notification Settings.
2. Click Request Permission to allow browser notifications (optional). If denied, you’ll see in-app toasts instead.
3. Enable the toggles and set times (HH:MM 24-hour).
4. Click Test Notification to verify delivery.

Limitations:
- Works only while the application tab is open (no service workers or push).
- Scheduler runs roughly every 60 seconds; delivery can be up to 1 minute after the exact time.
- To avoid spam, daily suggestion sends at most once per day, and meal reminder at most once per day.

Accessibility:
- In-app toasts are announced with role=status and are dismissible.
- Browser notifications inherit system accessibility.

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
- NEW:
  - `src/data/storage.js` localStorage helpers
  - `src/data/shoppingList.js` shopping list model/helpers (`app_shopping_list`)
  - `src/data/mealPlan.js` meal planning helpers (`app_meal_plan`)
  - `src/components/ShoppingListPage.js` UI for shopping list
  - `src/components/MealPlanPage.js` UI for weekly planning

## Shopping List
- Navigate to Shopping via the header or `/#/shopping`.
- Add custom items (name, quantity, unit).
- Mark items as purchased, edit inline, delete, and Clear purchased.
- From a recipe modal, click “Add ingredients to shopping list” to add normalized ingredients.
- Stored in `localStorage` under key `app_shopping_list`.

## Weekly Meal Planning
- Navigate to Planning via the header or `/#/plan`.
- See a 7-day week (Mon–Sun). Use Previous/Next to move weeks (week start Monday in ISO yyyy-mm-dd).
- Add recipes to each day from the searchable picker of approved recipes.
- Remove recipes from a day or clear a day.
- Add a selected day’s or the entire week’s ingredients to your shopping list (merged/normalized).
- Stored in `localStorage` under key `app_meal_plan`.

## Accessibility & Modals
- Modals (RecipeForm, ConfirmDialog, DetailModal) prevent background scroll while open using a body lock class and are internally scrollable.

