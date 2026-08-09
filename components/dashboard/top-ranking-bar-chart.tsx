'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer, LabelList } from 'recharts';
import { formatNumber } from '@/lib/format';

const COLORS = ['var(--success)', 'var(--primary)', 'var(--accent)', 'hsl(280 60% 60%)', 'var(--muted-foreground)'];

export function TopRankingBarChart({ data, unit }: { data: { label: string; value: number }[]; unit: string }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(160, data.length * 40)}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 40, bottom: 4, left: 8 }}>
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="label" width={110} tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
        <Tooltip formatter={(value) => `${formatNumber(Number(value))} ${unit}`} />
        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
          {data.map((entry, i) => (
            <Cell key={entry.label} fill={COLORS[i % COLORS.length]} />
          ))}
          <LabelList
            dataKey="value"
            position="right"
            formatter={(v) => `${formatNumber(Number(v))} ${unit}`}
            fill="var(--foreground)"
            fontSize={12}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
