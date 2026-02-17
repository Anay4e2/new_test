# Feature Prompts for India Travel Package Builder

> **Usage:** Copy any prompt below and paste it into Claude Opus 4.6 in Antigravity. Each prompt is self-contained with full project context so the agent can execute without ambiguity.


## Prompt 5: Drag-and-Drop Itinerary Editing

```
---

## Prompt 6: Trip Comparison (Side-by-Side)

```

---

## Prompt 7: Photo Gallery per Place
---

## Prompt 8: WhatsApp/Email Export

```
## Task: Add WhatsApp & Email Export for Itineraries

### Project Context
This is an India Travel Package Builder with:
- **Backend:** Express + TypeScript + Mongoose at `backend/src/` (port 3001)
- **Frontend:** React + Vite + TypeScript + Tailwind + Zustand at `frontend/src/`
- **PDF service already exists:** `backend/src/services/pdfService.ts` generates PDF itineraries using pdfkit
- **Itinerary routes:** `backend/src/routes/itineraryRoutes.ts` already exists
- **TripResult:** has itinerary (DayItinerary[]) and summary (totalCost, totalDistance, feasibility, costBreakup)
- **Icons:** lucide-react is installed

### What to Build

1. **Backend — WhatsApp Text Formatter** (`backend/src/services/whatsappService.ts`):
   - Function `formatItineraryForWhatsApp(tripResult: TripResult): string`
   - Generate a clean, WhatsApp-friendly text summary with emojis:
     ```
     🇮🇳 *My India Trip Itinerary*
     📅 5 Days | 💰 ₹25,000 | 📍 Rajasthan
     
     *Day 1 - Jaipur*
     🏰 Amber Fort (3 hrs)
     🕌 Hawa Mahal (1.5 hrs)
     🏨 Night: Hotel Pearl Palace
     
     *Day 2 - Jaipur → Jodhpur*
     🚂 Train: 5 hrs
     🏰 Mehrangarh Fort (2 hrs)
     ...
     ```
   - Return the formatted string

2. **Backend — Email Service** (`backend/src/services/emailService.ts`):
   - Use nodemailer with a configurable SMTP (env vars: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`)
   - Function `sendItineraryEmail(to: string, tripResult: TripResult, pdfBuffer?: Buffer): Promise<void>`
   - HTML email template with styled itinerary summary
   - Optionally attach the PDF (generate using existing pdfService)
   - Install: `npm install nodemailer` and `npm install -D @types/nodemailer` in backend/

3. **Backend — Export Routes** (update `backend/src/routes/itineraryRoutes.ts`):
   - `POST /api/itinerary/whatsapp-text` — accepts TripResult, returns `{ text: string, whatsappUrl: string }` (whatsappUrl = `https://wa.me/?text=<encoded_text>`)
   - `POST /api/itinerary/send-email` — accepts `{ email: string, tripResult: TripResult, attachPdf?: boolean }`

4. **Frontend — API** (`frontend/src/services/api.ts`):
   - Add `getWhatsAppText(tripResult: TripResult): Promise<{ text: string; whatsappUrl: string }>`
   - Add `sendItineraryEmail(email: string, tripResult: TripResult, attachPdf?: boolean): Promise<{ success: boolean }>`

5. **Frontend — Export Buttons** (`frontend/src/components/planner/Itinerary/ExportButtons.tsx`):
   - A button group with 3 options: 📄 PDF (existing), 💬 WhatsApp, 📧 Email
   - WhatsApp button: opens `whatsappUrl` in new tab (uses wa.me deep link)
   - Email button: shows a small modal asking for email address, then sends
   - Use Lucide icons: `FileText`, `MessageCircle`, `Mail`
   - Loading states and success/error toasts

### Constraints
- WhatsApp sharing must work without any backend auth
- Email feature should gracefully handle missing SMTP config (show "Email not configured" message)
- The WhatsApp text must be under 65,000 characters (WhatsApp limit)
- Reuse the existing PDF generation logic, don't duplicate it
```

---


## Prompt 12: PWA Support (Offline Itinerary)

```
## Task: Add PWA Support for Offline Itinerary Access

