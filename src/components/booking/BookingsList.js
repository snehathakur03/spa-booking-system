import React, { memo, useMemo, useState } from 'react';
import useStore from '../../store';
import { getStatusStyle, getTherapistColor } from '../../utils/colorUtils';
import { formatTime } from '../../utils/dateUtils';

const BookingsList = memo(() => {
  const bookings         = useStore((s) => s.bookings);
  const selectedDate     = useStore((s) => s.selectedDate);
  const searchQuery      = useStore((s) => s.searchQuery);
  const statusFilter     = useStore((s) => s.statusFilter);
  const selectedBookingId = useStore((s) => s.selectedBookingId);
  const [collapsed, setCollapsed] = useState(false);

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      if (b.start_time?.split('T')[0] !== selectedDate) return false;
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
  }, [bookings, selectedDate, statusFilter, searchQuery]);

  const grouped = useMemo(() =>
    filtered.reduce((a, b) => {
      const s = b.status || 'confirmed';
      if (!a[s]) a[s] = [];
      a[s].push(b);
      return a;
    }, {}),
  [filtered]);

  const handleClick = (booking) => {
    const { openPanel, setSelectedBookingId } = useStore.getState();
    setSelectedBookingId(booking.id);
    openPanel('view', booking.id);
  };

  if (collapsed) {
    return (
      <div
        onClick={() => setCollapsed(false)}
        style={{ width:28, borderRight:'1px solid rgba(255,255,255,0.06)', background:'rgba(8,8,22,0.95)', display:'flex', flexDirection:'column', alignItems:'center', paddingTop:12, cursor:'pointer', flexShrink:0 }}
      >
        <span style={{ color:'rgba(255,255,255,0.3)', fontSize:15 }}>›</span>
      </div>
    );
  }

  return (
    <div style={{ width:230, borderRight:'1px solid rgba(255,255,255,0.06)', background:'rgba(8,8,22,0.95)', display:'flex', flexDirection:'column', flexShrink:0, overflow:'hidden' }}>

      {/* Header */}
      <div style={{ padding:'11px 14px 9px', borderBottom:'1px solid rgba(255,255,255,0.05)', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
        <div>
          <div style={{ fontSize:12, fontWeight:700, color:'#f1f5f9' }}>Bookings</div>
          <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)', marginTop:1 }}>{filtered.length} showing</div>
        </div>
        <span style={{ color:'rgba(255,255,255,0.25)', cursor:'pointer', fontSize:16, padding:'2px 4px' }} onClick={() => setCollapsed(true)}>‹</span>
      </div>

      {/* Status summary pills */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:4, padding:'7px 10px', borderBottom:'1px solid rgba(255,255,255,0.04)', flexShrink:0 }}>
        {Object.entries(grouped).map(([status, items]) => {
          const st = getStatusStyle(status);
          return (
            <div key={status} style={{ background:`${st.bg}18`, borderRadius:6, padding:'3px 8px', border:`1px solid ${st.bg}35` }}>
              <span style={{ fontSize:13, fontWeight:800, color:st.bg }}>{items.length}</span>
              <span style={{ fontSize:8, color:'rgba(255,255,255,0.3)', marginLeft:4, textTransform:'uppercase' }}>{status.slice(0,4)}</span>
            </div>
          );
        })}
      </div>

      {/* List */}
      <div style={{ flex:1, overflowY:'auto' }}>
        {filtered.length === 0 ? (
          <div style={{ padding:20, textAlign:'center', color:'rgba(255,255,255,0.25)', fontSize:12 }}>No bookings found</div>
        ) : (
          filtered.map((b) => {
            const st  = getStatusStyle(b.status);
            const tc  = getTherapistColor(b.therapist?.gender);
            const sel = b.id === selectedBookingId;
            return (
              <div
                key={b.id}
                onClick={() => handleClick(b)}
                style={{ padding:'9px 14px', borderBottom:'1px solid rgba(255,255,255,0.04)', cursor:'pointer', background:sel ? 'rgba(124,106,255,0.1)' : 'transparent', borderLeft:`3px solid ${sel ? '#7c6aff' : 'transparent'}`, transition:'background 0.1s' }}
              >
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:6 }}>
                  <div style={{ minWidth:0, flex:1 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:'#f1f5f9', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{b.client?.name}</div>
                    <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)', marginTop:1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{b.service?.name}</div>
                  </div>
                  <span style={{ fontSize:8, fontWeight:700, padding:'2px 7px', borderRadius:10, background:st.bg, color:'#fff', textTransform:'uppercase', flexShrink:0 }}>{st.label}</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', marginTop:5 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                    <div style={{ width:14, height:14, borderRadius:'50%', background:tc, display:'flex', alignItems:'center', justifyContent:'center', fontSize:7, fontWeight:800, color:'#fff' }}>
                      {b.therapist?.firstName?.[0]}
                    </div>
                    <span style={{ fontSize:9, color:'rgba(255,255,255,0.35)' }}>{b.therapist?.name?.split(' ')[0]}</span>
                  </div>
                  <span style={{ fontSize:9, color:'rgba(255,255,255,0.3)', fontVariantNumeric:'tabular-nums' }}>
                    {b.start_time ? formatTime(b.start_time) : '—'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
});

export default BookingsList;
