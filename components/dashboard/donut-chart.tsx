'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { formatNumber, formatPercent } from '@/lib/format';

const COLORS = ['var(--success)', 'var(--primary)', 'var(--accent)', 'hsl(280 60% 60%)', 'var(--muted-foreground)'];

export function DonutChart({ data }: { data: { nama: string; beratKg: number; persen: number }[] }) {
  return (
    <div className="flex items-center gap-6">
      <ResponsiveContainer width={160} height={160}>
        <PieChart>
          <Pie data={data} dataKey="beratKg" nameKey="nama" innerRadius={45} outerRadius={70} paddingAngle={2}>
            {data.map((entry, i) => (
              <Cell key={entry.nama} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `${formatNumber(Number(value))} kg`} />
        </PieChart>
      </ResponsiveContainer>
      <ul className="space-y-1 text-sm">
        {data.map((entry, i) => (
          <li key={entry.nama} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
            {entry.nama}
            <span className="text-muted-foreground">{formatPercent(entry.persen)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