### Project Context
This is an India Travel Package Builder with:
- **Frontend:** React + Vite + TypeScript at `frontend/src/`
- **Vite config:** `frontend/vite.config.ts`
- **Entry HTML:** `frontend/index.html`
- **Public folder:** `frontend/public/`
- **The app generates travel itineraries that users need while traveling (often in areas with poor connectivity)**

### What to Build

1. **Install vite-plugin-pwa**:
   - Run `npm install vite-plugin-pwa -D` in `frontend/`

2. **Configure PWA** (`frontend/vite.config.ts`):
   - Add VitePWA plugin with:
     - `registerType: 'autoUpdate'`
     - `workbox.runtimeCaching` rules for API responses (cache itinerary data)
     - `workbox.globPatterns`: cache all static assets
     - `manifest`: name "India Travel Planner", short_name "TravelPlan", theme_color "#1e40af", background_color "#ffffff", display "standalone"
     - Icons: generate appropriate PWA icons (192x192, 512x512)

3. **Create PWA Icons** (`frontend/public/`):
   - Create simple SVG-based icons at required sizes
   - `pwa-192x192.png`, `pwa-512x512.png`, `apple-touch-icon.png`
   - Use a travel-themed design (map pin or compass)

4. **Offline Itinerary Caching** (`frontend/src/services/offlineService.ts`):
   - Service to save generated itineraries to IndexedDB for offline access
   - Functions: `saveItineraryOffline(tripResult)`, `getOfflineItineraries()`, `deleteOfflineItinerary(id)`
   - Use the browser's native IndexedDB API (no extra library needed)

5. **Frontend — Offline Indicator Component** (`frontend/src/components/common/OfflineIndicator.tsx`):
   - Banner that appears when the user goes offline: "You're offline — viewing cached data"
   - Use `navigator.onLine` and `online`/`offline` events
   - Show which itineraries are available offline

6. **Frontend — "Save for Offline" Button**:
   - In the itinerary view, add a "Save for Offline" button (Lucide `Download` icon)
   - Saves the current itinerary to IndexedDB
   - Shows confirmation and a checkmark when saved

7. **Update index.html** (`frontend/index.html`):
   - Add meta tags for PWA: theme-color, apple-mobile-web-app-capable, viewport
   - Add link to manifest.json and apple-touch-icon

### Constraints
- Service worker should cache: static assets, API responses for itineraries, map tiles (limited)
- Don't cache everything — only cache critical data
- Works on both Android and iOS (Safari PWA support)
- Show install prompt on supported browsers
```

---

## Prompt 13: Estimated Packing List

```
## Task: Add Auto-Generated Packing List

### Project Context
This is an India Travel Package Builder with:
- **Backend:** Express + TypeScript at `backend/src/` (port 3001)
- **Frontend:** React + Vite + TypeScript + Tailwind at `frontend/src/`
- **TripResult:** contains itinerary with city, activities (each has type, tags), and summary
- **Place types in data:** temple, fort, palace, lake, market, museum, park, wildlife, desert, religious
- **Existing PDF service:** `backend/src/services/pdfService.ts` already has `getClothingRecommendations(month)` function that returns seasonal clothing suggestions
- **Budget tiers:** budget, standard, premium

### What to Build

1. **Backend — Packing List Service** (`backend/src/services/packingListService.ts`):
   - Function `generatePackingList(tripResult: TripResult, month: number, constraints: TripRequest['constraints']): PackingList`
   - PackingList type: `{ essentials: Item[], clothing: Item[], accessories: Item[], documents: Item[], healthKit: Item[], extras: Item[] }` where `Item = { name: string, icon: string, reason: string, priority: 'must-have'|'recommended'|'optional' }`
   - Logic:
     - **Season-based:** Reuse/extend existing `getClothingRecommendations` from pdfService
     - **Activity-based:** Temple visits → "Modest clothing, head covering", Desert safari → "Sunglasses, sunscreen, scarf", Wildlife → "Binoculars, mosquito repellent, earth-tone clothes"
     - **Constraint-based:** seniorFriendly → "Comfortable walking shoes, walking stick, medications", morningReligious → "Prayer items"
     - **Always include:** Passport/ID, phone charger, water bottle, first aid basics, cash (₹)
     - **Budget-specific:** budget → "Padlock for hostel lockers", premium → "Formal dinner attire"

