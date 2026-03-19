"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings, Plus, RotateCcw } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import Button from "@/components/ui/Button";
import WidgetWrapper from "@/components/dashboard/WidgetWrapper";
import AddWidgetModal from "@/components/dashboard/AddWidgetModal";

interface Widget {
  id: string;
  widget_type: string;
  data_source: string;
  title: string;
  config: Record<string, unknown> | null;
  position: { x: number; y: number; w: number; h: number };
}

export default function DashboardPage() {
  const [editMode, setEditMode] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: widgets = [], isLoading } = useQuery<Widget[]>({
    queryKey: ["dashboard-widgets"],
    queryFn: async () => {
      const { data } = await api.get("/api/admin/analytics/dashboard/widgets");
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await api.delete(`/api/admin/analytics/dashboard/widgets/${id}`); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dashboard-widgets"] }),
  });

  const resetMutation = useMutation({
    mutationFn: async () => {
      for (const w of widgets) { await api.delete(`/api/admin/analytics/dashboard/widgets/${w.id}`); }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["dashboard-widgets"] }); setEditMode(false); toast("success", "Dashboard reset to defaults"); },
  });

  if (isLoading) return <div className="flex items-center justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div>;

  const statWidgets = widgets.filter(w => w.widget_type === "stat_card");
  const chartWidgets = widgets.filter(w => w.widget_type !== "stat_card");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex gap-2">
          {editMode ? (
            <>
              <Button size="sm" onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-1" /> Add Widget</Button>
              <Button size="sm" variant="danger" onClick={() => { if (confirm("Reset dashboard to defaults?")) resetMutation.mutate(); }} loading={resetMutation.isPending}><RotateCcw className="h-4 w-4 mr-1" /> Reset</Button>
              <Button size="sm" variant="secondary" onClick={() => setEditMode(false)}>Done</Button>
            </>
          ) : (
            <Button size="sm" variant="secondary" onClick={() => setEditMode(true)}><Settings className="h-4 w-4 mr-1" /> Customize</Button>
          )}
        </div>
      </div>

      {/* Stat cards row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statWidgets.map(w => (
          <div key={w.id} className="relative">
            <WidgetWrapper widget={w} editMode={editMode} onRemove={() => deleteMutation.mutate(w.id)} />
          </div>
        ))}
      </div>

      {/* Chart widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {chartWidgets.map(w => (
          <div key={w.id} className="relative" style={{ minHeight: 300 }}>
            <WidgetWrapper widget={w} editMode={editMode} onRemove={() => deleteMutation.mutate(w.id)} />
          </div>
        ))}
      </div>

      {widgets.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border">
          <p className="text-gray-500 mb-4">No widgets configured. Add widgets to build your dashboard.</p>
          <Button onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-2" /> Add Widget</Button>
        </div>
      )}

      <AddWidgetModal isOpen={showAdd} onClose={() => setShowAdd(false)} />
    </div>
  );
}
