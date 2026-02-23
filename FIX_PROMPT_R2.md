# Fix Prompt — Round 2: Remaining Issues & INR Currency

> **Target Model:** Claude Opus 4.6
> **Project:** India Travel Package Builder — Next.js App Router MVP
> **Root:** `d:\krish\new_test` (the `src/` directory is the Next.js app)
> **Scope:** Only modify files under `src/`. Do NOT touch `frontend/` or `backend/`.

---

## Context

This is a Next.js MVP travel planner for India. Round 1 fixed 14 issues (missing API routes, planner constraints, download, images, dates, etc.). This Round 2 addresses **remaining critical bugs, INR currency conversion, and UX gaps**.

### Key Files:
- `src/app/page.tsx` — Main page with map + wizard
- `src/lib/planner.ts` — Itinerary generation logic
- `src/components/Wizard/TripWizard.tsx` — 3-step wizard
- `src/components/Itinerary/ItineraryView.tsx` — Day-wise timeline display
- `src/components/Map/Map.tsx` — Leaflet map with GeoJSON + markers
- `src/app/api/generate-trip/route.ts` — POST endpoint for trip generation
- `src/app/globals.css` — Global styles

---

## TASK LIST — Complete every task. Do not skip any.

---

### TASK 1: Fix Place Markers Triggering City Toggle (CRITICAL)

**Problem:** In `src/app/page.tsx`, the `mapMarkers` useMemo combines both city markers and place markers into one array. Both are passed to the Map via `onMarkerClick={handleCityToggle}`. When a user clicks a **place** marker (e.g., id `"amber_fort"`), it adds `"amber_fort"` to `selectedCityIds`. The planner then does `MOCK_CITIES.filter(c => selectedCityIds.includes(c._id))` — `"amber_fort"` matches nothing, so that selection is silently lost. Worse, the orange "selected" icon shows on the place marker, misleading the user.

**Current code in `src/app/page.tsx` (~line 113-140):**
```typescript
const mapMarkers = useMemo(() => {
  // ...
  const cityMarkers = filteredCities.map(c => ({
    id: c._id,
    // ...
  }));

  const placeMarkers = filteredPlaces.map(p => ({
    id: p._id,
    // ...
  }));

  return [...cityMarkers, ...placeMarkers];
}, [config.cities, places, selectedState]);
```

**Fix:** Separate city markers and place markers. Only city markers should be clickable/selectable. Modify the approach:

1. Keep `mapMarkers` returning both city and place markers, but add a `type` field to distinguish them:
   ```typescript
   const cityMarkers = filteredCities.map(c => ({
     id: c._id,
     lat: c.coordinates.lat,
     lng: c.coordinates.lng,
     title: c.name,
     description: `Ideal Days: ${c.idealDays} | Tier: ${c.tier}`,
     markerType: 'city' as const,
   }));

   const placeMarkers = filteredPlaces.map(p => ({
     id: p._id,
     lat: p.coordinates.lat,
     lng: p.coordinates.lng,
     title: p.name,
     description: `${p.type} in ${p.cityName}`,
     markerType: 'place' as const,
     cityName: p.cityName,
     visitDuration: `${p.timeRequired}h`,
     bestTime: p.bestTimeOfDay,
     entryFee: p.priceTier,
   }));
   ```

2. Update `handleCityToggle` (or create a new handler) to handle both marker types:
   ```typescript
   const handleMarkerClick = (id: string) => {
     // Check if this is a city marker
     const city = config.cities.find(c => c._id === id);
     if (city) {
       handleCityToggle(id);
       return;
     }
     // If it's a place marker, select the parent city instead
     const place = places.find(p => p._id === id);
     if (place) {
       const parentCity = config.cities.find(c => c.name === place.cityName);
       if (parentCity && !selectedCityIds.includes(parentCity._id)) {
         handleCityToggle(parentCity._id);
       }
     }
   };
   ```

3. Pass `handleMarkerClick` instead of `handleCityToggle` to the Map:
   ```typescript
   <Map
     ...
     onMarkerClick={handleMarkerClick}
     ...
   />
   ```

4. Update `selectedMarkers` to only highlight city markers (not place markers):
   Keep `selectedMarkers={selectedCityIds}` as-is — this is already correct since place IDs won't match.

---

