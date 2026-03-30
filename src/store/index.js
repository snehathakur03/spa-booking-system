import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';
import { logger } from '../utils/logger';

const useStore = create(
  devtools(
    immer((set, get) => ({
      // ─── Auth ───────────────────────────────────────────────────────────────
      user: null,
      token: localStorage.getItem('spa_token') || null,
      isAuthenticated: !!localStorage.getItem('spa_token'),

      setAuth: (user, token) => {
        localStorage.setItem('spa_token', token);
        set((s) => { s.user = user; s.token = token; s.isAuthenticated = true; });
        logger.action('AUTH_LOGIN', { user });
      },

      logout: () => {
        localStorage.removeItem('spa_token');
        set((s) => { s.user = null; s.token = null; s.isAuthenticated = false; });
        logger.action('AUTH_LOGOUT');
      },

      // ─── Bookings ────────────────────────────────────────────────────────────
      bookings: [],
      bookingsMap: {}, // id → booking for O(1) lookup

      setBookings: (bookings) => {
        const map = {};
        bookings.forEach((b) => { map[b.id] = b; });
        set((s) => { s.bookings = bookings; s.bookingsMap = map; });
        logger.info('STORE', `Loaded ${bookings.length} bookings`);
      },

      addBooking: (booking) => {
        set((s) => {
          s.bookings.push(booking);
          s.bookingsMap[booking.id] = booking;
        });
        logger.action('BOOKING_CREATED', booking);
      },

      updateBooking: (id, data) => {
        set((s) => {
          const idx = s.bookings.findIndex((b) => b.id === id);
          if (idx !== -1) {
            Object.assign(s.bookings[idx], data);
            s.bookingsMap[id] = s.bookings[idx];
          }
        });
        logger.action('BOOKING_UPDATED', { id, data });
      },

      removeBooking: (id) => {
        set((s) => {
          s.bookings = s.bookings.filter((b) => b.id !== id);
          delete s.bookingsMap[id];
        });
        logger.action('BOOKING_DELETED', { id });
      },

      // ─── Therapists ──────────────────────────────────────────────────────────
      therapists: [],
      setTherapists: (therapists) => set((s) => { s.therapists = therapists; }),

      // ─── Services / Rooms ────────────────────────────────────────────────────
      services: [],
      rooms: [],
      clients: [],
      setServices: (s) => set((st) => { st.services = s; }),
      setRooms: (r) => set((s) => { s.rooms = r; }),
      setClients: (c) => set((s) => { s.clients = c; }),

      // ─── UI State ────────────────────────────────────────────────────────────
      selectedDate: new Date().toISOString().split('T')[0],
      setSelectedDate: (date) => set((s) => { s.selectedDate = date; }),

      selectedBookingId: null,
      setSelectedBookingId: (id) => set((s) => { s.selectedBookingId = id; }),

      isPanelOpen: false,
      panelMode: 'view', // 'view' | 'edit' | 'create'
      openPanel: (mode = 'view', bookingId = null) =>
        set((s) => { s.isPanelOpen = true; s.panelMode = mode; s.selectedBookingId = bookingId; }),
      closePanel: () =>
        set((s) => { s.isPanelOpen = false; s.selectedBookingId = null; }),

      isCreateOpen: false,
      openCreate: () => set((s) => { s.isCreateOpen = true; }),
      closeCreate: () => set((s) => { s.isCreateOpen = false; }),

      searchQuery: '',
      setSearchQuery: (q) => set((s) => { s.searchQuery = q; }),

      statusFilter: 'all',
      setStatusFilter: (f) => set((s) => { s.statusFilter = f; }),

      therapistFilter: null,
      setTherapistFilter: (id) => set((s) => { s.therapistFilter = id; }),

      isLoading: false,
      setLoading: (v) => set((s) => { s.isLoading = v; }),

      errors: [],
      addError: (error) => {
        const id = Date.now();
        set((s) => { s.errors.push({ id, ...error }); });
        logger.error('UI_ERROR', error);
        return id;
      },
      clearError: (id) => set((s) => { s.errors = s.errors.filter((e) => e.id !== id); }),

      // ─── Computed getters ─────────────────────────────────────────────────────
      // Filtering is done in components via useMemo for proper reactivity
    })),
    { name: 'SpaBookingStore' }
  )
);

export default useStore;
