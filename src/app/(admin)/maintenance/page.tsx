"use client";

import { useState } from "react";
import Link from "next/link";
import { Wrench, Plus, AlertTriangle, Clock, CheckCircle, Eye } from "lucide-react";
import { useMaintenance, useMaintenanceStats, useCreateMaintenance } from "@/hooks/queries/useMaintenance";
import { useToast } from "@/components/ui/Toast";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

const PRIORITY_COLORS: Record<string, string> = {
  critical: "bg-red-100 text-red-700",
  high: "bg-orange-100 text-orange-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-gray-100 text-gray-600",
};
const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  completed: "bg-green-100 text-green-700",
  overdue: "bg-red-100 text-red-700",
  cancelled: "bg-gray-100 text-gray-600",
};

export default function MaintenancePage() {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ vehicle_id: "", maintenance_type: "scheduled_service", title: "", scheduled_date: "", priority: "medium", vendor_name: "", cost: "" });
  const { toast } = useToast();

  const { data, isLoading } = useMaintenance({ status: statusFilter || undefined });
  const { data: stats } = useMaintenanceStats();
  const createMutation = useCreateMaintenance();

  const items = data?.items || [];

  const handleCreate = () => {
    createMutation.mutate(
      { ...form, cost: form.cost ? parseFloat(form.cost) : undefined, vendor_name: form.vendor_name || undefined },
      {
        onSuccess: () => { setShowCreate(false); setForm({ vehicle_id: "", maintenance_type: "scheduled_service", title: "", scheduled_date: "", priority: "medium", vendor_name: "", cost: "" }); toast("success", "Maintenance scheduled"); },
        onError: () => toast("error", "Failed to schedule"),
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Maintenance</h1>
        <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-2" /> Schedule Maintenance</Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Upcoming (7d)", value: stats.upcoming_7_days, icon: Clock, color: "text-blue-600" },
            { label: "Overdue", value: stats.overdue, icon: AlertTriangle, color: "text-red-600" },
            { label: "In Progress", value: stats.in_progress, icon: Wrench, color: "text-yellow-600" },
            { label: "Cost This Month", value: formatCurrency(stats.total_cost_this_month), icon: CheckCircle, color: "text-green-600" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border p-5">
              <s.icon className={cn("h-5 w-5 mb-2", s.color)} />
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2">
        {["", "scheduled", "in_progress", "overdue", "completed"].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={cn("px-3 py-1.5 rounded-lg text-sm font-medium", statusFilter === s ? "bg-blue-50 text-blue-700" : "text-gray-500 hover:bg-gray-50")}>
            {s ? s.replace(/_/g, " ") : "All"}
          </button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? <LoadingSpinner /> : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Date</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Vehicle</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Title</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Priority</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Cost</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((r: Record<string, string | number | null>) => (
                <tr key={r.id as string}>
                  <td className="px-5 py-4 text-sm">{formatDate(r.scheduled_date as string)}</td>
                  <td className="px-5 py-4 text-sm font-mono">{r.vehicle_plate}</td>
                  <td className="px-5 py-4 text-sm font-medium">{r.title}</td>
                  <td className="px-5 py-4"><span className={cn("text-xs px-2 py-0.5 rounded-full font-medium capitalize", PRIORITY_COLORS[r.priority as string] || "")}>{r.priority}</span></td>
                  <td className="px-5 py-4"><span className={cn("text-xs px-2 py-0.5 rounded-full font-medium capitalize", STATUS_COLORS[r.status as string] || "")}>{(r.status as string)?.replace(/_/g, " ")}</span></td>
                  <td className="px-5 py-4 text-sm">{r.cost ? formatCurrency(r.cost as number) : "\u2014"}</td>
                  <td className="px-5 py-4">
                    <Link href={`/maintenance/${r.id}`}><button className="p-1.5 rounded hover:bg-gray-100"><Eye className="h-4 w-4 text-gray-500" /></button></Link>
                  </td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-gray-400">No maintenance records</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Schedule Maintenance">
        <div className="space-y-4">
          <Input label="Vehicle ID" value={form.vehicle_id} onChange={e => setForm({ ...form, vehicle_id: e.target.value })} placeholder="Paste vehicle UUID" />
          <Select label="Type" value={form.maintenance_type} onChange={e => setForm({ ...form, maintenance_type: e.target.value })} options={[
            { value: "scheduled_service", label: "Scheduled Service" }, { value: "repair", label: "Repair" },
            { value: "inspection", label: "Inspection" }, { value: "tire_change", label: "Tire Change" },
            { value: "oil_change", label: "Oil Change" }, { value: "brake_service", label: "Brake Service" },
            { value: "ac_service", label: "A/C Service" }, { value: "other", label: "Other" },
          ]} />
          <Input label="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          <Input label="Scheduled Date" type="date" value={form.scheduled_date} onChange={e => setForm({ ...form, scheduled_date: e.target.value })} />
          <Select label="Priority" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} options={[
            { value: "low", label: "Low" }, { value: "medium", label: "Medium" },
            { value: "high", label: "High" }, { value: "critical", label: "Critical" },
          ]} />
          <Input label="Vendor (optional)" value={form.vendor_name} onChange={e => setForm({ ...form, vendor_name: e.target.value })} />
          <Input label="Estimated Cost (optional)" type="number" value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })} />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} loading={createMutation.isPending} disabled={!form.vehicle_id || !form.title || !form.scheduled_date}>Schedule</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