### TASK 2: Fix Map Popup Property Name Mismatch (CRITICAL)

**Problem:** In `src/app/page.tsx` (~line 129-133), place markers are mapped with wrong property names:
```typescript
const placeMarkers = filteredPlaces.map(p => ({
  // ...
  visitDuration: p.visitDuration,   // WRONG — mock data uses `timeRequired`
  bestTime: p.bestTime,             // WRONG — mock data uses `bestTimeOfDay`
  entryFee: p.entryFee              // WRONG — mock data uses `priceTier`
}));
```

These properties are `undefined` since `MOCK_PLACES` has `timeRequired`, `bestTimeOfDay`, and `priceTier`. The Map popup conditionally renders these, so they simply never show.

**Fix:** This is already addressed by Task 1's place marker mapping above. If you implement Task 1, ensure the corrected property names are:
```typescript
visitDuration: `${p.timeRequired}h`,
bestTime: p.bestTimeOfDay,
entryFee: p.priceTier,
```

---

### TASK 3: Fix `routeCoordinates` Missing Dependency (CRITICAL)

**Problem:** In `src/app/page.tsx` (~line 147), the `routeCoordinates` useMemo uses `config.cities` inside the callback but doesn't list it in the dependency array:
```typescript
const routeCoordinates = useMemo(() => {
  // ... uses config.cities.find(...)
}, [tripResult]);  // MISSING: config.cities
```

This causes stale closures — if `tripResult` is set before `config.cities` loads, the route won't render.

**Fix:** Add `config.cities` to the dependency array:
```typescript
}, [tripResult, config.cities]);
```

---

### TASK 4: Add Error Handling to Config Fetch (CRITICAL)

**Problem:** In `src/app/page.tsx` (~line 24-31), the `fetch('/api/config')` chain has no `.catch()`:
```typescript
fetch('/api/config')
  .then(res => res.json())
  .then(data => {
    setConfig(data);
  });
```
If the API fails, the promise rejection is unhandled, and the user sees an empty wizard with no feedback.

**Fix:** Add `.catch()` and a loading/error state:

1. Add state variables at the top of the component:
   ```typescript
   const [configLoading, setConfigLoading] = useState(true);
   const [configError, setConfigError] = useState<string | null>(null);
   ```

2. Update the fetch:
   ```typescript
   useEffect(() => {
     setConfigLoading(true);
     fetch('/api/config')
       .then(res => {
         if (!res.ok) throw new Error('Failed to load configuration');
         return res.json();
       })
       .then(data => {
         setConfig(data);
         setConfigError(null);
       })
       .catch(err => {
         console.error('Error fetching config:', err);
         setConfigError('Failed to load trip data. Please refresh the page.');
       })
       .finally(() => setConfigLoading(false));

     fetch('/api/places')
       .then(res => {
         if (!res.ok) throw new Error('Failed to load places');
         return res.json();
       })
       .then(data => setPlaces(data))
       .catch(err => console.error('Error fetching places:', err));
   }, []);
   ```

3. Show loading/error state in the sidebar area (before the `<TripWizard>` render):
   ```typescript
   {configLoading ? (
     <div className="bg-white p-6 shadow-lg rounded-lg h-full flex items-center justify-center">
       <div className="text-center">
         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
         <p className="text-gray-500">Loading trip data...</p>
       </div>
     </div>
   ) : configError ? (
     <div className="bg-white p-6 shadow-lg rounded-lg h-full flex items-center justify-center">
       <div className="text-center">
         <p className="text-red-600 mb-4">{configError}</p>
         <button onClick={() => window.location.reload()} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
           Retry
         </button>
       </div>
     </div>
   ) : !tripResult ? (
     <TripWizard ... />
   ) : (
     <ItineraryView ... />
   )}
   ```

---

### TASK 5: Guard Against NaN Duration Input (CRITICAL)

**Problem:** In `src/components/Wizard/TripWizard.tsx` (~line 99), if the user clears the duration input field:
```typescript
onChange={e => setFormData({...formData, duration: parseInt(e.target.value)})}
```
`parseInt('')` returns `NaN`. This propagates into the planner where `Math.floor(NaN / totalCities)` = `NaN`, producing an empty or broken itinerary with no error.

