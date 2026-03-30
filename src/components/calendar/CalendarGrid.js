import React, { useCallback, useMemo, useRef, memo } from 'react';
import { DndContext, DragOverlay, useDraggable, useDroppable, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import useStore from '../../store';
import useFilteredBookings from '../../hooks/useFilteredBookings';
import { getStatusStyle, getTherapistColor } from '../../utils/colorUtils';
import {
  SLOT_HEIGHT, DAY_START_HOUR, DAY_END_HOUR, TOTAL_MINUTES,
  topPosition, blockHeight, generateTimeSlots, formatTime, minsToTime, snapToSlot,
} from '../../utils/dateUtils';
import ErrorBoundary from '../ui/ErrorBoundary';
import NowLine from './NowLine';

const TIME_COL_W = 64;
const THERAPIST_COL_W = 160;
const HEADER_H = 56;

// ─── Booking Block ────────────────────────────────────────────────────────────
const BookingBlock = memo(({ booking, onClick }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `booking-${booking.id}`,
    data: { booking },
  });

  const statusStyle = getStatusStyle(booking.status);
  const top = topPosition(booking.start_time);
  const height = Math.max(blockHeight(booking.start_time, booking.end_time), 28);

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={(e) => { e.stopPropagation(); onClick(booking); }}
      style={{
        position: 'absolute',
        top,
        left: 3,
        right: 3,
        height,
        background: statusStyle.bg,
        borderRadius: 6,
        padding: '3px 6px',
        cursor: isDragging ? 'grabbing' : 'grab',
        opacity: isDragging ? 0.4 : 1,
        overflow: 'hidden',
        zIndex: isDragging ? 0 : 2,
        boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
        borderLeft: `3px solid rgba(255,255,255,0.4)`,
        transition: 'box-shadow 0.15s',
        userSelect: 'none',
      }}
    >
      <div style={{ fontSize: 10, fontWeight: 700, color: '#fff', lineHeight: 1.2, truncate: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
        {booking.client?.name}
      </div>
      {height > 36 && (
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.85)', whiteSpace: 'nowrap', overflow: 'hidden' }}>
          {booking.service?.name}
        </div>
      )}
      {height > 50 && (
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)' }}>
          {formatTime(booking.start_time)} – {formatTime(booking.end_time)}
        </div>
      )}
    </div>
  );
});

// ─── Therapist Column ─────────────────────────────────────────────────────────
const TherapistColumn = memo(({ therapist, bookings, onBookingClick, selectedDate }) => {
  const { setNodeRef, isOver } = useDroppable({ id: `col-${therapist.id}` });

  return (
    <div
      ref={setNodeRef}
      style={{
        position: 'relative',
        minWidth: THERAPIST_COL_W,
        width: THERAPIST_COL_W,
        height: (TOTAL_MINUTES / 60) * SLOT_HEIGHT,
        background: isOver ? 'rgba(124,106,255,0.06)' : 'transparent',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
      }}
    >
      {/* Time slot grid lines */}
      {generateTimeSlots().map(({ hour, minute }) => (
        <div
          key={`${hour}-${minute}`}
          style={{
            position: 'absolute',
            top: ((hour - DAY_START_HOUR) * 60 + minute) / 60 * SLOT_HEIGHT,
            left: 0,
            right: 0,
            height: 1,
            background: minute === 0
              ? 'rgba(255,255,255,0.08)'
              : 'rgba(255,255,255,0.03)',
          }}
        />
      ))}

      {/* Booking blocks */}
      {bookings.map((b) => (
        <ErrorBoundary key={b.id}>
          <BookingBlock booking={b} onClick={onBookingClick} />
        </ErrorBoundary>
      ))}
    </div>
  );
});

// ─── Time Axis ────────────────────────────────────────────────────────────────
const TimeAxis = memo(() => (
  <div style={{ width: TIME_COL_W, flexShrink: 0, position: 'relative', height: (TOTAL_MINUTES / 60) * SLOT_HEIGHT }}>
    {Array.from({ length: DAY_END_HOUR - DAY_START_HOUR }, (_, i) => (
      <div
        key={i}
        style={{
          position: 'absolute',
          top: i * SLOT_HEIGHT - 8,
          right: 8,
          fontSize: 11,
          color: 'rgba(255,255,255,0.35)',
          fontVariantNumeric: 'tabular-nums',
          fontWeight: 500,
        }}
      >
        {String(DAY_START_HOUR + i).padStart(2, '0')}:00
      </div>
    ))}
  </div>
));

