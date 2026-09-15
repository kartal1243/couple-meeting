import { memo } from 'react';
import { VIP_LEVELS } from '../../constants';

const VipBadge = memo(function VipBadge({ level, size = 11 }) {
  const lvl = Number(level) || 0;
  if (!lvl) return null;
  const L = VIP_LEVELS[lvl] || VIP_LEVELS[1];
  return (
    <span
      title={L.label || 'VIP'}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 2,
        background: L.gradient, color: '#fff',
        fontSize: size, fontWeight: 900, lineHeight: 1,
        padding: '2px 6px', borderRadius: 20, marginLeft: 4,
        verticalAlign: 'middle', whiteSpace: 'nowrap',
        boxShadow: `0 0 8px ${L.color}66`
      }}
    >
      <span>{L.icon}</span>
      <span>{L.label ? L.label.split(' ')[0].toUpperCase() : 'VIP'}</span>
    </span>
  );
});

export default VipBadge;
