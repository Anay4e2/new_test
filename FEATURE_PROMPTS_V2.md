# Feature Prompts V2 — India Travel Package Builder

> All 15 original features are implemented. These are **new, non-overlapping** features.  
> Copy any prompt into Claude Opus 4.6 in Antigravity to execute.

---

## Prompt 1: Trip Calendar Sync (Google Calendar / iCal Export)

```
## Task: Add Trip Calendar Sync — Export Itinerary to Google Calendar / iCal

### Project Context
This is an India Travel Package Builder with:
- **Backend:** Express + TypeScript + Mongoose at `backend/src/` (port 3001)
- **Frontend:** React + Vite + TypeScript + Tailwind + Zustand at `frontend/src/`
- **Itinerary type:** `DayItinerary` in `frontend/src/types/index.ts` has: day, date?, city, activities[], travel?, nightStay, meals?, weather?, stats
- **Existing exports:** PDF (pdfService), WhatsApp (whatsappService), Email (emailService) — all under `backend/src/services/`
- **Export buttons:** `frontend/src/components/planner/Itinerary/ExportButtons.tsx` already has PDF, WhatsApp, Email buttons
- **TripResult:** has itinerary[] and summary (totalCost, totalDistance, feasibility, costBreakup)

### What to Build

1. **Backend — iCal Service** (`backend/src/services/calendarService.ts`):
   - Install `ical-generator` package: `npm install ical-generator` in `backend/`
   - Function `generateICalFile(tripResult: TripResult, startDate: string): Buffer`
   - Create one iCal event per day with:
     - Summary: "Day X — CityName"
     - Description: list of activities with times, hotel info, meal suggestions
     - Location: city name
     - DTSTART/DTEND: based on startDate + day offset, full-day events
   - Add travel events as separate entries (e.g., "🚂 Jaipur → Jodhpur")
   - Include VALARM reminders: 1 day before trip, morning of each day

2. **Backend — Google Calendar URL Generator**:
   - Function `generateGoogleCalendarUrl(day: DayItinerary, startDate: string): string`
   - Build the `https://calendar.google.com/calendar/render?action=TEMPLATE&text=...&dates=...&details=...&location=...` URL
   - URL-encode all parameters properly
   - Return an array of URLs (one per day) or a single "Add All" URL

3. **Backend — Calendar Route** (update `backend/src/routes/itineraryRoutes.ts`):
   - `POST /api/itinerary/calendar/ical` — accepts `{ tripResult, startDate }`, returns `.ics` file download (Content-Type: text/calendar)
   - `POST /api/itinerary/calendar/google-urls` — accepts `{ tripResult, startDate }`, returns array of Google Calendar URLs

4. **Frontend — API** (`frontend/src/services/api.ts`):
   - Add `downloadICalFile(tripResult: TripResult, startDate: string)` — triggers file download
   - Add `getGoogleCalendarUrls(tripResult: TripResult, startDate: string): Promise<string[]>`

5. **Frontend — Calendar Export UI** (update `frontend/src/components/planner/Itinerary/ExportButtons.tsx`):
   - Add a 📅 Calendar button to the existing export group
   - On click: show dropdown with two options:
     - "Download .ics file" (for Apple Calendar, Outlook, any iCal app)
     - "Add to Google Calendar" (opens Google Calendar URLs)
   - Add a date picker for trip start date (since itinerary has relative days, user picks the actual start date)
   - Use Lucide `Calendar` icon

6. **Frontend — Date Picker for Start Date**:
   - Simple date input shown when calendar export is triggered
   - Default to tomorrow's date
   - Validate: cannot be in the past

### Constraints
- The .ics file must be valid iCalendar format (RFC 5545)
- Google Calendar URLs have a max length — if description is too long, truncate with "..."
- Must handle timezone correctly (use IST — Asia/Kolkata)
- Don't modify existing export functionality
```

---

## Prompt 2: Emergency Contacts & Safety Information

```

---

## Prompt 3: Local Events & Festivals Calendar

```

---

## Prompt 4: Budget Tracker & Expense Logger

```
## Task: Add Real-Time Budget Tracker & Expense Logger

### Project Context
This is an India Travel Package Builder with:
- **Backend:** Express + TypeScript + Mongoose at `backend/src/` (port 3001)
- **Frontend:** React + Vite + TypeScript + Tailwind + Zustand at `frontend/src/`
- **Auth system:** JWT auth, User model, authMiddleware — all exist
- **Saved Trips:** `backend/src/models/SavedTrip.ts` — saves tripRequest + tripResult per user
- **TripResult.summary.costBreakup:** `{ stay, transport, activities, food }` — estimated costs
- **Zustand stores:** authStore, tripStore, themeStore, itineraryEditStore in `frontend/src/stores/`
- **Dashboard page:** `frontend/src/pages/Dashboard.tsx` — shows saved trips & favorites

### What to Build

1. **Backend — Expense Model** (`backend/src/models/Expense.ts`):
   - Schema:
     ```typescript
     {
       userId: ObjectId (ref User, required),
       tripId: ObjectId (ref SavedTrip, required),
       category: 'stay' | 'transport' | 'food' | 'activities' | 'shopping' | 'tips' | 'other',
       amount: number (in ₹, required),
       description: string,
       day: number, // which day of the trip
       city?: string,
       paymentMethod: 'cash' | 'upi' | 'card' | 'other',
       receipt?: string, // URL to receipt image
       createdAt: Date
     }
     ```
   - Index on `userId + tripId`

