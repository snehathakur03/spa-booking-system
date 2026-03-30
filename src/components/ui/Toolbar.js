import React, { memo, useMemo } from 'react';
import useStore from '../../store';
import { BOOKING_STATUSES } from '../../utils/colorUtils';

const Toolbar = memo(() => {
  // Subscribe to each primitive individually — prevents re-render on unrelated store changes
  const selectedDate  = useStore((s) => s.selectedDate);
  const searchQuery   = useStore((s) => s.searchQuery);
  const statusFilter  = useStore((s) => s.statusFilter);
  const bookings      = useStore((s) => s.bookings);

  // Count filtered bookings for the badge — no store method needed
  const filteredCount = useMemo(() => {
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
    }).length;
  }, [bookings, selectedDate, statusFilter, searchQuery]);

  const changeDate = (delta) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    useStore.getState().setSelectedDate(d.toISOString().split('T')[0]);
  };

  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 16px', background:'rgba(8,8,22,0.99)', flexWrap:'wrap' }}>

      {/* Logo */}
      <div style={{ display:'flex', alignItems:'center', gap:8, marginRight:4 }}>
        <div style={{ width:32, height:32, borderRadius:8, background:'linear-gradient(135deg,#7c6aff,#EC4899)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15 }}>✦</div>
        <span style={{ fontSize:14, fontWeight:800, color:'#f1f5f9', letterSpacing:-0.4 }}>NatureLand</span>
      </div>

      {/* Date navigation */}
      <div style={{ display:'flex', alignItems:'center', gap:4, background:'rgba(255,255,255,0.05)', borderRadius:8, padding:'4px 8px' }}>
        <button onClick={() => changeDate(-1)} style={navBtn}>‹</button>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => useStore.getState().setSelectedDate(e.target.value)}
          style={{ background:'transparent', border:'none', color:'#e2e8f0', fontSize:12, fontWeight:700, outline:'none', cursor:'pointer', colorScheme:'dark' }}
        />
        <button onClick={() => changeDate(1)} style={navBtn}>›</button>
        <button
          onClick={() => useStore.getState().setSelectedDate(new Date().toISOString().split('T')[0])}
          style={{ background:'rgba(124,106,255,0.2)', border:'none', borderRadius:5, padding:'2px 8px', color:'#a78bfa', cursor:'pointer', fontSize:9, fontWeight:800, letterSpacing:0.5 }}
        >TODAY</button>
      </div>

      {/* Search */}
      <div style={{ flex:1, minWidth:160, position:'relative' }}>
        <span style={{ position:'absolute', left:9, top:'50%', transform:'translateY(-50%)', color:'rgba(255,255,255,0.25)', fontSize:13, pointerEvents:'none' }}>⌕</span>
        <input
          placeholder="Search client, ref, therapist…"
          value={searchQuery}
          onChange={(e) => useStore.getState().setSearchQuery(e.target.value)}
          style={{ width:'100%', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:8, padding:'8px 10px 8px 28px', color:'#e2e8f0', fontSize:12, outline:'none', boxSizing:'border-box' }}
        />
      </div>

      {/* Status filter */}
      <select
        value={statusFilter}
        onChange={(e) => useStore.getState().setStatusFilter(e.target.value)}
        style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:8, padding:'8px 12px', color:'#e2e8f0', fontSize:12, outline:'none', cursor:'pointer' }}
      >
        <option value="all">All Statuses</option>
        {BOOKING_STATUSES.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>

      {/* Count badge */}
      <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', whiteSpace:'nowrap' }}>
        <span style={{ color:'#a78bfa', fontWeight:700 }}>{filteredCount}</span> bookings
      </div>

      {/* New booking */}
      <button
        onClick={() => useStore.getState().openCreate()}
        style={{ padding:'9px 16px', background:'linear-gradient(135deg,#7c6aff,#6356e8)', color:'#fff', border:'none', borderRadius:10, fontWeight:700, fontSize:13, cursor:'pointer', whiteSpace:'nowrap', boxShadow:'0 4px 12px rgba(124,106,255,0.35)' }}
      >
        + New Booking
      </button>
    </div>
  );
});

const navBtn = { background:'none', border:'none', color:'#94a3b8', cursor:'pointer', fontSize:16, padding:'0 3px', lineHeight:1 };

export default Toolbar;