**Fix:** Guard the parse:
```typescript
onChange={e => {
  const val = parseInt(e.target.value);
  setFormData({...formData, duration: isNaN(val) ? 1 : Math.max(1, Math.min(30, val))});
}}
```

---

### TASK 6: Guard Against Division by Zero in Cost Breakup (CRITICAL)

**Problem:** In `src/components/Itinerary/ItineraryView.tsx` (~line 102-105):
```typescript
Stay: {Math.round((summary.costBreakup.stay / summary.totalCost) * 100)}% |
Food: {Math.round((summary.costBreakup.food / summary.totalCost) * 100)}%
```
If `totalCost` is 0 (edge case: 0-duration trip), this produces `NaN` displayed in the UI.

**Fix:** Create a helper and use it:
```typescript
const pct = (value: number) => summary.totalCost > 0 ? Math.round((value / summary.totalCost) * 100) : 0;
```
Then use:
```typescript
Stay: {pct(summary.costBreakup.stay)}% |
Food: {pct(summary.costBreakup.food)}%
```

---

### TASK 7: Convert Costs to INR (Indian Rupees) — MAIN CURRENCY FIX

**Problem:** In `src/lib/planner.ts` (~line 80-84), the `COSTS` object uses values that are clearly in USD:
```typescript
const COSTS = {
  budget: { stay: 30, food: 15, transportPerKm: 0.15, activityAvg: 5 },
  standard: { stay: 70, food: 35, transportPerKm: 0.30, activityAvg: 15 },
  premium: { stay: 150, food: 80, transportPerKm: 0.80, activityAvg: 30 },
};
```
₹30/night hotel and ₹15/day food are completely unrealistic for India. The UI already displays `₹` everywhere, so the underlying values need to be in INR.

**Fix:** Replace with realistic Indian Rupee values based on actual Rajasthan travel costs:

```typescript
const COSTS = {
  budget: {
    stay: 1200,         // ₹1,200/night (budget guesthouse/hostel)
    food: 500,          // ₹500/day (street food + local restaurants)
    transportPerKm: 8,  // ₹8/km (shared taxi, bus)
    activityAvg: 200,   // ₹200 avg entry fee (many budget sites are ₹50-300)
  },
  standard: {
    stay: 3500,         // ₹3,500/night (3-star hotel)
    food: 1200,         // ₹1,200/day (mid-range restaurants)
    transportPerKm: 14, // ₹14/km (private taxi/cab)
    activityAvg: 500,   // ₹500 avg entry fee (guided tours, premium entries)
  },
  premium: {
    stay: 10000,        // ₹10,000/night (heritage hotel/palace stay)
    food: 3000,         // ₹3,000/day (fine dining, hotel restaurants)
    transportPerKm: 25, // ₹25/km (luxury car, AC SUV with driver)
    activityAvg: 1500,  // ₹1,500 avg (private guides, VIP access, experiences)
  },
};
```

**Verify:** After this change, a 5-day budget trip to 2 cities should cost roughly ₹15,000-25,000 (realistic for Rajasthan). A premium 5-day trip should be ₹80,000-1,50,000. Check that the ItineraryView shows these realistic INR amounts.

---

### TASK 8: Display Dates in Itinerary Timeline

**Problem:** The planner now generates `day.date` (e.g., `"2026-03-15"`), but `src/components/Itinerary/ItineraryView.tsx` (~line 107-108) only shows:
```tsx
<span className="text-xs font-bold text-indigo-600 uppercase tracking-wide">Day {day.day}</span>
<h3 className="text-lg font-bold text-gray-800">{day.city}</h3>
```
The date is never rendered.

**Fix:** Display the date next to the day label. Format it nicely using the built-in `Date` API:
```tsx
<span className="text-xs font-bold text-indigo-600 uppercase tracking-wide">
  Day {day.day}
  {day.date && (
    <span className="text-gray-400 font-normal ml-2">
      {new Date(day.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
    </span>
  )}
</span>
<h3 className="text-lg font-bold text-gray-800">{day.city}</h3>
```

This displays like: **Day 1** *Sun, 15 Mar 2026* — using Indian English locale.

Also update the download function's day header to include the date:
```typescript
text += `--- Day ${day.day}${day.date ? ` (${day.date})` : ''}: ${day.city} ---\n`;
```

---

### TASK 9: Fix Feasibility Severity Downgrade Bug