2. **Backend — Expense Controller** (`backend/src/controllers/expenseController.ts`):
   - `addExpense(req, res)` — add a new expense (auth required)
   - `getExpensesByTrip(req, res)` — get all expenses for a trip, with category totals
   - `updateExpense(req, res)` — update an expense
   - `deleteExpense(req, res)` — delete an expense
   - `getExpenseSummary(req, res)` — returns `{ estimated: costBreakup, actual: { [category]: total }, difference: { [category]: number }, totalEstimated, totalActual, percentUsed }`

3. **Backend — Routes** (`backend/src/routes/expenseRoutes.ts`):
   - `POST /api/expenses` — add expense
   - `GET /api/expenses/trip/:tripId` — list expenses for a trip
   - `GET /api/expenses/trip/:tripId/summary` — expense summary with estimated vs actual
   - `PUT /api/expenses/:id` — update
   - `DELETE /api/expenses/:id` — delete
   - All require auth middleware
   - Register in `backend/src/routes/index.ts`

4. **Frontend — Types** (`frontend/src/types/index.ts`):
   - Add `Expense` interface and `ExpenseSummary` interface

5. **Frontend — API** (`frontend/src/services/api.ts`):
   - Add all expense CRUD + summary functions

6. **Frontend — Expense Tracker Component** (`frontend/src/components/planner/Trip/ExpenseTracker.tsx`):
   - Shows for saved trips in the Dashboard
   - **Budget Overview Bar:** horizontal segmented bar showing estimated budget with actual spending overlay
   - Color-coded categories: 🔵 Stay, 🟢 Transport, 🟠 Food, 🟣 Activities, 🔴 Shopping, ⚫ Other
   - **Under/Over budget indicator:** green if under, yellow if close (>80%), red if over
   - **Per-day breakdown:** expandable accordion showing expenses per day

7. **Frontend — Quick Add Expense Form** (`frontend/src/components/planner/Trip/AddExpenseForm.tsx`):
   - Slide-up bottom sheet on mobile, modal on desktop
   - Fields: amount (₹, numeric keypad), category (icon buttons), description (optional), day selector, payment method
   - One-tap category selection with emoji icons
   - "Add Another" button for batch entry
   - Auto-suggest city based on selected day

8. **Frontend — Expense Charts** (`frontend/src/components/planner/Trip/ExpenseCharts.tsx`):
   - Pie chart: actual spending by category (use simple CSS/SVG pie chart, no chart library)
   - Bar chart: estimated vs actual per category
   - Daily spending line (simple SVG)

9. **Frontend — Dashboard Integration**:
   - On each saved trip card in Dashboard, show a mini budget indicator (progress bar)
   - "Track Expenses" button opens the expense tracker

### Constraints
- All amounts in INR (₹)
- Expenses require auth — tied to userId
- No chart library — use simple CSS/SVG for visualizations
- The expense form should be optimized for quick mobile entry (traveling users)
- Handle empty state ("No expenses logged yet — start tracking!")
```

---

## Prompt 5: Transportation Booking Deep Links

```

---

## Prompt 6: Animated Route Visualization on Map

```

---

## Prompt 7: Multi-Language Support (i18n)

```
## Task: Add Multi-Language Support (Hindi + English)

### Project Context
This is an India Travel Package Builder with:
- **Frontend:** React + Vite + TypeScript + Tailwind at `frontend/src/`
- **Pages:** Home, Planner, Login, Register, Admin, AdminLogin, Dashboard, SharedTrip in `frontend/src/pages/`
- **Components:** Nested under `frontend/src/components/` — common, home, planner subfolders
- **Zustand stores:** authStore, tripStore, themeStore, itineraryEditStore in `frontend/src/stores/`
- **All text is currently hardcoded in English across all components**

### What to Build

1. **Install i18next**:
   - Run in `frontend/`: `npm install i18next react-i18next i18next-browser-languagedetector`

2. **Frontend — i18n Config** (`frontend/src/i18n/index.ts`):
   - Configure i18next with:
     - Languages: 'en' (English), 'hi' (Hindi)
     - Default: 'en'
     - Detection: browser language → localStorage → default
     - Namespace: 'translation' (single namespace is fine for this app size)

