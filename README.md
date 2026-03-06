# India TripPlanner

A full-stack travel package builder for India, featuring interactive itinerary planning, real-time collaboration, and booking integrations.

## Architecture

| Layer | Stack |
|-------|-------|
| **Frontend** | React 19, Vite, TypeScript, TailwindCSS, Zustand, Framer Motion, Leaflet/Google Maps |
| **Backend** | Express 5, TypeScript, Mongoose/MongoDB, Socket.IO, Zod validation, Winston logging |
| **Infrastructure** | Docker Compose (frontend + backend + MongoDB) |

## Features

- **Trip Planner** — Multi-city itinerary generator with day-wise activities, hotels, meals, and transport
- **Interactive Maps** — Route visualization with polylines, flight arcs, and place markers
- **Transport Variants** — Compare train/bus/flight/car options with costs, duration, and booking links
- **Weather & Safety** — Seasonal weather data and city-wise emergency/safety information
- **Restaurants** — Discover restaurants by city, type, and cuisine
- **Festivals** — Browse festivals by state, month, and type
- **Train Search** — PNR status, live tracking, station info via Indian Railways integration
- **Journal** — Day-by-day travel journaling with photos, moods, and markdown
- **Expense Tracking** — Per-trip budget and spending management
- **Group Trips** — Real-time collaborative planning with chat and polls via WebSocket
- **Postcards** — Generate shareable travel postcards from trip photos
- **Reviews** — Rate and review places with inline editing
- **Packages** — Curated travel packages with booking
- **Admin Panel** — Place/trip/package management and analytics dashboard
- **i18n** — English and Hindi translations
- **Dark Mode** — Full dark theme support

## Quick Start

```bash
# Clone and install
npm install
cd frontend && npm install
cd ../backend && npm install

# Start backend (port 3001)
cd backend
cp .env.example .env   # edit with your MongoDB URI and JWT secret
npm run dev

# Start frontend (port 5173)
cd frontend
npm run dev
```

## Docker

```bash
docker compose up --build
```

Services: `frontend` (:80), `backend` (:3001), `mongo` (:27017)

## Testing

```bash
cd backend && npm test   # 71 tests (Vitest)
```

## Project Structure

```
frontend/       React SPA (Vite)
  src/pages/    22 page components
  src/components/  63+ UI components (planner, common, home, admin)
  src/services/ API client (60+ endpoints)
  src/stores/   Zustand state (auth, trip, notification, currency, theme)
  src/hooks/    Custom hooks (keyboard, sockets, notifications)

backend/        Express API
  src/controllers/  29 controllers
  src/models/       16 Mongoose models
  src/routes/       Route definitions with Zod validation
  src/services/     Business logic (planner, route optimizer, booking links)
  src/middleware/    Auth, admin, analytics, rate limiting
  src/lib/          Shared utilities (errors, pagination, logger)
```

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