**Problem:** In `src/lib/planner.ts` (~line 259-261):
```typescript
if (placesVisited < 2 * duration && travelStyle === 'fast') feasibility = 'not recommended';
if (totalCities / duration > 0.5) feasibility = 'tight';  // THIS OVERWRITES THE ABOVE!
```
The second check can **downgrade** severity from `'not recommended'` to `'tight'`. With 3 cities over 4 days (ratio 0.75 > 0.5), the trip gets marked `'tight'` even if the first check already flagged `'not recommended'`.

**Fix:** Use escalation logic — only upgrade severity, never downgrade:
```typescript
let feasibility: 'comfortable' | 'tight' | 'not recommended' = 'comfortable';
const placesVisited = itinerary.reduce((acc, day) => acc + day.activities.length, 0);

if (totalCities / duration > 0.5) feasibility = 'tight';
if (placesVisited < 2 * duration && travelStyle === 'fast') feasibility = 'not recommended';
```

Simply swap the order — check for `'tight'` first, then only escalate to `'not recommended'` (never override with a lesser severity).

---

### TASK 10: Guard `city.description.substring()` Against Undefined

**Problem:** In `src/components/Wizard/TripWizard.tsx` (~line 79):
```tsx
<div className="text-xs text-gray-500">{city.description.substring(0, 40)}...</div>
```
If any city object lacks a `description` property, this crashes: `Cannot read properties of undefined (reading 'substring')`. The type is `any[]` so nothing guarantees it.

**Fix:**
```tsx
<div className="text-xs text-gray-500">{(city.description || '').substring(0, 40)}...</div>
```

---

### TASK 11: Add Input Validation to `generate-trip` API

**Problem:** In `src/app/api/generate-trip/route.ts`, only `selectedCityIds` is validated:
```typescript
if (!body.selectedCityIds || body.selectedCityIds.length === 0) {
  return NextResponse.json({ error: 'No cities selected' }, { status: 400 });
}
```
No validation for `duration`, `budget`, or `travelStyle`. A request with `duration: -1` or `budget: 'hacked'` crashes the planner.

**Fix:** Add comprehensive validation:
```typescript
export async function POST(request: Request) {
  try {
    const body: TripRequest = await request.json();

    // Validate inputs
    if (!body.selectedCityIds || body.selectedCityIds.length === 0) {
      return NextResponse.json({ error: 'No cities selected' }, { status: 400 });
    }
    if (!body.duration || body.duration < 1 || body.duration > 30) {
      return NextResponse.json({ error: 'Duration must be between 1 and 30 days' }, { status: 400 });
    }
    if (!['budget', 'standard', 'premium'].includes(body.budget)) {
      return NextResponse.json({ error: 'Invalid budget tier' }, { status: 400 });
    }
    if (!['relaxed', 'fast'].includes(body.travelStyle)) {
      return NextResponse.json({ error: 'Invalid travel style' }, { status: 400 });
    }

    const result = await generateTrip(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Planner Error:', error);
    return NextResponse.json({ error: 'Failed to generate trip' }, { status: 500 });
  }
}
```

---

### TASK 12: Fix Dark Mode CSS Conflict

**Problem:** `src/app/globals.css` has a dark mode media query that sets `--background: #0a0a0a`, but all components use hardcoded Tailwind classes like `bg-white`, `bg-gray-100`, `text-gray-800`. Users with OS dark mode see a flash of dark background then white Tailwind components — inconsistent and jarring.

**Current code:**
```css
@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}
```

**Fix:** Since the app doesn't support dark mode, remove the dark mode override to prevent conflicts:
```css
/* Remove the entire @media (prefers-color-scheme: dark) block */
```

The `globals.css` should only contain:
```css
@import "tailwindcss";

:root {
  --background: #ffffff;
  --foreground: #171717;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: Arial, Helvetica, sans-serif;
}
```

---

### TASK 13: Remove Unused Imports

**Problem:** Several files have unused imports that add to bundle size and clutter.

**Fix all at once:**

1. **`src/lib/planner.ts` line 3** — Remove `import { v4 as uuidv4 } from 'uuid';` (never used)

2. **`src/app/page.tsx` line 8** — Remove `MapPin` from the import:
   ```typescript
   // BEFORE:
   import { MapPin } from 'lucide-react';
   // AFTER: remove the entire line (MapPin is not used in page.tsx)
   ```

