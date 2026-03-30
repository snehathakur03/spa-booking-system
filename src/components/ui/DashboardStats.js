import React, { memo, useMemo } from 'react';
import useStore from '../../store';

const DashboardStats = memo(() => {
  const bookings     = useStore((s) => s.bookings);
  const selectedDate = useStore((s) => s.selectedDate);

  const stats = useMemo(() => {
    const b = bookings.filter((x) => x.start_time?.slice(0, 10) === selectedDate);
    return {
      total:     b.length,
      confirmed: b.filter((x) => x.status === 'confirmed').length,
      active:    b.filter((x) => ['checkin', 'inprogress'].includes(x.status)).length,
      completed: b.filter((x) => x.status === 'completed').length,
      cancelled: b.filter((x) => x.status === 'cancelled').length,
      revenue:   b.filter((x) => x.status !== 'cancelled').reduce((a, x) => a + (x.service?.price || 0), 0),
    };
  }, [bookings, selectedDate]);

  const cards = [
    { label:'Total',     val:stats.total,                           color:'#a78bfa' },
    { label:'Confirmed', val:stats.confirmed,                       color:'#3B82F6' },
    { label:'Active',    val:stats.active,                          color:'#EC4899' },
    { label:'Completed', val:stats.completed,                       color:'#10B981' },
    { label:'Cancelled', val:stats.cancelled,                       color:'#6B7280' },
    { label:'Revenue',   val:`$${stats.revenue.toLocaleString()}`,  color:'#F59E0B' },
  ];

  return (
    <div style={{ display:'flex', gap:8, padding:'8px 16px', borderBottom:'1px solid rgba(255,255,255,0.04)', flexShrink:0, overflowX:'auto', background:'rgba(8,8,22,0.85)' }}>
      {cards.map(({ label, val, color }) => (
        <div key={label} style={{ background:'rgba(255,255,255,0.04)', border:`1px solid ${color}25`, borderRadius:8, padding:'7px 14px', minWidth:80, flexShrink:0 }}>
          <div style={{ fontSize:20, fontWeight:800, color, lineHeight:1 }}>{val}</div>
          <div style={{ fontSize:9, color:'rgba(255,255,255,0.35)', fontWeight:700, marginTop:2, textTransform:'uppercase', letterSpacing:0.5 }}>{label}</div>
        </div>
      ))}
    </div>
  );
});

export default DashboardStats;
