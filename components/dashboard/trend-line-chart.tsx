'use client';

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { formatDate, formatNumber } from '@/lib/format';

export function TrendLineChart({ data }: { data: { tanggal: string; totalKg: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--success)" stopOpacity={0.35} />
            <stop offset="95%" stopColor="var(--success)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey="tanggal"
          tickFormatter={(v) => formatDate(v).replace(/ \d{4}$/, '')}
          stroke="var(--muted-foreground)"
          fontSize={12}
        />
        <YAxis tickFormatter={(v) => formatNumber(v)} stroke="var(--muted-foreground)" fontSize={12} />
        <Tooltip
          formatter={(value) => [`${formatNumber(Number(value))} kg`, 'Total']}
          labelFormatter={(label) => formatDate(String(label))}
          contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        />
        <Area
          type="monotone"
          dataKey="totalKg"
          stroke="var(--success)"
          strokeWidth={2}
          fill="url(#trendFill)"
          dot={{ r: 3 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
