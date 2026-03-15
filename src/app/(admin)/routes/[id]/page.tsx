"use client";

import { useParams, useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Card, { CardBody, CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import RouteForm from "@/components/forms/RouteForm";
import { useRoute, useUpdateRoute, useDeleteRouteStop } from "@/hooks/queries/useRoutes";
import { useToast } from "@/components/ui/Toast";
import { formatCurrency } from "@/lib/utils";
import { ArrowLeft, Trash2 } from "lucide-react";

export default function RouteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const { data: route, isLoading } = useRoute(id);
  const updateMutation = useUpdateRoute();
  const deleteStopMutation = useDeleteRouteStop();

  if (isLoading || !route) return <LoadingSpinner text="Loading route..." />;

  const handleUpdate = (formData: Record<string, unknown>) => {
    updateMutation.mutate(
      { id, ...formData },
      {
        onSuccess: () => toast("success", "Route updated successfully"),
        onError: (err: Error & { response?: { data?: { detail?: string } } }) => toast("error", err?.response?.data?.detail || "Failed to update"),
      }
    );
  };

  const handleDeleteStop = (stopId: string) => {
    if (!confirm("Remove this stop?")) return;
    deleteStopMutation.mutate(
      { routeId: id, stopId },
      {
        onSuccess: () => toast("success", "Stop removed"),
        onError: (err: Error & { response?: { data?: { detail?: string } } }) => toast("error", err?.response?.data?.detail || "Failed to remove stop"),
      }
    );
  };

  return (
    <>
      <Header
        title={route.name}
        subtitle={`Route Code: ${route.code}`}
        actions={
          <Button variant="ghost" onClick={() => router.push("/routes")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Edit Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-gray-900">Edit Route</h3>
            </CardHeader>
            <CardBody>
              <RouteForm route={route} onSubmit={handleUpdate} isLoading={updateMutation.isPending} />
            </CardBody>
          </Card>
        </div>

        {/* Route Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-gray-900">Route Summary</h3>
            </CardHeader>
            <CardBody className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Status</span>
                <Badge status={route.is_active ? "active" : "retired"} />
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Base Price</span>
                <span className="text-sm font-medium">{formatCurrency(route.base_price)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Distance</span>
                <span className="text-sm font-medium">{route.distance_km ? `${route.distance_km} km` : "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Duration</span>
                <span className="text-sm font-medium">
                  {route.estimated_duration_minutes
                    ? `${Math.floor(route.estimated_duration_minutes / 60)}h ${route.estimated_duration_minutes % 60}m`
                    : "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Origin</span>
                <span className="text-sm font-medium">{route.origin_terminal?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Destination</span>
                <span className="text-sm font-medium">{route.destination_terminal?.name}</span>
              </div>
            </CardBody>
          </Card>

          {/* Route Stops */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-gray-900">Stops ({route.stops?.length || 0})</h3>
            </CardHeader>
            {route.stops && route.stops.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {route.stops.map((stop) => (
                  <div key={stop.id} className="px-6 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {stop.stop_order}. {stop.terminal?.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {stop.duration_from_origin_minutes ? `${stop.duration_from_origin_minutes} min from origin` : ""}
                        {stop.price_from_origin ? ` · ${formatCurrency(stop.price_from_origin)}` : ""}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteStop(stop.id)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <CardBody>
                <p className="text-sm text-gray-500 text-center py-4">No stops configured</p>
              </CardBody>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