// ─── Therapist Header ─────────────────────────────────────────────────────────
const TherapistHeader = memo(({ therapist }) => {
  const color = getTherapistColor(therapist.gender);
  return (
    <div style={{
      minWidth: THERAPIST_COL_W,
      width: THERAPIST_COL_W,
      height: HEADER_H,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      borderRight: '1px solid rgba(255,255,255,0.06)',
      padding: '6px 4px',
      flexShrink: 0,
      gap: 3,
    }}>
      <div style={{
        width: 32,
        height: 32,
        borderRadius: '50%',
        background: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 12,
        fontWeight: 700,
        color: '#fff',
        flexShrink: 0,
      }}>
        {therapist.firstName?.[0]}{therapist.lastName?.[0]}
      </div>
      <div style={{ fontSize: 10, color: '#e2e8f0', fontWeight: 600, textAlign: 'center', lineHeight: 1.2, maxWidth: THERAPIST_COL_W - 8, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
        {therapist.name}
      </div>
      <div style={{ fontSize: 9, color: color, fontWeight: 700, letterSpacing: 0.5 }}>
        {therapist.gender?.toUpperCase()?.[0]}
      </div>
    </div>
  );
});

// ─── Calendar Grid ─────────────────────────────────────────────────────────────
const CalendarGrid = () => {
  // Stable primitive selectors — no infinite loop risk
  const therapists   = useStore((s) => s.therapists);
  const selectedDate = useStore((s) => s.selectedDate);
  const bookings     = useStore((s) => s.bookings);
  const searchQuery  = useStore((s) => s.searchQuery);
  const statusFilter = useStore((s) => s.statusFilter);
  const scrollRef    = useRef(null);

  // Filter inline — handles both local "2026-03-28T10:00:00" and UTC ISO strings
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (!b.start_time) return false;
      // Always compare the local-date portion (first 10 chars before T)
      const bookingDate = b.start_time.slice(0, 10);
      if (bookingDate !== selectedDate) return false;
      if (statusFilter !== 'all' && b.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          b.client?.name?.toLowerCase().includes(q) ||
          b.booking_ref?.toLowerCase().includes(q) ||
          b.therapist?.name?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [bookings, selectedDate, searchQuery, statusFilter]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // Group bookings by therapist – O(n) single pass
  const bookingsByTherapist = useMemo(() => {
    const map = {};
    therapists.forEach((t) => { map[t.id] = []; });
    filteredBookings.forEach((b) => {
      if (map[b.therapist_id]) map[b.therapist_id].push(b);
    });
    return map;
  }, [filteredBookings, therapists]);

  const handleBookingClick = useCallback((booking) => {
    const { setSelectedBookingId, openPanel } = useStore.getState();
    setSelectedBookingId(booking.id);
    openPanel('view', booking.id);
  }, []);

  const handleDragEnd = useCallback((event) => {
    const { active, over, delta } = event;
    if (!over || !active) return;

    const booking = active.data.current?.booking;
    if (!booking) return;

    const overId = over.id;
    const newTherapistId = overId.startsWith('col-')
      ? parseInt(overId.replace('col-', ''), 10)
      : booking.therapist_id;

    const deltaMinutes = snapToSlot((delta.y / SLOT_HEIGHT) * 60);
    const oldStart = new Date(booking.start_time);
    const oldEnd   = new Date(booking.end_time);
    const duration = (oldEnd - oldStart) / 60000;
    const newStart = new Date(oldStart.getTime() + deltaMinutes * 60000);
    const newEnd   = new Date(newStart.getTime() + duration * 60000);

    const { updateBooking } = useStore.getState();
    updateBooking(booking.id, {
      therapist_id: newTherapistId,
      therapist: therapists.find((t) => t.id === newTherapistId) || booking.therapist,
      start_time: newStart.toISOString(),
      end_time:   newEnd.toISOString(),
    });
  }, [therapists]);

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        {/* Header row */}
        <div style={{
          display: 'flex',
          flexShrink: 0,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(15,15,30,0.95)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          overflowX: 'hidden',
        }}>
          <div style={{ width: TIME_COL_W, flexShrink: 0, height: HEADER_H }} />
          <div
            style={{ display: 'flex', overflowX: 'hidden' }}
            id="header-scroll-sync"
          >
            {therapists.map((t) => <TherapistHeader key={t.id} therapist={t} />)}
          </div>
        </div>

        {/* Scrollable body */}
        <div
          ref={scrollRef}
          style={{ display: 'flex', flex: 1, overflow: 'auto' }}
          onScroll={(e) => {
            const h = document.getElementById('header-scroll-sync');
            if (h) h.scrollLeft = e.target.scrollLeft;
          }}
        >
          <TimeAxis />
          <div style={{ display: 'flex', position: 'relative' }}>
              <NowLine />
              {therapists.map((t) => (
              <TherapistColumn
                key={t.id}
                therapist={t}
                bookings={bookingsByTherapist[t.id] || []}
                onBookingClick={handleBookingClick}
                selectedDate={selectedDate}
              />
            ))}
          </div>
        </div>
      </div>
      <DragOverlay>
        {/* Minimal ghost */}
        <div style={{
          width: THERAPIST_COL_W - 6,
          height: 40,
          background: 'rgba(124,106,255,0.85)',
          borderRadius: 6,
          opacity: 0.9,
          boxShadow: '0 8px 24px rgba(124,106,255,0.4)',
        }} />
      </DragOverlay>
    </DndContext>
  );
};

export default CalendarGrid;
