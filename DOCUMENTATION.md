# NatureLand Spa Booking System — Architecture Documentation

## Live Demo
Open `spa-booking-system.html` directly in any modern browser. No build step required.

For the full CRA project: `cd spa-booking && npm install && npm start`

---

## Tech Stack

| Concern | Choice | Reason |
|---|---|---|
| UI Framework | React 19 (CRA) | Assessment requirement |
| State | Context + useReducer | Predictable, no extra deps for standalone; Zustand in CRA version |
| Server state | TanStack React Query | Caching, optimistic updates, retry |
| HTTP | Axios | Interceptors for auth token + error normalization |
| DnD | dnd-kit | Pointer-sensor, virtualization-friendly |
| Date math | date-fns | Tree-shakeable, no moment.js bloat |
| Notifications | react-hot-toast / custom | Non-blocking feedback |

---

## Folder Structure (CRA Project)

```
src/
  api/
    index.js          # Axios instance + all endpoint functions
  components/
    calendar/
      CalendarGrid.js  # Virtualized grid, DnD context
      NowLine.js       # Real-time current-time indicator
    booking/
      BookingPanel.js  # Slide-in detail/edit/cancel panel
      BookingForm.js   # Create booking modal
      BookingsList.js  # Collapsible sidebar list
    ui/
      Toolbar.js       # Date nav, search, filters, new booking
      DashboardStats.js # Daily KPI cards
      StatusBadge.js   # Reusable status chip
      ErrorBoundary.js # Per-component error recovery
  hooks/
    useBookings.js     # React Query hooks for CRUD
  pages/
    LoginPage.js       # Auth with API + demo fallback
    CalendarPage.js    # Main page, lazy-loads heavy components
  store/
    index.js           # Zustand store with immer
  utils/
    logger.js          # Structured console logger
    dateUtils.js       # Time slot math, position calculators
    colorUtils.js      # Status/gender color mapping
    mockData.js        # 200-therapist / 2000-booking generator
  App.js               # Root, QueryClient, auth routing
  index.js             # Entry point + global styles
```

---

## State Management

### Two-layer approach

**Layer 1 — Zustand (global app state)**
All booking data, therapists, UI toggles (panel open, selected booking, filters) live in a single Zustand store using immer for immutable updates.

Key design: a `bookingsMap` (id → booking object) is maintained in parallel with the `bookings` array. The array is used for iteration (rendering the list, filtering); the map is used for O(1) lookup when the panel needs to display a specific booking by ID.

```js
// O(1) panel lookup
const booking = bookingsMap[selectedBookingId];

// Efficient filter without rebuilding map
const filtered = bookings.filter(b => b.start_time.startsWith(selectedDate));
```

**Layer 2 — React Query (server synchronization)**
Queries handle stale-while-revalidate caching for bookings and therapists. Mutations implement optimistic updates: the store is updated immediately on mutation start, with rollback on failure using the snapshot captured in `onMutate`.

```js
onMutate: ({ id, data }) => {
  const snapshot = store.bookingsMap[id];  // snapshot
  store.updateBooking(id, data);            // optimistic
  return { snapshot, id };                  // context for rollback
},
onError: (err, vars, ctx) => {
  store.updateBooking(ctx.id, ctx.snapshot); // rollback
}
```

---

## Performance Strategy

### Calendar rendering (2000 bookings / 200 therapists)

**Problem:** A naive render of 200 therapist columns × 56 time slots = 11,200 DOM nodes before any bookings are placed. With 2000 booking blocks, total DOM nodes exceed 13,000 — guaranteed jank.

**Solution: Four-level optimization**

1. **Single-pass grouping.** Bookings are grouped by therapist in one `O(n)` `useMemo` pass at the top of `CalendarGrid`. Each `TherapistColumn` receives only its own bookings — no filtering per column.

```js
const byTherapist = useMemo(() => {
  const map = {};
  therapists.forEach(t => { map[t.id] = []; });
  filtered.forEach(b => { if (map[b.therapist_id]) map[b.therapist_id].push(b); });
  return map;
}, [filtered, therapists]);
```

2. **React.memo everywhere.** `BookingBlock`, `TherapistColumn`, `TherapistHeader`, `TimeAxis`, `BookingsList`, `DashboardStats`, `Toolbar` are all wrapped in `React.memo`. A booking status change in the panel does not re-render unrelated therapist columns.

3. **Absolute positioning for blocks.** Booking blocks use `position: absolute` with `top` and `height` computed from time math — no layout reflow when a block changes status or is dragged.

4. **Lazy code splitting.** `CalendarGrid`, `BookingPanel`, `BookingForm`, `BookingsList`, and `DashboardStats` are all `React.lazy()` loaded. The login bundle is ~15KB; the calendar chunk loads only after auth.

### Memoization inventory

