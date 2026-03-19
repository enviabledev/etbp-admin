"use client";

import { cn } from "@/lib/utils";

interface StatCardWidgetProps {
  value: number | string;
  label: string;
  comparison?: string;
  format?: "currency" | "number" | "percentage" | "rating";
  isLoading?: boolean;
}

function formatValue(value: number | string, format?: string): string {
  if (typeof value === "string") return value;
  if (format === "currency") {
    if (value >= 1_000_000) return `₦${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `₦${(value / 1_000).toFixed(0)}K`;
    return `₦${value.toLocaleString()}`;
  }
  if (format === "percentage") return `${value}%`;
  if (format === "rating") return `${value} ★`;
  return value.toLocaleString();
}

export default function StatCardWidget({ value, label, comparison, format, isLoading }: StatCardWidgetProps) {
  if (isLoading) return <div className="animate-pulse"><div className="h-8 w-24 bg-gray-200 rounded mb-2" /><div className="h-4 w-16 bg-gray-200 rounded" /></div>;

  const isPositive = comparison?.startsWith("+") || comparison?.startsWith("↑");
  const isNegative = comparison?.startsWith("-") || comparison?.startsWith("↓");

  return (
    <div className="h-full flex flex-col justify-center">
      <p className="text-3xl font-bold text-gray-900">{formatValue(value, format)}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
      {comparison && (
        <p className={cn("text-xs font-medium mt-1", isPositive ? "text-green-600" : isNegative ? "text-red-600" : "text-gray-500")}>
          {comparison}
        </p>
      )}
    </div>
  );
}
