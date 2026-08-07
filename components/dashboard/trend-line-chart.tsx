'use client';

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { formatDate, formatNumber } from '@/lib/format';

export function TrendLineChart({ data }: { data: { tanggal: string; totalKg: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey="tanggal"
          tickFormatter={(v) => formatDate(v).replace(/^\d+ /, '')}
          stroke="var(--muted-foreground)"
          fontSize={12}
        />
        <YAxis tickFormatter={(v) => formatNumber(v)} stroke="var(--muted-foreground)" fontSize={12} />
        <Tooltip
          formatter={(value) => [`${formatNumber(Number(value))} kg`, 'Total']}
          labelFormatter={(label) => formatDate(String(label))}
          contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        />
        <Line type="monotone" dataKey="totalKg" stroke="var(--success)" strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
