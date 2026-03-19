"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { useRouteStops, useDeleteRouteStop, useReorderRouteStops } from "@/hooks/queries/useRouteStops";
import { useToast } from "@/components/ui/Toast";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import StopFormModal from "./StopFormModal";

interface StopData {
  id: string;
  name: string;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  stop_order: number;
  duration_from_origin_minutes: number | null;
  stop_duration_minutes: number;
  is_rest_stop: boolean;
  is_pickup_point: boolean;
  is_dropoff_point: boolean;
  notes: string | null;
}

interface StopsTabProps {
  routeId: string;
}

export default function StopsTab({ routeId }: StopsTabProps) {
  const { toast } = useToast();
  const { data: stops = [], isLoading } = useRouteStops(routeId);
  const deleteMutation = useDeleteRouteStop();
  const reorderMutation = useReorderRouteStops();

  const [showForm, setShowForm] = useState(false);
  const [editingStop, setEditingStop] = useState<StopData | null>(null);
  const [deletingStop, setDeletingStop] = useState<StopData | null>(null);

  const sortedStops = [...(stops as StopData[])].sort((a, b) => a.stop_order - b.stop_order);

  const handleReorder = (index: number, direction: "up" | "down") => {
    const newStops = [...sortedStops];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newStops.length) return;
    [newStops[index], newStops[swapIndex]] = [newStops[swapIndex], newStops[index]];
    reorderMutation.mutate(
      { routeId, stopIds: newStops.map(s => s.id) },
      { onError: () => toast("error", "Reorder failed") }
    );
  };

  if (isLoading) return <div className="py-8 text-center text-gray-400">Loading stops...</div>;

  return (
    <Card>
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Intermediate Stops ({sortedStops.length})</h3>
        <Button size="sm" onClick={() => { setEditingStop(null); setShowForm(true); }}><Plus className="h-4 w-4 mr-1" /> Add Stop</Button>
      </div>

      {sortedStops.length === 0 ? (
        <div className="py-12 text-center text-gray-400 text-sm">No intermediate stops. Click &quot;Add Stop&quot; to define the route breakdown.</div>
      ) : (
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3 w-16">Order</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">Name</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">City</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">Coordinates</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">Est. Min</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">Duration</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">Type</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {sortedStops.map((stop, i) => (
              <tr key={stop.id}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium">{stop.stop_order}</span>
                    <div className="flex flex-col">
                      {i > 0 && <button onClick={() => handleReorder(i, "up")} className="p-0.5 hover:bg-gray-100 rounded"><ChevronUp className="h-3 w-3 text-gray-400" /></button>}
                      {i < sortedStops.length - 1 && <button onClick={() => handleReorder(i, "down")} className="p-0.5 hover:bg-gray-100 rounded"><ChevronDown className="h-3 w-3 text-gray-400" /></button>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm font-medium">{stop.name}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{stop.city || "—"}</td>
                <td className="px-4 py-3 text-xs font-mono text-gray-500">
                  {stop.latitude != null && stop.longitude != null ? `${stop.latitude}, ${stop.longitude}` : "—"}
                </td>
                <td className="px-4 py-3 text-sm">{stop.duration_from_origin_minutes ?? "—"}</td>
                <td className="px-4 py-3 text-sm">{stop.stop_duration_minutes ? `${stop.stop_duration_minutes}m` : "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {stop.is_rest_stop && <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-700">Rest</span>}
                    {stop.is_pickup_point && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">Pickup</span>}
                    {stop.is_dropoff_point && <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-100 text-orange-700">Dropoff</span>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => { setEditingStop(stop); setShowForm(true); }} className="p-1 hover:bg-gray-100 rounded"><Pencil className="h-3.5 w-3.5 text-gray-400" /></button>
                    <button onClick={() => setDeletingStop(stop)} className="p-1 hover:bg-red-50 rounded"><Trash2 className="h-3.5 w-3.5 text-red-400" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <StopFormModal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditingStop(null); }}
        routeId={routeId}
        existingStop={editingStop}
        nextOrder={sortedStops.length > 0 ? Math.max(...sortedStops.map(s => s.stop_order)) + 1 : 1}
      />

      <ConfirmDialog
        isOpen={!!deletingStop}
        onClose={() => setDeletingStop(null)}
        onConfirm={() => {
          if (deletingStop) {
            deleteMutation.mutate({ routeId, stopId: deletingStop.id }, {
              onSuccess: () => { setDeletingStop(null); toast("success", "Stop deleted"); },
              onError: () => toast("error", "Delete failed"),
            });
          }
        }}
        title="Delete Stop"
        message={`Delete stop "${deletingStop?.name}"? This cannot be undone.`}
        loading={deleteMutation.isPending}
      />
    </Card>
  );
}
