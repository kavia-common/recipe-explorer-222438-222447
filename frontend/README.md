# Recipe Explorer - Ocean Professional Theme

A lightweight React SPA to browse, search, and view recipes with a modern, clean UI.

## Features
- Ocean Professional theme with blue and amber accents
- Header with logo/title, search, and theme toggle (light/dark)
- Responsive recipe grid with cards
- Detail modal with image, ingredients, and steps
- Optional API integration; falls back to offline mock data

## Getting Started
- `npm start` launches on http://localhost:3000 by default.
- Environment variables supported (optional):
  - `REACT_APP_API_BASE` or `REACT_APP_BACKEND_URL` for the API base URL (expects `/recipes` endpoint returning JSON array).
- If no API base is provided, the app uses local mock recipes.

## Structure
- `src/components/` Header, RecipeGrid, RecipeCard, RecipeDetailModal
- `src/data/api.js` API wrapper (optional)
- `src/data/mock.js` Offline mock data

## Notes
- Port 3000 is used as per environment preview.
- No external UI frameworks; pure CSS with subtle shadows and rounded corners.
