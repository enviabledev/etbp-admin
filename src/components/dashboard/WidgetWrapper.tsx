"use client";

import { useQuery } from "@tanstack/react-query";
import { GripVertical, X } from "lucide-react";
import api from "@/lib/api";
import StatCardWidget from "./StatCardWidget";
import ChartWidget from "./ChartWidget";

interface WidgetWrapperProps {
  widget: { id: string; widget_type: string; data_source: string; title: string; config: Record<string, unknown> | null };
  editMode?: boolean;
  onRemove?: () => void;
}

export default function WidgetWrapper({ widget, editMode, onRemove }: WidgetWrapperProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["widget-data", widget.id],
    queryFn: async () => {
      const { data } = await api.get(`/api/admin/analytics/dashboard/widgets/${widget.id}/data`);
      return data;
    },
    staleTime: 300000,
  });

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {editMode && <GripVertical className="widget-drag-handle h-4 w-4 text-gray-400 cursor-grab" />}
          <h3 className="text-sm font-semibold text-gray-700">{widget.title}</h3>
        </div>
        {editMode && onRemove && (
          <button onClick={onRemove} className="p-1 hover:bg-red-50 rounded"><X className="h-3.5 w-3.5 text-red-400" /></button>
        )}
      </div>
      <div className="flex-1 min-h-0">
        {widget.widget_type === "stat_card" ? (
          <StatCardWidget value={data?.value ?? 0} label={widget.title} comparison={data?.comparison} format={data?.format} isLoading={isLoading} />
        ) : (
          <ChartWidget type={widget.widget_type as "line_chart" | "bar_chart" | "pie_chart"} data={data?.trend || data?.data || data?.distribution || data?.drivers || []} isLoading={isLoading} />
        )}
      </div>
    </div>
  );
}
