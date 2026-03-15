"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { RevenueData } from "@/types";
import { formatCurrency } from "@/lib/utils";

interface RevenueChartProps {
  data: RevenueData[];
}

export default function RevenueChart({ data }: RevenueChartProps) {
  const chartData = [...data].reverse().map((d) => ({
    date: d.period.split("T")[0],
    revenue: d.amount,
    transactions: d.count,
  }));

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0057FF" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#0057FF" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
          <YAxis
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            formatter={(value) => [formatCurrency(Number(value)), "Revenue"]}
            labelStyle={{ fontWeight: 600 }}
            contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb" }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#0057FF"
            strokeWidth={2}
            fill="url(#revenueGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
