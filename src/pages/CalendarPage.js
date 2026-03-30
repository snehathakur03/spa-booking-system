import React, { useEffect, useRef, lazy, Suspense } from 'react';
import { Toaster } from 'react-hot-toast';
import useStore from '../store';
import { bookingsAPI, therapistsAPI } from '../api';
import { generateTherapists, generateBookings, MOCK_SERVICES, MOCK_ROOMS } from '../utils/mockData';
import { logger } from '../utils/logger';
import ErrorBoundary from '../components/ui/ErrorBoundary';
import Toolbar from '../components/ui/Toolbar';

const CalendarGrid   = lazy(() => import('../components/calendar/CalendarGrid'));
const BookingPanel   = lazy(() => import('../components/booking/BookingPanel'));
const BookingForm    = lazy(() => import('../components/booking/BookingForm'));
const BookingsList   = lazy(() => import('../components/booking/BookingsList'));
const DashboardStats = lazy(() => import('../components/ui/DashboardStats'));

const DEMO_THERAPIST_COUNT = 30;
const DEMO_BOOKING_COUNT   = 200;

// ── Safely extract an array from any API response shape ──────────────────────
// Handles: { data: [...] }, { data: { data: [...] } }, { data: { items: [...] } }
// { data: { bookings: [...] } }, plain [...], { success, data: [...] } etc.
// const extractArray = (resp) => {
//   const raw = resp?.data;
//   if (!raw) return [];
//   if (Array.isArray(raw)) return raw;

//   // Common Laravel / custom API nesting patterns
//   const candidates = [
//     raw?.data,
//     raw?.items,
//     raw?.bookings,
//     raw?.therapists,
//     raw?.results,
//     raw?.list,
//     raw?.records,
//   ];

//   for (const c of candidates) {
//     if (Array.isArray(c) && c.length > 0) return c;
//   }

//   // data.data is a paginator object with a nested array?
//   if (raw?.data && typeof raw.data === 'object') {
//     for (const key of Object.keys(raw.data)) {
//       if (Array.isArray(raw.data[key])) return raw.data[key];
//     }
//   }

//   logger.warn('API_PARSE', 'Could not extract array from response:', JSON.stringify(raw).slice(0, 300));
//   return [];
// };

