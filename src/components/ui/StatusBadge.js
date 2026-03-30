import React, { memo } from 'react';
import { getStatusStyle } from '../../utils/colorUtils';

const StatusBadge = memo(({ status, size = 'md' }) => {
  const style = getStatusStyle(status);
  const sizes = {
    sm: { fontSize: 9, padding: '2px 7px', borderRadius: 10 },
    md: { fontSize: 11, padding: '3px 10px', borderRadius: 12 },
    lg: { fontSize: 13, padding: '5px 14px', borderRadius: 14 },
  };

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      background: style.bg,
      color: style.text,
      fontWeight: 700,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      ...sizes[size],
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(255,255,255,0.6)', flexShrink: 0 }} />
      {style.label}
    </span>
  );
});

export default StatusBadge;
