"use client";

import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";

interface ChartWidgetProps {
  type: "line_chart" | "bar_chart" | "pie_chart";
  data: Array<Record<string, unknown>>;
  title?: string;
  isLoading?: boolean;
}

const COLORS = ["#0057FF", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

export default function ChartWidget({ type, data, isLoading }: ChartWidgetProps) {
  if (isLoading || !data || data.length === 0) {
    return <div className="h-full flex items-center justify-center text-gray-400 text-sm">No data</div>;
  }

  const dataKey = Object.keys(data[0]).find(k => k !== "label" && k !== "name") || "value";
  const labelKey = data[0].label !== undefined ? "label" : "name";

  if (type === "line_chart") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey={labelKey} tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Line type="monotone" dataKey={dataKey} stroke="#0057FF" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (type === "bar_chart") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey={labelKey} tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Bar dataKey={dataKey} fill="#0057FF" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (type === "pie_chart") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey={dataKey} nameKey={labelKey} cx="50%" cy="50%" innerRadius="40%" outerRadius="70%" label>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  return null;
}
