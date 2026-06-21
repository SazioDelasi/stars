import React from 'react';

interface StatItem { label: string; value: string | number; color?: string; }

interface Props { stats: StatItem[]; }

const SummaryCards: React.FC<Props> = ({ stats }) => (
  <div style={{
    display: 'grid',
    gridTemplateColumns: `repeat(${Math.min(stats.length, 6)}, 1fr)`,
    gap: 12, marginBottom: 20
  }}>
    {stats.map((s, i) => (
      <div key={i} style={{
        background: 'white', borderRadius: 10, padding: '14px 16px',
        border: '1px solid var(--gray-200)', textAlign: 'center'
      }}>
        <div style={{
          fontSize: 24, fontWeight: 900, fontFamily: 'DM Mono, monospace',
          color: s.color || 'var(--navy)', lineHeight: 1
        }}>{s.value}</div>
        <div style={{ fontSize: 11, color: 'var(--gray-500)', marginTop: 4, fontWeight: 600 }}>
          {s.label}
        </div>
      </div>
    ))}
  </div>
);

export default SummaryCards;
