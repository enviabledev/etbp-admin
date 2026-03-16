"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Breadcrumb from "@/components/ui/Breadcrumb";
import Header from "@/components/layout/Header";
import Card, { CardBody, CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import RouteForm from "@/components/forms/RouteForm";
import { useRoute, useUpdateRoute, useAddRouteStop, useDeleteRouteStop } from "@/hooks/queries/useRoutes";
import { useAllTerminals } from "@/hooks/queries/useTerminals";
import { useToast } from "@/components/ui/Toast";
import { formatCurrency } from "@/lib/utils";
import { ArrowLeft, Plus, Trash2, GripVertical } from "lucide-react";

type ApiError = Error & { response?: { data?: { detail?: string } } };

export default function RouteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const { data: route, isLoading } = useRoute(id);
  const { data: terminalsData } = useAllTerminals();
  const updateMutation = useUpdateRoute();
  const addStopMutation = useAddRouteStop();
  const deleteStopMutation = useDeleteRouteStop();

  const [showAddStop, setShowAddStop] = useState(false);
  const [deletingStop, setDeletingStop] = useState<string | null>(null);
  const [stopTerminal, setStopTerminal] = useState("");
  const [stopOrder, setStopOrder] = useState("");
  const [stopDuration, setStopDuration] = useState("");
  const [stopPrice, setStopPrice] = useState("");
  const [stopPickup, setStopPickup] = useState(true);
  const [stopDropoff, setStopDropoff] = useState(true);

  if (isLoading || !route) return <LoadingSpinner text="Loading route..." />;

  const terminals = terminalsData?.items || [];

  const handleUpdate = (formData: Record<string, unknown>) => {
    updateMutation.mutate({ id, ...formData }, {
      onSuccess: () => toast("success", "Route updated"),
      onError: (err: ApiError) => toast("error", err?.response?.data?.detail || "Failed to update"),
    });
  };

  const handleAddStop = () => {
    const payload: Record<string, unknown> = {
      routeId: id, terminal_id: stopTerminal, stop_order: parseInt(stopOrder),
      is_pickup_point: stopPickup, is_dropoff_point: stopDropoff,
    };
    if (stopDuration) payload.duration_from_origin_minutes = parseInt(stopDuration);
    if (stopPrice) payload.price_from_origin = parseFloat(stopPrice);
    addStopMutation.mutate(payload as Parameters<typeof addStopMutation.mutate>[0], {
      onSuccess: () => { setShowAddStop(false); setStopTerminal(""); setStopOrder(""); setStopDuration(""); setStopPrice(""); toast("success", "Stop added"); },
      onError: () => toast("error", "Failed to add stop"),
    });
  };

  return (
    <>
      <Breadcrumb items={[{ label: "Routes", href: "/routes" }, { label: route.name }]} />
      <Header title={route.name} subtitle={`Code: ${route.code}`}
        actions={<Button variant="ghost" onClick={() => router.push("/routes")}><ArrowLeft className="h-4 w-4 mr-2" /> Back</Button>} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card><CardHeader><h3 className="font-semibold">Edit Route</h3></CardHeader>
            <CardBody><RouteForm route={route} onSubmit={handleUpdate} isLoading={updateMutation.isPending} /></CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Intermediate Stops ({route.stops?.length || 0})</h3>
                <Button size="sm" onClick={() => { setShowAddStop(true); setStopOrder(String((route.stops?.length || 0) + 1)); }}>
                  <Plus className="h-3 w-3 mr-1" /> Add Stop
                </Button>
              </div>
            </CardHeader>
            {route.stops && route.stops.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {route.stops.sort((a, b) => a.stop_order - b.stop_order).map((stop) => (
                  <div key={stop.id} className="px-6 py-4 flex items-center gap-4">
                    <GripVertical className="h-4 w-4 text-gray-300 shrink-0" />
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-50 text-primary-600 text-sm font-bold shrink-0">{stop.stop_order}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{stop.terminal?.name}</p>
                      <div className="flex gap-3 mt-1 text-xs text-gray-500">
                        {stop.duration_from_origin_minutes && <span>{stop.duration_from_origin_minutes} min from origin</span>}
                        {stop.price_from_origin != null && <span>{formatCurrency(stop.price_from_origin)}</span>}
                        {stop.is_pickup_point && <span className="bg-green-50 text-green-700 px-1.5 py-0.5 rounded">Pickup</span>}
                        {stop.is_dropoff_point && <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">Dropoff</span>}
                      </div>
                    </div>
                    <button onClick={() => setDeletingStop(stop.id)} className="p-1.5 text-gray-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
            ) : (
              <CardBody><p className="text-sm text-gray-500 text-center py-6">No intermediate stops configured</p></CardBody>
            )}
          </Card>
        </div>

        <Card>
          <CardHeader><h3 className="font-semibold">Route Summary</h3></CardHeader>
          <CardBody className="space-y-3">
            <div className="flex justify-between"><span className="text-sm text-gray-500">Status</span><Badge status={route.is_active ? "active" : "retired"} /></div>
            <div className="flex justify-between"><span className="text-sm text-gray-500">Base Price</span><span className="text-sm font-medium">{formatCurrency(route.base_price)}</span></div>
            <div className="flex justify-between"><span className="text-sm text-gray-500">Distance</span><span className="text-sm font-medium">{route.distance_km ? `${route.distance_km} km` : "—"}</span></div>
            <div className="flex justify-between"><span className="text-sm text-gray-500">Duration</span><span className="text-sm font-medium">{route.estimated_duration_minutes ? `${Math.floor(route.estimated_duration_minutes / 60)}h ${route.estimated_duration_minutes % 60}m` : "—"}</span></div>
            <div className="flex justify-between"><span className="text-sm text-gray-500">Origin</span><span className="text-sm font-medium">{route.origin_terminal?.name}</span></div>
            <div className="flex justify-between"><span className="text-sm text-gray-500">Destination</span><span className="text-sm font-medium">{route.destination_terminal?.name}</span></div>
          </CardBody>
        </Card>
      </div>

      <Modal isOpen={showAddStop} onClose={() => setShowAddStop(false)} title="Add Intermediate Stop" size="md">
        <div className="space-y-4">
          <Select label="Terminal" value={stopTerminal} onChange={(e) => setStopTerminal(e.target.value)} placeholder="Select terminal..."
            options={terminals.map((t) => ({ value: t.id, label: `${t.name} (${t.code})` }))} />
          <div className="grid grid-cols-3 gap-4">
            <Input label="Stop Order" type="number" value={stopOrder} onChange={(e) => setStopOrder(e.target.value)} />
            <Input label="Duration (min)" type="number" value={stopDuration} onChange={(e) => setStopDuration(e.target.value)} placeholder="From origin" />
            <Input label="Price (NGN)" type="number" value={stopPrice} onChange={(e) => setStopPrice(e.target.value)} placeholder="From origin" />
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={stopPickup} onChange={(e) => setStopPickup(e.target.checked)} className="rounded" /> Pickup Point</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={stopDropoff} onChange={(e) => setStopDropoff(e.target.checked)} className="rounded" /> Dropoff Point</label>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowAddStop(false)}>Cancel</Button>
            <Button onClick={handleAddStop} loading={addStopMutation.isPending} disabled={!stopTerminal || !stopOrder}>Add Stop</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deletingStop} onClose={() => setDeletingStop(null)} onConfirm={() => {
        if (deletingStop) deleteStopMutation.mutate({ routeId: id, stopId: deletingStop }, {
          onSuccess: () => { setDeletingStop(null); toast("success", "Stop removed"); }, onError: () => toast("error", "Failed"),
        });
      }} title="Remove Stop" message="Remove this stop from the route?" confirmLabel="Remove" loading={deleteStopMutation.isPending} />
    </>
  );
}
