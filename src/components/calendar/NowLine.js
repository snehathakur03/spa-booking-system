import React, { useState, useEffect, memo } from 'react';
import { DAY_START_HOUR, SLOT_HEIGHT } from '../../utils/dateUtils';
import useStore from '../../store';
import { isSameDate } from '../../utils/dateUtils';

const NowLine = memo(() => {
  const selectedDate = useStore((s) => s.selectedDate);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const isToday = isSameDate(selectedDate, now);
  if (!isToday) return null;

  const mins = now.getHours() * 60 + now.getMinutes() - DAY_START_HOUR * 60;
  if (mins < 0 || mins > 14 * 60) return null;
  const top = (mins / 60) * SLOT_HEIGHT;

  return (
    <div style={{
      position: 'absolute',
      top,
      left: 0,
      right: 0,
      zIndex: 5,
      pointerEvents: 'none',
      display: 'flex',
      alignItems: 'center',
    }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', flexShrink: 0, marginLeft: -4 }} />
      <div style={{ flex: 1, height: 1, background: 'rgba(239,68,68,0.6)' }} />
    </div>
  );
});

export default NowLine;
