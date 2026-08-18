'use client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { CATEGORIES, getCategoryInfo } from '@/lib/constants';

function buildHistogram(scores, bins = 20, totalMarks = 100) {
  if (!scores || scores.length === 0) return [];

  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const range = max - min || 1;
  const binSize = range / bins;

  const histogram = Array.from({ length: bins }, (_, i) => ({
    range: `${Math.round(min + i * binSize)}`,
    count: 0,
    start: min + i * binSize,
    end: min + (i + 1) * binSize,
  }));

  scores.forEach(score => {
    const idx = Math.min(Math.floor((score - min) / binSize), bins - 1);
    if (histogram[idx]) histogram[idx].count++;
  });

  return histogram.filter(b => b.count > 0);
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)', padding: '12px 16px', fontSize: '0.85rem'
      }}>
        <div style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>Score: ~{label}</div>
        <div style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{payload[0].value} students</div>
      </div>
    );
  }
  return null;
};

export default function CutoffChart({ submissions, cutoffStats, category, totalMarks = 100 }) {
  const filtered = submissions?.filter(s => !category || s.category === category) || [];
  const scores = filtered.map(s => parseFloat(s.score));
  const data = buildHistogram(scores, 20, totalMarks);

  const catInfo = getCategoryInfo(category || 'General');
  const likely = parseFloat(cutoffStats?.cutoff_likely);

  if (scores.length < 3) {
    return (
      <div className="empty-state" style={{ padding: '40px' }}>
        <div className="empty-icon">📊</div>
        <h3>Not enough data</h3>
        <p>At least 3 submissions needed to generate the distribution chart.</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Score Distribution</h3>
        <span className="badge" style={{
          background: `${catInfo.color}20`, color: catInfo.color,
          border: `1px solid ${catInfo.color}40`
        }}>
          {catInfo.label} — {scores.length} submissions
        </span>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis
            dataKey="range"
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            axisLine={{ stroke: 'var(--border)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
          <Bar dataKey="count" fill={catInfo.color} radius={[4, 4, 0, 0]} fillOpacity={0.85} />
          {likely && !isNaN(likely) && (
            <ReferenceLine
              x={Math.round(likely).toString()}
              stroke="#f59e0b"
              strokeDasharray="6 3"
              strokeWidth={2}
              label={{ value: `Cutoff ~${Math.round(likely)}`, fill: '#f59e0b', fontSize: 11, position: 'top' }}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
