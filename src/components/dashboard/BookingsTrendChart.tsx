"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { BookingTrend } from "@/types";

interface BookingsTrendChartProps {
  data: BookingTrend[];
}

export default function BookingsTrendChart({ data }: BookingsTrendChartProps) {
  const chartData = [...data].reverse().map((d) => ({
    date: d.period.split("T")[0],
    confirmed: d.confirmed,
    pending: d.pending,
    cancelled: d.cancelled,
  }));

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb" }} />
          <Legend />
          <Bar dataKey="confirmed" fill="#16a34a" radius={[2, 2, 0, 0]} />
          <Bar dataKey="pending" fill="#d97706" radius={[2, 2, 0, 0]} />
          <Bar dataKey="cancelled" fill="#dc2626" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
