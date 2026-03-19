"use client";

import { useParams, useRouter } from "next/navigation";
import Breadcrumb from "@/components/ui/Breadcrumb";
import Header from "@/components/layout/Header";
import Card, { CardBody, CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import RouteForm from "@/components/forms/RouteForm";
import { useRoute, useUpdateRoute } from "@/hooks/queries/useRoutes";
import StopsTab from "@/components/routes/StopsTab";
import { useToast } from "@/components/ui/Toast";
import { formatCurrency } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

type ApiError = Error & { response?: { data?: { detail?: string } } };

export default function RouteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const { data: route, isLoading } = useRoute(id);
  const updateMutation = useUpdateRoute();

  if (isLoading || !route) return <LoadingSpinner text="Loading route..." />;

  const handleUpdate = (formData: Record<string, unknown>) => {
    updateMutation.mutate({ id, ...formData }, {
      onSuccess: () => toast("success", "Route updated"),
      onError: (err: ApiError) => toast("error", err?.response?.data?.detail || "Failed to update"),
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

          <StopsTab routeId={id} />
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

    </>
  );
}