3. **Frontend — Translation Files**:
   - `frontend/src/i18n/locales/en.json`:
     ```json
     {
       "nav": { "home": "Home", "plan": "Plan Trip", "login": "Login", "register": "Register", "dashboard": "My Trips", "logout": "Logout" },
       "home": { "hero_title": "Discover India", "hero_subtitle": "Plan your perfect trip across incredible India", "featured": "Featured Packages", "explore": "Explore States" },
       "planner": { "select_state": "Select State", "select_cities": "Select Cities", "duration": "Duration", "budget": "Budget", "travel_style": "Travel Style", "generate": "Generate Itinerary", "compare": "Compare Plans" },
       "itinerary": { "day": "Day", "activities": "Activities", "travel": "Travel", "night_stay": "Night Stay", "meals": "Meals", "weather": "Weather", "export": "Export", "share": "Share", "save": "Save Trip" },
       "budget": { "budget": "Budget", "standard": "Standard", "premium": "Premium" },
       "style": { "relaxed": "Relaxed", "fast": "Fast-Paced" },
       "auth": { "email": "Email", "password": "Password", "name": "Name", "login_title": "Welcome Back", "register_title": "Create Account" },
       "common": { "loading": "Loading...", "error": "Something went wrong", "retry": "Retry", "cancel": "Cancel", "save": "Save", "delete": "Delete", "edit": "Edit", "back": "Back", "next": "Next" }
     }
     ```
   - `frontend/src/i18n/locales/hi.json`:
     ```json
     {
       "nav": { "home": "होम", "plan": "यात्रा की योजना", "login": "लॉगिन", "register": "रजिस्टर", "dashboard": "मेरी यात्राएं", "logout": "लॉगआउट" },
       "home": { "hero_title": "भारत की खोज करें", "hero_subtitle": "अद्भुत भारत में अपनी सही यात्रा की योजना बनाएं", "featured": "चुनिंदा पैकेज", "explore": "राज्य देखें" },
       "planner": { "select_state": "राज्य चुनें", "select_cities": "शहर चुनें", "duration": "अवधि", "budget": "बजट", "travel_style": "यात्रा शैली", "generate": "यात्रा कार्यक्रम बनाएं", "compare": "योजनाओं की तुलना करें" },
       "itinerary": { "day": "दिन", "activities": "गतिविधियां", "travel": "यात्रा", "night_stay": "रात्रि विश्राम", "meals": "भोजन", "weather": "मौसम", "export": "निर्यात", "share": "शेयर", "save": "यात्रा सहेजें" },
       "budget": { "budget": "किफायती", "standard": "मानक", "premium": "प्रीमियम" },
       "style": { "relaxed": "आरामदायक", "fast": "तेज़ गति" },
       "auth": { "email": "ईमेल", "password": "पासवर्ड", "name": "नाम", "login_title": "वापस स्वागत है", "register_title": "खाता बनाएं" },
       "common": { "loading": "लोड हो रहा है...", "error": "कुछ गलत हो गया", "retry": "पुनः प्रयास", "cancel": "रद्द करें", "save": "सहेजें", "delete": "हटाएं", "edit": "संपादित करें", "back": "पीछे", "next": "आगे" }
     }
     ```

4. **Frontend — Language Selector Component** (`frontend/src/components/common/LanguageSelector.tsx`):
   - Dropdown with flag icons: 🇬🇧 English | 🇮🇳 हिंदी
   - Place next to ThemeToggle in the header/navbar
   - Persist selection in localStorage

5. **Frontend — Update All Components**:
   - Replace ALL hardcoded English strings with `t('key')` calls
   - Update every page: Home, Planner, Login, Register, Dashboard, SharedTrip, Admin
   - Update all component text: buttons, labels, headings, placeholders, error messages
   - Import and use the `useTranslation` hook from react-i18next

6. **Frontend — RTL-Ready CSS** (for future Hindi/Urdu support):
   - Add `dir` attribute support to root layout
   - Hindi doesn't need RTL, but structure the CSS so adding Urdu later is easy

### Constraints
- Hindi translations must be natural, not Google Translate quality — use proper Hindi grammar
- Dynamic content (city names, place names, numbers) stays in English/original
- i18n must not break existing functionality
- Must handle pluralization correctly
- Language switch should be instant (no page reload)
- Date formatting should respect locale (use date-fns locale support — already installed)
```

---

## Prompt 8: Travel Companion / Group Trip Planning

```
## Task: Add Group Trip Planning & Companion Features

### Project Context
This is an India Travel Package Builder with:
- **Backend:** Express + TypeScript + Mongoose at `backend/src/` (port 3001)
- **Frontend:** React + Vite + TypeScript + Tailwind + Zustand at `frontend/src/`
- **Auth:** JWT auth, User model (name, email, password, role) at `backend/src/models/User.ts`
- **Saved Trips:** `backend/src/models/SavedTrip.ts` — saves tripRequest + tripResult per user
- **Share system:** `backend/src/models/SharedTrip.ts` — share trips via unique links
- **Email service:** `backend/src/services/emailService.ts` — can send emails via nodemailer
- **TripRequest:** has budget, travelStyle, constraints, duration

### What to Build

1. **Backend — TripGroup Model** (`backend/src/models/TripGroup.ts`):
   - Schema:
     ```typescript
     {
       tripId: ObjectId (ref SavedTrip, required),
       ownerId: ObjectId (ref User, required),
       name: string, // "Rajasthan Gang Trip 2026"
       members: [{
         userId?: ObjectId (ref User),
         email: string,
         name: string,
         role: 'owner' | 'editor' | 'viewer',
         status: 'invited' | 'accepted' | 'declined',
         invitedAt: Date,
         respondedAt?: Date
       }],
       chat: [{
         userId: ObjectId,
         userName: string,
         message: string,
         timestamp: Date
       }],
       polls: [{
         question: string,
         options: [{ text: string, votes: ObjectId[] }],
         createdBy: ObjectId,
         isActive: boolean,
         createdAt: Date
       }],
       maxMembers: number (default 10),
       createdAt: Date
     }
     ```

2. **Backend — Group Controller** (`backend/src/controllers/groupController.ts`):
   - `createGroup(req, res)` — create group from a saved trip
   - `inviteMembers(req, res)` — invite by email (sends email invite with join link)
   - `respondToInvite(req, res)` — accept/decline invite
   - `getMyGroups(req, res)` — get all groups user belongs to
   - `getGroup(req, res)` — get group details
   - `addChatMessage(req, res)` — add message to group chat
   - `createPoll(req, res)` — create a poll ("Which hotel? Budget or Standard?")
   - `votePoll(req, res)` — vote on a poll
   - `removeMembers(req, res)` — owner can remove members