2. **Backend — Packing List Route**:
   - `POST /api/itinerary/packing-list` — accepts `{ tripResult, month, constraints }`
   - Returns the PackingList
   - Add to existing `backend/src/routes/itineraryRoutes.ts`

3. **Frontend — API** (`frontend/src/services/api.ts`):
   - Add `getPackingList(tripResult, month, constraints): Promise<PackingList>`

4. **Frontend — Packing List Component** (`frontend/src/components/planner/Itinerary/PackingList.tsx`):
   - Collapsible section in the itinerary view
   - Categorized list with checkboxes (local state, not persisted)
   - Each item shows: emoji icon, name, reason tooltip, priority badge
   - "Print List" button that opens a print-friendly view
   - Progress bar showing "X of Y items packed"

5. **Frontend — Include in PDF Export**:
   - Update the PDF generation to include the packing list as a final page

### Constraints
- Packing suggestions must be culturally appropriate for India travel
- Use emojis as icons (👕 🧴 📱 💊 etc.)
- Checklist state stored in localStorage so it persists across page reloads
```

---

## Prompt 14: Real-Time Train Status

```
## Task: Add Real-Time Train Running Status

### Project Context
This is an India Travel Package Builder with:
- **Backend:** Express + TypeScript at `backend/src/` (port 3001)
- **Train service exists:** `backend/src/services/trainService.ts` — already integrates with RapidAPI IRCTC API (key: configured, host: irctc1.p.rapidapi.com)
- **Station codes:** `STATION_CODES` record mapping city names to railway station codes is already defined in trainService.ts
- **Train routes exist:** `backend/src/routes/trainRoutes.ts`, controller at `backend/src/controllers/trainController.ts`
- **Frontend:** React + Vite + TypeScript + Tailwind at `frontend/src/`
- **Existing train API:** `getTrainsBetweenCities(fromCity, toCity, date?)` in `frontend/src/services/api.ts`
- **Itinerary:** DayItinerary has `travel` field with from, to, distance, duration, mode

### What to Build

1. **Backend — Add Live Status to Train Service** (`backend/src/services/trainService.ts`):
   - Function `getTrainLiveStatus(trainNumber: string, date: string): Promise<TrainStatus>`
   - TrainStatus: `{ trainNumber: string, trainName: string, currentStation: string, delay: number (minutes), lastUpdated: string, status: 'on-time'|'delayed'|'cancelled'|'not-started', upcomingStops: { station: string, scheduledArrival: string, expectedArrival: string, platform?: number }[] }`
   - Use the IRCTC RapidAPI endpoint for live status (check their docs for the correct endpoint path)
   - Add caching: cache results for 5 minutes to avoid excessive API calls (use a simple in-memory Map with TTL)

2. **Backend — Train Status Route** (update `backend/src/routes/trainRoutes.ts`):
   - `GET /api/trains/status/:trainNumber?date=YYYY-MM-DD` — returns live train status

3. **Frontend — API** (`frontend/src/services/api.ts`):
   - Add `getTrainLiveStatus(trainNumber: string, date: string): Promise<TrainStatus>`

4. **Frontend — Train Status Component** (`frontend/src/components/planner/Transport/TrainStatus.tsx`):
   - Shows live running status for trains in the itinerary
   - Visual timeline showing stations with on-time (green) / delayed (orange/red) indicators
   - Auto-refresh every 5 minutes
   - Delay notification: if delay > 30 minutes, show a warning banner
   - Display platform number if available

5. **Frontend — Integrate into Itinerary**:
   - On travel days that use trains, show a "Track Train" button
   - On click: expands to show the TrainStatus component
   - If train hasn't started yet, show departure countdown

