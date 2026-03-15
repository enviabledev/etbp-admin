"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface OccupancyData {
  route_name: string;
  route_code: string;
  occupancy_percent: number;
  booked_seats: number;
  total_seats: number;
}

interface Props {
  data: OccupancyData[];
}

export default function OccupancyChart({ data }: Props) {
  const chartData = data.slice(0, 10).map((d) => ({
    name: d.route_code,
    occupancy: d.occupancy_percent,
    label: `${d.route_name} — ${d.booked_seats}/${d.total_seats} seats`,
  }));

  const getColor = (pct: number) => {
    if (pct >= 80) return "#16a34a";
    if (pct >= 50) return "#0057FF";
    if (pct >= 25) return "#d97706";
    return "#dc2626";
  };

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
          <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}%`} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={80} />
          <Tooltip
            formatter={(value) => [`${value}%`, "Occupancy"]}
            contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb" }}
          />
          <Bar dataKey="occupancy" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={getColor(entry.occupancy)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