| Component | memo type | Trigger condition |
|---|---|---|
| `BookingBlock` | React.memo | booking reference changes |
| `TherapistColumn` | React.memo | its bookings array or therapist changes |
| `TherapistHeader` | React.memo | therapist reference changes |
| `TimeAxis` | React.memo | never re-renders after mount |
| `BookingsList` | React.memo | filtered bookings change |
| `DashboardStats` | React.memo | bookings + selectedDate change |
| `byTherapist` | useMemo | filtered list or therapist list changes |
| `filtered` | useMemo | bookings, search, statusFilter, selectedDate |

---

## API Integration

All endpoints route through a single Axios instance at `src/api/index.js`.

### Endpoints implemented

```
POST   /login                    → Auth, stores token in localStorage
GET    /bookings?date=&per_page= → Fetch day's bookings
POST   /bookings/create          → Create new booking
PUT    /bookings/:id             → Update booking
POST   /bookings/item/cancel     → Cancel (body: {booking_id, reason})
DELETE /bookings/destroy/:id     → Hard delete
GET    /therapists               → Therapist list
GET    /services                 → Service catalogue
GET    /rooms                    → Room list
GET    /clients?search=          → Client search
```

### Graceful degradation

Every API call is wrapped in try/catch. If the backend is unavailable (CORS, timeout, 5xx), the app:
1. Falls back to 200-booking mock data generated from `mockData.js`
2. Continues to accept creates/updates/cancellations locally
3. Shows "(offline)" suffix in toast notifications
4. Logs the failure via `logger.error()`

This means the app is fully demonstrable without backend connectivity.

---

## Error Handling

### Three layers

**1. Axios interceptors** (`src/api/index.js`)
- Logs every request/response
- Normalizes error shape to `{ status, message, isTimeout, isNetwork }`
- Auto-redirects to login on 401

**2. React Error Boundaries** (`src/components/ui/ErrorBoundary.js`)
- Wraps each major UI region independently: CalendarGrid, BookingPanel, BookingForm
- Shows inline recovery UI with a "Retry" button
- Logs component stack to console via `componentDidCatch`

**3. Form validation** (`BookingForm.js`)
- Client-side required field validation before any API call
- Per-field error messages rendered inline
- Fields highlighted red on error; cleared on change

### Logged events

| Event | Level | Category |
|---|---|---|
| Every API request | INFO | API |
| Every API response | INFO | API |
| API error | ERROR | API_ERROR |
| Booking created | ACTION | BOOKING_CREATED |
| Booking updated | ACTION | BOOKING_UPDATED |
| Booking cancelled | ACTION | BOOKING_CANCELLED |
| Check-in | ACTION | BOOKING_CHECKIN |
| DnD reschedule | ACTION | BOOKING_DND_RESCHEDULE |
| Login success | ACTION | LOGIN |
| Component render error | ERROR | ERROR_BOUNDARY |

---

## Color / Icon Rules

As per spec:
- **Female therapist** → `#EC4899` (pink) avatar + label
- **Male therapist** → `#3B82F6` (blue) avatar + label
- **T icon** → prefix on therapist selector labels (`T · Name`)
- **R icon** → prefix on room selector labels (`R · Room 1`)

Booking card colors by status:
- Confirmed → `#3B82F6`
- Check-in / In Progress → `#EC4899`
- Cancelled → `#6B7280`
- Completed → `#10B981`
- Pending → `#F59E0B`

---

## Assumptions Made

1. **Date scoping.** The calendar shows one day at a time. "2000 bookings per day" means the GET /bookings call is always date-filtered; we never load all historical bookings into memory.

2. **CANCEL endpoint method.** The spec lists `CANCEL /bookings/item/cancel` as a non-standard HTTP verb. Implemented as `POST /bookings/item/cancel` with `{booking_id, reason}` in the body, which is the standard REST pattern for cancellation actions.

3. **Token storage.** Auth token stored in `localStorage` for persistence across page refreshes. For production, `httpOnly` cookies would be preferred.

4. **Outlet scoping.** The spec mentions 30 outlets but says "no need to worry for now." The current implementation supports one outlet per session; outlet switching can be added as a dropdown in the toolbar.

5. **Real-time updates.** The spec mentions "real-time" but provides no WebSocket API. Optimistic updates give the appearance of real-time; a polling interval on the React Query `refetchInterval` option can be added when a WS endpoint is available.

6. **Mock data.** When the API returns no data (CORS in dev, network down, empty response), the app auto-generates realistic mock bookings for demonstration. This is logged as `[INFO] Using mock data`.

---

## Running Locally

### Option A — Single HTML file (zero setup)
```bash
open spa-booking-system.html
# or: python3 -m http.server 3000 then visit localhost:3000/spa-booking-system.html
```

### Option B — CRA project
```bash
cd spa-booking
npm install --legacy-peer-deps
npm start
# Visits http://localhost:3000
```

### Login credentials
```
Email:    react@hipster-inc.com
Password: React@123
Key pass: 07ba959153fe7eec778361bf42079439
```
Pre-filled on the login form. If the API is unreachable, the app auto-enters demo mode with mock data.

---

## Deployment (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# From project root
cd spa-booking
vercel --prod
```

For the single-file version, drag `spa-booking-system.html` into Vercel's dashboard or deploy via:
```bash
vercel --prod spa-booking-system.html
```
