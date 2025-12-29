# India Travel Package Builder

## Overview
This is a MVP for a custom travel package builder focused on India (specifically Rajasthan for this version). It allows users to select cities, define preferences, and generates a detailed day-wise itinerary.

## Architecture
- **Frontend:** Next.js (App Router), React, Tailwind CSS.
- **Maps:** Leaflet (via `react-leaflet`) with OpenStreetMap tiles.
- **Backend:** Next.js API Routes.
- **Data:**
    - Mongoose Models (`State`, `City`, `Place`) are defined in `src/models`.
    - `src/lib/mockData.ts` serves as the data source for this MVP to ensure it runs without a live MongoDB instance in all environments.
    - `src/lib/planner.ts` contains the logic for itinerary generation.

## Key Features
- Interactive Map Selection.
- Custom Constraints (Senior friendly, Religious timing, etc.).
- Feasibility checks (Travel time, Pace).
- Cost Estimation.

## Running the App
1. `npm install`
2. `npm run dev` or `npm start` (after build)
