"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Play, CheckCircle, XCircle } from "lucide-react";
import { useMaintenanceDetail, useUpdateMaintenanceStatus } from "@/hooks/queries/useMaintenance";
import { useToast } from "@/components/ui/Toast";
import { formatCurrency, formatDate, formatDateTime, cn } from "@/lib/utils";
import Button from "@/components/ui/Button";
import Card, { CardBody, CardHeader } from "@/components/ui/Card";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

const PRIORITY_COLORS: Record<string, string> = { critical: "text-red-600", high: "text-orange-600", medium: "text-yellow-600", low: "text-gray-500" };
const STATUS_COLORS: Record<string, string> = { scheduled: "bg-blue-100 text-blue-700", in_progress: "bg-yellow-100 text-yellow-700", completed: "bg-green-100 text-green-700", overdue: "bg-red-100 text-red-700", cancelled: "bg-gray-100 text-gray-600" };

export default function MaintenanceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { data: record, isLoading } = useMaintenanceDetail(id);
  const statusMutation = useUpdateMaintenanceStatus();

  if (isLoading || !record) return <LoadingSpinner />;

  const updateStatus = (status: string) => {
    statusMutation.mutate({ id, status }, {
      onSuccess: () => toast("success", `Status updated to ${status}`),
      onError: () => toast("error", "Failed to update"),
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link href="/maintenance" className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600">
        <ArrowLeft className="h-4 w-4" /> Back to Maintenance
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{record.title}</h1>
          <p className="text-sm text-gray-500 mt-1">Vehicle: {record.vehicle_plate}</p>
        </div>
        <div className="flex gap-2 items-center">
          <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium capitalize", STATUS_COLORS[record.status] || "")}>{record.status?.replace(/_/g, " ")}</span>
          {record.status === "scheduled" && <Button size="sm" onClick={() => updateStatus("in_progress")} loading={statusMutation.isPending}><Play className="h-3 w-3 mr-1" /> Start</Button>}
          {record.status === "in_progress" && <Button size="sm" onClick={() => updateStatus("completed")} loading={statusMutation.isPending}><CheckCircle className="h-3 w-3 mr-1" /> Complete</Button>}
          {record.status !== "completed" && record.status !== "cancelled" && (
            <Button size="sm" variant="danger" onClick={() => updateStatus("cancelled")} loading={statusMutation.isPending}><XCircle className="h-3 w-3 mr-1" /> Cancel</Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader><h3 className="font-semibold">Details</h3></CardHeader>
        <CardBody className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-gray-500">Type</span><p className="font-medium capitalize">{record.maintenance_type?.replace(/_/g, " ")}</p></div>
          <div><span className="text-gray-500">Priority</span><p className={cn("font-medium capitalize", PRIORITY_COLORS[record.priority] || "")}>{record.priority}</p></div>
          <div><span className="text-gray-500">Scheduled Date</span><p className="font-medium">{formatDate(record.scheduled_date)}</p></div>
          <div><span className="text-gray-500">Cost</span><p className="font-medium">{record.cost ? formatCurrency(record.cost) : "\u2014"}</p></div>
          {record.vendor_name && <div><span className="text-gray-500">Vendor</span><p className="font-medium">{record.vendor_name}</p></div>}
          {record.vendor_contact && <div><span className="text-gray-500">Vendor Contact</span><p className="font-medium">{record.vendor_contact}</p></div>}
          {record.started_at && <div><span className="text-gray-500">Started</span><p className="font-medium">{formatDateTime(record.started_at)}</p></div>}
          {record.completed_at && <div><span className="text-gray-500">Completed</span><p className="font-medium">{formatDateTime(record.completed_at)}</p></div>}
          {record.mileage_at_service && <div><span className="text-gray-500">Mileage</span><p className="font-medium">{record.mileage_at_service?.toLocaleString()} km</p></div>}
          {record.next_service_due_date && <div><span className="text-gray-500">Next Due</span><p className="font-medium">{formatDate(record.next_service_due_date)}</p></div>}
        </CardBody>
      </Card>

      {record.description && (
        <Card><CardHeader><h3 className="font-semibold">Description</h3></CardHeader><CardBody><p className="text-sm text-gray-700 whitespace-pre-wrap">{record.description}</p></CardBody></Card>
      )}

      {record.parts_replaced && (record.parts_replaced as Array<Record<string, unknown>>).length > 0 && (
        <Card>
          <CardHeader><h3 className="font-semibold">Parts Replaced</h3></CardHeader>
          <CardBody>
            <div className="space-y-2">
              {(record.parts_replaced as Array<Record<string, unknown>>).map((p: Record<string, unknown>, i: number) => (
                <div key={i} className="flex justify-between text-sm">
                  <span>{p.name as string} (x{p.quantity as number})</span>
                  <span className="font-medium">{p.cost ? formatCurrency(p.cost as number) : "\u2014"}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {record.notes && (
        <Card><CardHeader><h3 className="font-semibold">Notes</h3></CardHeader><CardBody><p className="text-sm text-gray-700 whitespace-pre-wrap">{record.notes}</p></CardBody></Card>
      )}
    </div>
  );
}