3. **`src/components/Itinerary/ItineraryView.tsx` line 4** — Remove unused icons:
   ```typescript
   // BEFORE:
   import { Car, Hotel, Map, Moon, Sun, AlertTriangle, Download, ArrowLeft } from 'lucide-react';
   // AFTER:
   import { Car, Moon, Download, ArrowLeft } from 'lucide-react';
   ```
   Only `Car`, `Moon`, `Download`, and `ArrowLeft` are actually used in the component.

---

### TASK 14: Warn When More Cities Than Days

**Problem:** In `src/lib/planner.ts`, if the user selects 4 cities for a 3-day trip, `daysPerCity = Math.floor(3/4) = 0` and `extraDays = 3`. The first 3 cities each get 1 day; the 4th gets 0 days and is silently skipped — no warning.

**Fix:** Add a check at the beginning of `generateTrip` to warn when cities exceed days. Add a `warnings` field to `TripResult`:

1. Update the `TripResult` interface:
   ```typescript
   export interface TripResult {
     itinerary: DayItinerary[];
     summary: {
       totalCost: number;
       totalDistance: number;
       feasibility: 'comfortable' | 'tight' | 'not recommended';
       costBreakup: {
         stay: number;
         transport: number;
         activities: number;
         food: number;
       };
       warnings: string[];
     };
   }
   ```

2. In `generateTrip`, track warnings:
   ```typescript
   const warnings: string[] = [];

   if (totalCities > duration) {
     const skippedCities = cities.slice(duration).map(c => c.name);
     warnings.push(`Not enough days for all cities. ${skippedCities.join(', ')} will be skipped.`);
   }
   ```

3. Include warnings in the return:
   ```typescript
   return {
     itinerary,
     summary: {
       totalCost,
       totalDistance: totalDist,
       feasibility,
       costBreakup,
       warnings
     }
   };
   ```

4. Display warnings in `src/components/Itinerary/ItineraryView.tsx` — add this block after the Summary Stats section and before the Timeline:
   ```tsx
   {/* Warnings */}
   {summary.warnings && summary.warnings.length > 0 && (
     <div className="px-4 py-3 bg-amber-50 border-b border-amber-200">
       {summary.warnings.map((w, i) => (
         <div key={i} className="flex items-start gap-2 text-sm text-amber-800">
           <span className="shrink-0">⚠️</span>
           <span>{w}</span>
         </div>
       ))}
     </div>
   )}
   ```

---

## VERIFICATION CHECKLIST

After completing all tasks, verify:

1. [ ] `npx tsc --noEmit` passes with no errors
2. [ ] `npm run dev` starts cleanly
3. [ ] Clicking a **place** marker on the map selects the parent city (not the place ID)
4. [ ] Place popup shows visit duration, best time, and entry fee correctly
5. [ ] Map route polyline renders even if config loads after trip result
6. [ ] Config fetch failure shows a retry button (not a blank wizard)
7. [ ] Clearing the duration input doesn't produce NaN — defaults to 1
8. [ ] Cost breakup doesn't show NaN% on edge cases
9. [ ] A 5-day budget trip shows realistic INR costs (₹15,000–₹25,000 range)
10. [ ] A 5-day premium trip shows ₹80,000–₹1,50,000 range
11. [ ] Each day in the itinerary shows its date (e.g., "Sun, 15 Mar 2026")
12. [ ] Selecting 4 cities for a 2-day trip shows a warning about skipped cities
13. [ ] Feasibility never downgrades from "not recommended" to "tight"
14. [ ] No dark mode flash — page is consistently light theme
15. [ ] No unused imports remain in planner.ts, page.tsx, or ItineraryView.tsx
16. [ ] API rejects requests with invalid duration/budget/travelStyle

---

## IMPORTANT NOTES

- **Do NOT modify** files in `frontend/` or `backend/` directories.
- **Do NOT add** MongoDB connection logic — keep using mock data.
- **Do NOT install** new npm packages.
- **Currency is INR (₹)** everywhere — all cost values and displays must be in Indian Rupees.
- **Preserve** all existing functionality from Round 1 fixes.
- Make edits **in-place** in existing files. Do not create new files.
- After each task, ensure no TypeScript errors are introduced.