### Constraints
- Respect RapidAPI rate limits (cache results, don't call too frequently)
- Handle API failures gracefully (show "Status unavailable" instead of crashing)
- Date format for IRCTC API might be different — handle conversion
- This feature only works for train travel segments, not road/bus
```

---

## Prompt 15: Review & Ratings System

```
## Task: Add Review & Ratings System for Places

### Project Context
This is an India Travel Package Builder with:
- **Backend:** Express + TypeScript + Mongoose at `backend/src/` (port 3001)
- **Frontend:** React + Vite + TypeScript + Tailwind + Zustand at `frontend/src/`
- **Auth system:** JWT auth, User model, authMiddleware — all exist and work
- **Place model:** `backend/src/models/Place.ts` — has rating (number) field already
- **Place type:** `frontend/src/types/index.ts` — Place interface with rating field
- **Pages:** Home, Planner, Login, Register in `frontend/src/pages/`

### What to Build

1. **Backend — Review Model** (`backend/src/models/Review.ts`):
   - Schema: `{ userId: ObjectId (ref User, required), placeId: string (required), placeName: string, cityName: string, rating: number (1-5, required), title: string (max 100 chars), comment: string (max 1000 chars), visitDate?: Date, photos?: string[], helpfulCount: number (default 0), createdAt: Date, updatedAt: Date }`
   - Indexes: compound unique on `userId + placeId` (one review per user per place), index on placeId, index on rating

2. **Backend — Review Controller** (`backend/src/controllers/reviewController.ts`):
   - `createReview(req, res)` — create/update review (upsert by userId+placeId), recalculate place's average rating
   - `getReviewsForPlace(req, res)` — get all reviews for a place, sorted by createdAt desc, with pagination (limit/offset)
   - `getMyReviews(req, res)` — get all reviews by logged-in user
   - `markHelpful(req, res)` — increment helpfulCount on a review
   - `deleteReview(req, res)` — delete own review, recalculate average

3. **Backend — Rating Aggregation**:
   - After any review create/update/delete, recalculate the place's average rating
   - Store `reviewCount` and `averageRating` on the Place (add these fields to mock data and Place model)

4. **Backend — Routes** (`backend/src/routes/reviewRoutes.ts`):
   - `POST /api/reviews` — create review (auth required)
   - `GET /api/reviews/place/:placeId` — get reviews for place (public)
   - `GET /api/reviews/my` — get my reviews (auth required)
   - `POST /api/reviews/:id/helpful` — mark helpful (auth required)
   - `DELETE /api/reviews/:id` — delete review (auth required, own only)
   - Register in `backend/src/routes/index.ts`

5. **Frontend — API** (`frontend/src/services/api.ts`):
   - Add all review CRUD functions

6. **Frontend — Star Rating Component** (`frontend/src/components/common/StarRating.tsx`):
   - Reusable star rating display (read-only mode and interactive mode)
   - 5 stars using Lucide `Star` icon (filled/outline)
   - Interactive: hover preview, click to select
   - Display: show rating number + star count + review count ("4.2 ★ (128 reviews)")

7. **Frontend — Review Form Component** (`frontend/src/components/common/ReviewForm.tsx`):
   - Star rating selector
   - Title input, comment textarea
   - Optional visit date picker
   - Submit button (disabled if not logged in, show "Login to review" link)

8. **Frontend — Reviews Section** (`frontend/src/components/planner/Map/ReviewsSection.tsx`):
   - Displayed in place detail view / modal
   - List of reviews with: user name, rating stars, title, comment, date, "Helpful" button with count
   - Sort by: Most Recent, Highest Rated, Most Helpful
   - Show average rating summary at top with rating distribution bar (5-star: 45%, 4-star: 30%, etc.)

9. **Frontend — Add Review Prompt**:
   - After a trip is completed (based on dates), prompt users to review places they visited
   - Show a subtle banner on the dashboard: "Review your recent trip to Rajasthan"

### Constraints
- One review per user per place (upsert behavior)
- Reviews are public, but creating/editing requires auth
- Sanitize review text (no HTML injection)
- Handle empty states ("No reviews yet — be the first!")
- Star ratings should be half-star capable in display (4.5 stars) but users select whole stars
```

---

## General Tips for Using These Prompts

1. **Execute them one at a time** — each prompt is independent but some build on shared infrastructure (types, API layer)
2. **Recommended order:**
   - Start with **Dark Mode** (Prompt 11) — quick win, touches all components
   - Then **Hotel/Accommodation** (Prompt 4) — enriches core data
   - Then **Food & Restaurants** (Prompt 10) — similar pattern to hotels
   - Then **Trip History & Favorites** (Prompt 9) — uses existing auth
   - Then **Shareable Links** (Prompt 2) — popular feature
   - Then remaining features in any order
3. **After each prompt execution**, verify no TypeScript errors with `npm run build` in both `frontend/` and `backend/`
4. **If a prompt fails mid-execution**, paste the error output and ask the agent to fix it