3. **Backend — Routes** (`backend/src/routes/groupRoutes.ts`):
   - `POST /api/groups` — create group
   - `GET /api/groups` — my groups
   - `GET /api/groups/:id` — group details
   - `POST /api/groups/:id/invite` — invite members
   - `POST /api/groups/:id/respond` — accept/decline
   - `POST /api/groups/:id/chat` — add chat message
   - `GET /api/groups/:id/chat` — get chat history
   - `POST /api/groups/:id/polls` — create poll
   - `POST /api/groups/:id/polls/:pollId/vote` — vote
   - All require auth. Register in `backend/src/routes/index.ts`

4. **Frontend — Types** (`frontend/src/types/index.ts`):
   - Add `TripGroup`, `GroupMember`, `GroupChat`, `GroupPoll` interfaces

5. **Frontend — API** (`frontend/src/services/api.ts`):
   - Add all group CRUD, invite, chat, and poll functions

6. **Frontend — Group Trip Page** (`frontend/src/pages/GroupTrip.tsx`):
   - Route: `/group/:groupId` (add to App.tsx)
   - Layout: Itinerary view (left/main) + Group panel (right sidebar)
   - Group panel has tabs: "Members" | "Chat" | "Polls"
   - Members tab: show member list with status badges (invited/accepted), invite button
   - Chat tab: simple message list with input (doesn't need real-time — poll on 10s interval)
   - Polls tab: active polls with vote counts, create new poll button

7. **Frontend — Invite Modal** (`frontend/src/components/common/InviteModal.tsx`):
   - Email input (can add multiple emails, comma-separated)
   - Role selector: Editor (can modify itinerary) or Viewer (read-only)
   - Personal message textarea (optional)
   - "Send Invites" button

8. **Frontend — Poll Component** (`frontend/src/components/common/PollCard.tsx`):
   - Question text, option buttons with vote count bars
   - User can change their vote
   - Creator can close the poll
   - Results shown as horizontal bar chart after voting

9. **Frontend — Dashboard Integration**:
   - Add "Group Trips" tab to Dashboard page
   - Show groups with member avatars, trip destination, member count
   - Badge showing pending invites

### Constraints
- Group chat is simple (polling-based, not WebSocket) — good enough for trip planning
- Max 10 members per group
- Only owner and editors can modify the itinerary
- Email invites must work for users who don't have an account yet (they see the trip but must register to interact)
- Polls are for preference voting, not binding — owner makes final decisions
```

---

## Prompt 9: Accessibility Score & Wheelchair-Friendly Filters

```
## Task: Add Accessibility Scores & Wheelchair-Friendly Filtering

### Project Context
This is an India Travel Package Builder with:
- **Backend:** Express + TypeScript + Mongoose at `backend/src/` (port 3001)
- **Frontend:** React + Vite + TypeScript + Tailwind at `frontend/src/`
- **Place type:** has name, cityName, type, timeRequired, rating, tags[], priceTier, coordinates
- **Mock data:** `backend/src/services/mockData.ts` has PLACES array for Rajasthan cities
- **TripRequest.constraints:** `{ maxTravelHoursPerDay, seniorFriendly, morningReligious, noNightTravel }`
- **Planner:** `backend/src/services/planner.ts` — uses constraints to filter/adjust itinerary
- **Wizard:** `frontend/src/components/planner/Wizard/TripWizard.tsx`
- **Hotel type:** has amenities[] field

### What to Build

1. **Backend — Update Place Data** (in `backend/src/services/mockData.ts`):
   - Add `accessibility` field to every place in PLACES array:
     ```typescript
     accessibility: {
       wheelchairAccessible: boolean;
       hasRamp: boolean;
       hasElevator: boolean;
       hasAccessibleToilet: boolean;
       terrainType: 'flat' | 'moderate-slopes' | 'steep' | 'stairs-only' | 'mixed';
       mobilityNotes?: string; // "200 steps to reach the top", "Golf cart available"
       visualAidAvailable: boolean;
       audioGuideAvailable: boolean;
       score: number; // 1-5 accessibility score
     }
     ```
   - Populate realistically:
     - Amber Fort: score 2 (steep, stairs, elephants can carry up)
     - City Palace Jaipur: score 4 (mostly flat, some ramps)
     - Hawa Mahal: score 1 (narrow stairs, 5 floors)
     - Lake Pichola: score 5 (boat ride, flat embankment)
     - Mehrangarh Fort: score 2 (steep hill, elevator available in museum section)

2. **Backend — Update Place Model** (`backend/src/models/Place.ts`):
   - Add accessibility schema fields

3. **Backend — Update Planner** (`backend/src/services/planner.ts`):
   - Add new constraint: `wheelchairAccessible: boolean` to TripRequest.constraints
   - When `wheelchairAccessible` is true:
     - Filter out places with accessibility.score < 3
     - Add extra time buffer for accessible routes
     - Prefer hotels with accessibility amenities
   - When `seniorFriendly` is true (already exists):
     - Also filter places with terrainType 'steep' or 'stairs-only'
     - Add terrain warnings to activity descriptions

4. **Frontend — Types** (`frontend/src/types/index.ts`):
   - Add `Accessibility` interface to Place
   - Add `wheelchairAccessible: boolean` to TripRequest.constraints

5. **Frontend — Wizard Update** (in Wizard component):
   - Add "♿ Wheelchair Accessible Trip" toggle in the constraints step
   - When toggled: also check "Senior Friendly" automatically
   - Show info text: "We'll prioritize accessible places and routes"

6. **Frontend — Accessibility Badge** (`frontend/src/components/common/AccessibilityBadge.tsx`):
   - Small badge showing accessibility score (1-5) with color coding:
     - 5: 🟢 Fully Accessible
     - 4: 🟢 Mostly Accessible
     - 3: 🟡 Partially Accessible
     - 2: 🟠 Limited Access
     - 1: 🔴 Not Accessible
   - Click to expand: detailed accessibility info (ramps, elevators, terrain type, notes)

7. **Frontend — Display in Itinerary and Map**:
   - Show AccessibilityBadge on each activity card in the itinerary
   - On the map, accessible places get a ♿ overlay on their marker
   - In PlaceDetailModal, show full accessibility section

8. **Frontend — Accessibility Filter on Map**:
   - Toggle button on the map: "Show only accessible places"
   - When active, dim/hide places with score < 3

### Constraints
- Accessibility data should be realistic for Indian tourist sites
- Include specific notes like "Golf cart service available for ₹500" or "Elevator covers 3 of 5 floors"
- Must not make the app less accessible itself — use proper ARIA labels, alt text, keyboard navigation
- Senior-friendly and wheelchair-accessible are related but not identical — handle both
```

---

## Prompt 10: Trip Photo Journal & Travel Diary

```
## Task: Add Post-Trip Photo Journal & Travel Diary

### Project Context
This is an India Travel Package Builder with:
- **Backend:** Express + TypeScript + Mongoose at `backend/src/` (port 3001)
- **Frontend:** React + Vite + TypeScript + Tailwind + Zustand + framer-motion at `frontend/src/`
- **Auth:** JWT, User model, authMiddleware exist
- **Saved Trips:** `SavedTrip` model — stores per-user trip data
- **Photo Gallery:** `frontend/src/components/common/PhotoGallery.tsx` — lightbox gallery component exists
- **Dashboard:** `frontend/src/pages/Dashboard.tsx` — shows saved trips

### What to Build

1. **Backend — Journal Entry Model** (`backend/src/models/JournalEntry.ts`):
   - Schema:
     ```typescript
     {
       userId: ObjectId (ref User, required),
       tripId: ObjectId (ref SavedTrip, required),
       day: number,
       city: string,
       title: string,
       content: string, // Markdown text
       mood: 'amazing' | 'happy' | 'neutral' | 'tired' | 'challenging',
       photos: string[], // URLs (stored externally or as base64 data URIs for MVP)
       placeName?: string, // Which place the entry is about
       isPublic: boolean (default false),
       createdAt: Date,
       updatedAt: Date
     }
     ```

2. **Backend — Journal Controller** (`backend/src/controllers/journalController.ts`):
   - `createEntry(req, res)` — create journal entry
   - `getEntriesByTrip(req, res)` — get all entries for a trip
   - `updateEntry(req, res)` — update entry
   - `deleteEntry(req, res)` — delete entry
   - `getPublicJournal(req, res)` — get public entries for a trip (for shared viewing)
   - `uploadPhoto(req, res)` — handle photo upload (store as base64 data URI in DB for MVP, or accept external URL)

3. **Backend — Routes** (`backend/src/routes/journalRoutes.ts`):
   - `POST /api/journal` — create entry
   - `GET /api/journal/trip/:tripId` — entries for a trip
   - `GET /api/journal/trip/:tripId/public` — public entries (no auth needed)
   - `PUT /api/journal/:id` — update
   - `DELETE /api/journal/:id` — delete
   - `POST /api/journal/upload-photo` — upload photo
   - Register in `backend/src/routes/index.ts`

4. **Frontend — Types** (`frontend/src/types/index.ts`):
   - Add `JournalEntry` interface

5. **Frontend — API** (`frontend/src/services/api.ts`):
   - Add all journal CRUD + photo upload functions

6. **Frontend — Journal Editor** (`frontend/src/components/planner/Trip/JournalEditor.tsx`):
   - Rich text area (simple Markdown with preview toggle)
   - Mood selector: emoji buttons (😍 🙂 😐 😴 💪)
   - Photo upload: drag-and-drop zone + file picker (compress to max 1MB before upload)
   - Day and city auto-filled from trip itinerary
   - Optional place tag (dropdown of places from that day)
   - Public/Private toggle
   - Auto-save draft to localStorage

7. **Frontend — Journal  View** (`frontend/src/components/planner/Trip/JournalView.tsx`):
   - Beautiful timeline layout showing entries chronologically
   - Each entry: title, mood emoji, photos (use existing PhotoGallery), content text, city tag, date
   - Swipeable on mobile (day by day)
   - Scrolling parallax effect on photos using framer-motion

8. **Frontend — Journal Page** (`frontend/src/pages/Journal.tsx`):
   - Route: `/journal/:tripId` (add to App.tsx)
   - If trip owner: can view + edit entries
   - If public link: read-only view
   - "Add Entry" floating action button

9. **Frontend — Dashboard Integration**:
   - On saved trip cards, show "📔 Journal" button
   - Badge showing number of entries
   - Small preview: last entry's mood emoji + first photo thumbnail

10. **Frontend — Public Journal Sharing**:
    - "Share Journal" button generates a public link
    - Public view shows a beautiful read-only timeline
    - Can be shared on social media

### Constraints
- Photos stored as base64 data URIs for MVP (no cloud storage needed)
- Compress images client-side before upload (max 1MB each, max 5 per entry)
- Markdown rendering: support bold, italic, headers, lists (use a simple regex-based renderer, no heavy library)
- Auto-save drafts to localStorage to prevent data loss
- Journal is optional — users can skip it entirely
```

---

## Prompt 11: Smart Notifications & Trip Reminders

```
## Task: Add Smart Notifications & Trip Reminders

### Project Context
This is an India Travel Package Builder with:
- **Backend:** Express + TypeScript + Mongoose at `backend/src/` (port 3001)
- **Frontend:** React + Vite + TypeScript + Tailwind + Zustand at `frontend/src/`
- **Auth:** JWT, User model exist
- **Saved Trips:** SavedTrip model stores trips with tripRequest and tripResult
- **Email service:** `backend/src/services/emailService.ts` — sends emails via nodemailer
- **PWA:** App has service worker support (vite-plugin-pwa configured)
- **Weather service:** `backend/src/services/weatherService.ts` exists
- **Festival data:** will exist after festival feature is added

### What to Build

1. **Backend — Notification Model** (`backend/src/models/Notification.ts`):
   - Schema:
     ```typescript
     {
       userId: ObjectId (ref User, required),
       type: 'trip_reminder' | 'weather_alert' | 'price_change' | 'review_prompt' | 'festival_alert' | 'system',
       title: string,
       message: string,
       actionUrl?: string, // Deep link in the app
       isRead: boolean (default false),
       priority: 'low' | 'medium' | 'high',
       metadata?: Record<string, any>, // Extra data per notification type
       createdAt: Date,
       expiresAt?: Date
     }
     ```

2. **Backend — Notification Service** (`backend/src/services/notificationService.ts`):
   - `createNotification(userId, data)` — create and store notification
   - `generateTripReminders()` — scheduled job that:
     - 7 days before trip: "Your trip to Rajasthan starts in 7 days! Check your packing list."
     - 1 day before: "Tomorrow's the day! Here's your Day 1 summary."
     - Morning of each trip day: "Good morning! Here's today's plan in [City]."
   - `generateWeatherAlerts(userId, tripId)` — check weather for upcoming trip, alert if extreme
   - `markAsRead(notificationId)`, `markAllAsRead(userId)`
   - `getUnreadCount(userId)`

3. **Backend — Notification Controller** (`backend/src/controllers/notificationController.ts`):
   - `getNotifications(req, res)` — paginated, filterable by type and read status
   - `markAsRead(req, res)` — mark single notification read
   - `markAllAsRead(req, res)` — mark all as read
   - `getUnreadCount(req, res)` — return count for badge
   - `deleteNotification(req, res)`

4. **Backend — Routes** (`backend/src/routes/notificationRoutes.ts`):
   - `GET /api/notifications` — list notifications
   - `GET /api/notifications/unread-count` — count for badge
   - `PUT /api/notifications/:id/read` — mark read
   - `PUT /api/notifications/read-all` — mark all read
   - `DELETE /api/notifications/:id` — delete
   - All require auth. Register in `backend/src/routes/index.ts`

5. **Frontend — Types** (`frontend/src/types/index.ts`):
   - Add `Notification` interface

6. **Frontend — API** (`frontend/src/services/api.ts`):
   - Add notification API functions

7. **Frontend — Notification Store** (`frontend/src/stores/notificationStore.ts`):
   - Zustand store: `notifications[]`, `unreadCount`, `isLoading`
   - Actions: `fetchNotifications()`, `markAsRead(id)`, `markAllAsRead()`, `pollUnreadCount()` (every 60s)

8. **Frontend — Notification Bell** (`frontend/src/components/common/NotificationBell.tsx`):
   - Bell icon (Lucide `Bell`) in the header/navbar
   - Red badge with unread count
   - On click: dropdown panel showing recent notifications
   - Each notification: icon by type, title, time ago, read/unread dot
   - Click notification: navigate to actionUrl, mark as read
   - "Mark all as read" link at bottom
   - "View all" link to full notification page

9. **Frontend — Notification Panel** (`frontend/src/pages/Notifications.tsx`):
   - Route: `/notifications` (add to App.tsx)
   - Full list with filters: All | Trip Reminders | Weather Alerts | System
   - Swipe to dismiss on mobile
   - Empty state: "All caught up! No new notifications."

### Constraints
- Polling-based (check every 60s), not WebSocket
- Notifications auto-expire after 30 days
- Don't spam users — max 3 notifications per day per user
- Trip reminders only work when user has saved trips with dates
- Must handle timezone (IST) correctly for morning reminders
```

---

## Prompt 12: Travel Insurance & Visa Info Widget

```
## Task: Add Travel Insurance Suggestions & Visa Information

### Project Context
This is an India Travel Package Builder with:
- **Backend:** Express + TypeScript at `backend/src/` (port 3001)
- **Frontend:** React + Vite + TypeScript + Tailwind at `frontend/src/`
- **TripResult.summary:** has totalCost, totalDistance, duration (days)
- **Itinerary view:** `frontend/src/components/planner/Itinerary/`
- **Packing list exists:** `backend/src/services/packingListService.ts`
- **Safety info will exist** (from safety feature)

### What to Build

1. **Backend — Travel Info Service** (`backend/src/services/travelInfoService.ts`):
   - Function `getInsuranceRecommendations(duration: number, budget: string, constraints: any)`:
     - Returns recommended insurance tiers:
       - Basic (₹200-500): Medical emergency, trip cancellation
       - Standard (₹500-1500): + Baggage loss, flight delay, adventure sports
       - Premium (₹1500-3000): + Personal liability, home burglary cover, 24/7 concierge
     - Adjust based on: seniorFriendly → recommend higher medical cover, adventure activities → adventure sports cover
     - Include links to actual insurance comparison sites (PolicyBazaar, Coverfox)
   
   - Function `getVisaInfo(nationality: string)`:
     - For India travel: e-Visa, Visa on Arrival, regular visa info
     - Return: `{ visaRequired: boolean, visaType: string, processingTime: string, cost: string, documents: string[], applicationUrl: string, tips: string[] }`
     - Cover top nationalities: US, UK, Canada, Australia, EU countries, etc.
     - Indian nationals: no visa needed, but ID requirements
   
   - Function `getTravelRequirements()`:
     - Vaccination recommendations for India
     - SIM card info (Jio tourist SIM, Airtel)
     - Currency info (INR, where to exchange, UPI for tourists)
     - Electric plug type (Type C, D, M — 230V)

2. **Backend — Route** (add to `backend/src/routes/itineraryRoutes.ts`):
   - `POST /api/itinerary/travel-info` — accepts `{ duration, budget, constraints, nationality? }`
   - Returns insurance recommendations, visa info, travel requirements

3. **Frontend — Travel Info Component** (`frontend/src/components/planner/Itinerary/TravelInfo.tsx`):
   - Collapsible section "ℹ️ Travel Essentials" in the itinerary view
   - Three tabs: "Insurance" | "Visa & Documents" | "Practical Info"
   - Insurance tab: comparison cards (Basic/Standard/Premium) with coverage lists and price ranges, "Compare on PolicyBazaar →" external link
   - Visa tab: nationality selector dropdown, then shows visa requirements
   - Practical tab: SIM cards, currency, plugs, vaccinations as info cards

4. **Frontend — Types & API**:
   - Add types for InsuranceRecommendation, VisaInfo, TravelRequirements
   - Add API function in `frontend/src/services/api.ts`

### Constraints
- Insurance prices are indicative ranges, not binding quotes — add disclaimer
- Visa information must be accurate as of 2026 (India e-Visa program)
- All external links open in new tabs
- This is informational only — no actual booking/purchasing in the app
- Include Indian nationals scenario (no visa, but Aadhaar/PAN needed for domestic travel)
```

---

## Prompt 13: Social Feed — Discover Other Travelers' Trips

```
## Task: Add Social Discovery Feed — Explore Public Trips

### Project Context
This is an India Travel Package Builder with:
- **Backend:** Express + TypeScript + Mongoose at `backend/src/` (port 3001)
- **Frontend:** React + Vite + TypeScript + Tailwind + Zustand + framer-motion at `frontend/src/`
- **Auth:** JWT, User model (name, email, role)
- **Saved Trips:** SavedTrip model stores trips per user
- **Shared Trips:** SharedTrip model has shareId, tripRequest, tripResult, viewCount
- **Reviews:** Review model with ratings per place
- **Photo Gallery component exists**
- **Pages:** Home, Planner, Dashboard, SharedTrip

### What to Build

1. **Backend — Update SavedTrip Model** (`backend/src/models/SavedTrip.ts`):
   - Add fields: `isPublic: boolean (default false)`, `likes: number (default 0)`, `tags: string[]`, `coverImage?: string`

2. **Backend — Feed Controller** (`backend/src/controllers/feedController.ts`):
   - `getPublicTrips(req, res)` — paginated list of public trips, sorted by likes/recent
   - Query params: `sort=popular|recent|trending`, `state=RJ`, `duration=3-5`, `budget=budget|standard|premium`, `page=1&limit=10`
   - `likeTrip(req, res)` — toggle like on a public trip (auth required)
   - `getTrendingDestinations(req, res)` — aggregate most-visited cities from public trips
   - `getUserProfile(req, res)` — public user profile with their public trips and review count

3. **Backend — Routes** (`backend/src/routes/feedRoutes.ts`):
   - `GET /api/feed` — public trip feed
   - `GET /api/feed/trending` — trending destinations
   - `POST /api/feed/:tripId/like` — like/unlike
   - `GET /api/feed/user/:userId` — user's public profile
   - Register in `backend/src/routes/index.ts`

4. **Frontend — Types** (`frontend/src/types/index.ts`):
   - Add `PublicTrip` interface (SavedTrip + user info + likes)

5. **Frontend — API** (`frontend/src/services/api.ts`):
   - Add feed API functions

6. **Frontend — Explore Page** (`frontend/src/pages/Explore.tsx`):
   - Route: `/explore` (add to App.tsx)
   - **Hero section:** "Discover trips by fellow travelers"
   - **Trending bar:** horizontal scroll of trending destinations with photo cards
   - **Trip feed:** Instagram-style card grid:
     - Cover image (from first place or itinerary map thumbnail)
     - Trip title, creator name, state, duration, budget badge
     - Like count (❤️) and view count (👁️)
     - Tags: "Solo", "Family", "Adventure", "Culture", "Food Lover"
   - **Filters:** sidebar/top bar with state, duration range, budget, tags, sort
   - **Infinite scroll pagination**

7. **Frontend — Trip Card Component** (`frontend/src/components/common/TripCard.tsx`):
   - Reusable card for feed and dashboard
   - Image, overlaid title, creator avatar/name, stats bar (❤️ likes, 📅 days, 💰 budget)
   - Click: navigate to `/trip/:shareId` to view full itinerary
   - Like button with animation (framer-motion scale bounce)

8. **Frontend — Publish Trip Flow** (update Dashboard):
   - On saved trip cards, add "Publish to Community" toggle
   - When publishing: ask for title, tags (multi-select), cover image selection
   - Show disclaimer: "Your itinerary will be visible to all users"

9. **Frontend — Navigation**:
   - Add "Explore" link in main navbar between "Home" and "Plan Trip"
   - Show on Home page as a section: "See what others are planning"

10. **Frontend — User Public Profile Modal/Page**:
    - Click on trip creator name → see their public trips, review count, member since date
    - Simple profile: avatar placeholder (initials), name, trip count, total reviews

### Constraints
- Only public trips are shown — users explicitly opt-in to publish
- No private data exposed (email, exact hotel bookings, etc.)
- Likes require auth but browsing the feed doesn't
- Infinite scroll: load 10 trips at a time
- Trending algorithm: (likes * 2 + views) in the last 30 days
- Trip cards must be responsive: 3 columns desktop, 2 tablet, 1 mobile
```

---

## Prompt 14: Custom Map Stickers & Trip Postcards

```
## Task: Add Custom Trip Postcards & Map Sticker Generation

### Project Context
This is an India Travel Package Builder with:
- **Frontend:** React + Vite + TypeScript + Tailwind + framer-motion at `frontend/src/`
- **Backend:** Express + TypeScript at `backend/src/` (port 3001)
- **Map:** react-leaflet with OpenStreetMap in `frontend/src/components/planner/Map/Map.tsx`
- **jsPDF installed:** `jspdf` in `frontend/package.json`
- **TripResult:** has itinerary with cities, activities, total cost, distance
- **Place images exist:** Place type has `images?: string[]`, `thumbnailUrl?: string`
- **City type:** has name, coordinates, description

### What to Build

1. **Frontend — Postcard Generator** (`frontend/src/components/planner/Trip/PostcardGenerator.tsx`):
   - Generate a beautiful shareable postcard image from trip data
   - Canvas-based rendering (use HTML Canvas API):
     - Background: gradient with state theme color
     - Map thumbnail: capture current map view as static image (use Leaflet's built-in screenshot or dom-to-image)
     - Route line overlay on map
     - Trip stats: "5 Days | 3 Cities | ₹25,000"
     - City names along the route
     - "My Rajasthan Adventure" heading (editable)
     - QR code linking to shared trip (use a simple QR code generator)
   - Install: `npm install qrcode html-to-image` in `frontend/`
   - Templates: 3 postcard styles:
     - Classic: vintage postcard look with stamp-like badges
     - Modern: clean minimal with bold typography
     - Colorful: vibrant gradient with emoji accents

2. **Frontend — Postcard Editor** (`frontend/src/components/planner/Trip/PostcardEditor.tsx`):
   - WYSIWYG postcard editor with:
     - Template selector (3 templates)
     - Edit title text
     - Toggle elements on/off (map, stats, QR code, route)
     - Color theme picker (warm/cool/earthy)
     - Add custom message text
   - Real-time preview as user edits
   - "Download as Image" button (PNG, 1200x630 — optimized for social sharing)
   - "Share" button (use Web Share API if available, otherwise copy to clipboard)

3. **Frontend — Trip Statistics Card** (`frontend/src/components/planner/Trip/TripStatsCard.tsx`):
   - Infographic-style summary card:
     - Total distance with a fun comparison ("Equivalent to Delhi → Mumbai 2x!")
     - Cities visited as connected dots
     - Budget breakdown as donut chart
     - Top-rated place visited
     - Travel modes used (icons for train, car, bus)
     - Duration with sunrise/sunset emoji
   - Downloadable as PNG
   - Shareable on social media

4. **Frontend — Map Sticker Component** (`frontend/src/components/planner/Map/MapSticker.tsx`):
   - Generate a sticker-style graphic of the trip route on the map
   - Circular or rectangular crop of the map with route
   - Visited cities as dots with labels
   - "I traveled through Rajasthan!" text overlay
   - Download as transparent PNG (for social media profile pictures)

5. **Frontend — Export Section** (update `frontend/src/components/planner/Itinerary/ExportButtons.tsx`):
   - Add "🎨 Create Postcard" button to export options
   - Opens the PostcardEditor in a modal
   - After saving: option to share directly or download

6. **Backend — Social Metadata** (update share endpoint):
   - When a shared trip is accessed, serve Open Graph meta tags:
     - `og:title`: trip title
     - `og:description`: "5-day Rajasthan adventure — Jaipur, Jodhpur, Udaipur"
     - `og:image`: postcard or map thumbnail URL
   - This makes shared links look good when pasted on WhatsApp, Twitter, etc.

### Constraints
- Use HTML Canvas API and html-to-image for rendering — no server-side image generation
- Postcards must be exactly 1200x630px (optimal for social media sharing)
- QR code should use a lightweight library (qrcode package)
- Must work on mobile (touch-friendly editor)
- Downloaded images should be high quality (2x resolution for retina)
- Don't require any external image processing service
```

---

## Prompt 15: AI-Powered Trip Suggestions & Natural Language Planning

```


## General Tips

1. **Recommended execution order for V2:**
   - Start with **AI Trip Suggestions** (Prompt 15) — huge UX win, no external deps
   - Then **Festivals Calendar** (Prompt 3) — enriches planning with cultural context
   - Then **Emergency & Safety** (Prompt 2) — important for a travel app
   - Then **Budget Tracker** (Prompt 4) — complements existing cost estimation
   - Then **Animated Route Map** (Prompt 6) — visual wow factor
   - Then **Booking Deep Links** (Prompt 5) — monetization-ready
   - Then remaining features in any order

2. **After each prompt execution**, verify with `npm run build` in both `frontend/` and `backend/`

3. **If a prompt fails mid-execution**, paste the error and ask the agent to fix it

4. **These prompts are independent** but some pair well together:
   - Festivals + Travel Info = comprehensive trip preparation
   - Budget Tracker + Booking Links = end-to-end trip management
   - Social Feed + Photo Journal = community features
   - Group Planning + Notifications = collaborative features