const LoadingSpinner = () => (
  <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', flexDirection:'column', gap:16 }}>
    <div style={{ width:40, height:40, borderRadius:'50%', border:'3px solid rgba(124,106,255,0.2)', borderTop:'3px solid #7c6aff', animation:'spin 0.8s linear infinite' }} />
    <div style={{ color:'rgba(255,255,255,0.4)', fontSize:13 }}>Loading calendar…</div>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

const LEGEND = [
  { color:'#3B82F6', label:'Confirmed'   },
  { color:'#EC4899', label:'In Progress' },
  { color:'#9CA3AF', label:'Cancelled'   },
  { color:'#10B981', label:'Completed'   },
  { color:'#EC4899', label:'Female (T)'  },
  { color:'#3B82F6', label:'Male (T)'   },
];

const CalendarPage = () => {
  const isLoading    = useStore((s) => s.isLoading);
  const selectedDate = useStore((s) => s.selectedDate);
  const isPanelOpen  = useStore((s) => s.isPanelOpen);
  const isCreateOpen = useStore((s) => s.isCreateOpen);
  const user         = useStore((s) => s.user);

  const loadedDateRef = useRef(null);

useEffect(() => {
  if (loadedDateRef.current === selectedDate) return;
  loadedDateRef.current = selectedDate;

  const { setBookings, setTherapists, setServices, setRooms, setLoading } = useStore.getState();
  setLoading(true);

  const run = async () => {
    try {
      if (localStorage.getItem('spa_token')?.startsWith('demo-token')) {
        // Load mock data immediately
        const mockTherapists = generateTherapists(DEMO_THERAPIST_COUNT);
        setTherapists(mockTherapists);
        setServices(MOCK_SERVICES);
        setRooms(MOCK_ROOMS);
        const mocks = generateBookings(mockTherapists, selectedDate, DEMO_BOOKING_COUNT);
        setBookings(mocks);
        setLoading(false);
        return;
      }

      const [bookingResp, therapistResp] = await Promise.allSettled([
        bookingsAPI.list({ date: selectedDate, per_page: 2000 }),
        therapistsAPI.list({ per_page: 200 }),
      ]);

      if (therapistResp.status === 'fulfilled') {
        const apiT = therapistResp.value?.data?.data || therapistResp.value?.data || [];
        if (apiT.length) setTherapists(apiT);
      }

      if (bookingResp.status === 'fulfilled') {
        const apiB = bookingResp.value?.data?.data || bookingResp.value?.data || [];
        if (apiB.length) setBookings(apiB);
      }

      // fallback
      if (!bookingResp.value?.data?.data?.length) throw new Error('No API data');
    } catch (err) {
      // Load mocks if API fails
      const th = useStore.getState().therapists.length
        ? useStore.getState().therapists
        : generateTherapists(DEMO_THERAPIST_COUNT);
      setBookings(generateBookings(th, selectedDate, DEMO_BOOKING_COUNT));
      setLoading(false);
    }
  };

  run();
}, [selectedDate]);

  return (
    <div style={{ height:'100vh', display:'flex', flexDirection:'column', background:'#080816', fontFamily:'"Inter",system-ui,sans-serif', color:'#e2e8f0', overflow:'hidden' }}>

      <Toaster position="top-right" toastOptions={{
        style:{ background:'#1a1a2e', color:'#e2e8f0', border:'1px solid rgba(255,255,255,0.1)', fontSize:13 },
        success:{ iconTheme:{ primary:'#7c6aff', secondary:'#fff' } },
      }}/>

      {/* Top bar */}
      <ErrorBoundary>
        <div style={{ display:'flex', alignItems:'stretch', borderBottom:'1px solid rgba(255,255,255,0.06)', flexShrink:0 }}>
          <div style={{ flex:1, minWidth:0 }}><Toolbar /></div>
          <div style={{ padding:'0 16px', display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:12, fontWeight:600, color:'#e2e8f0' }}>{user?.name || 'Staff'}</div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)' }}>Operations</div>
            </div>
            <button
              onClick={() => useStore.getState().logout()}
              style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, padding:'6px 12px', color:'rgba(255,255,255,0.5)', cursor:'pointer', fontSize:12 }}
            >Sign out</button>
          </div>
        </div>
      </ErrorBoundary>

      {/* Stats */}
      <Suspense fallback={null}>
        <ErrorBoundary><DashboardStats /></ErrorBoundary>
      </Suspense>

      {/* Legend */}
      <div style={{ display:'flex', gap:14, padding:'6px 16px', borderBottom:'1px solid rgba(255,255,255,0.04)', flexShrink:0, background:'rgba(10,10,22,0.8)', overflowX:'auto' }}>
        {LEGEND.map(({ color, label }) => (
          <div key={label} style={{ display:'flex', alignItems:'center', gap:5, flexShrink:0 }}>
            <div style={{ width:9, height:9, borderRadius:3, background:color }} />
            <span style={{ fontSize:10, color:'rgba(255,255,255,0.32)', fontWeight:500 }}>{label}</span>
          </div>
        ))}
        <div style={{ marginLeft:'auto', fontSize:10, color:'rgba(255,255,255,0.2)', whiteSpace:'nowrap' }}>
          Drag to reschedule · Click to view/edit
        </div>
      </div>

      {/* Main */}
      <div style={{ flex:1, overflow:'hidden', display:'flex' }}>
        <Suspense fallback={null}>
          <ErrorBoundary><BookingsList /></ErrorBoundary>
        </Suspense>

        <div style={{ flex:1, overflow:'hidden', position:'relative' }}>
          {isLoading
            ? <LoadingSpinner />
            : <ErrorBoundary>
                <Suspense fallback={<LoadingSpinner />}>
                  <CalendarGrid />
                </Suspense>
              </ErrorBoundary>
          }
        </div>
      </div>

      {/* Panels */}
      <Suspense fallback={null}>
        {isPanelOpen  && <ErrorBoundary><BookingPanel /></ErrorBoundary>}
        {isCreateOpen && <ErrorBoundary><BookingForm  /></ErrorBoundary>}
      </Suspense>

    </div>
  );
};

// ── Normalize a raw API booking to our internal shape ─────────────────────────
// Different backends use different field names — map them all to our standard
// const normalizeBooking = (b) => ({
//   id:           b.id,
//   booking_ref:  b.booking_ref || b.ref || b.reference || `BK${b.id}`,
//   status:       (b.status || 'confirmed').toLowerCase().replace(/[\s\-]/g, ''),
//   notes:        b.notes || b.note || b.remarks || '',
//   request_type: b.request_type || b.type || 'Standard',

//   // Times — try common field names
//   start_time: b.start_time || b.start_at || b.startTime || b.from,
//   end_time:   b.end_time   || b.end_at   || b.endTime   || b.to,

//   // IDs
//   therapist_id: b.therapist_id || b.therapist?.id,
//   service_id:   b.service_id   || b.service?.id,
//   room_id:      b.room_id      || b.room?.id,

//   // Nested objects — pass through if present, build minimal if not
//   therapist: b.therapist || { id: b.therapist_id, name: `Therapist ${b.therapist_id}`, gender: 'female' },
//   service:   b.service   || { id: b.service_id,   name: `Service ${b.service_id}`,     duration: 60, price: 80 },
//   room:      b.room      || { id: b.room_id,       name: `Room ${b.room_id}` },
//   client:    b.client    || b.customer || { name: b.client_name || b.customer_name || 'Guest', phone: b.phone || '' },
// });

export default CalendarPage;
