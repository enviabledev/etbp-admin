"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import Header from "@/components/layout/Header";
import Card, { CardHeader, CardBody } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { Table, Thead, Tbody, Th, Tr, Td } from "@/components/ui/Table";
import Pagination from "@/components/ui/Pagination";
import { useToast } from "@/components/ui/Toast";
import { formatCurrency, formatTime } from "@/lib/utils";
import { Zap } from "lucide-react";
import type { Schedule, Trip, PaginatedResponse } from "@/types";

export default function ScheduleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [form, setForm] = useState<Record<string, any>>({});
  const [genFrom, setGenFrom] = useState("");
  const [genTo, setGenTo] = useState("");
  const [showGenerate, setShowGenerate] = useState(false);
  const [tripsPage, setTripsPage] = useState(1);

  const { data: schedule, isLoading } = useQuery<Schedule>({
    queryKey: ["schedules", id],
    queryFn: async () => {
      const { data } = await api.get("/api/admin/schedules", { params: { page_size: 100 } });
      const items = Array.isArray(data) ? data : data.items || [];
      const found = items.find((s: Schedule) => s.id === id);
      if (!found) throw new Error("Schedule not found");
      return found;
    },
  });

  const { data: tripsData } = useQuery<PaginatedResponse<Trip>>({
    queryKey: ["schedule-trips", id, tripsPage],
    queryFn: async () => {
      if (!schedule?.route_id) return { items: [], total: 0, page: 1, page_size: 10 };
      const { data } = await api.get("/api/admin/schedules/trips", {
        params: { route_id: schedule.route_id, page: tripsPage, page_size: 10 },
      });
      return data;
    },
    enabled: !!schedule,
  });

  const updateMutation = useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: async (updates: Record<string, any>) => {
      // Convert empty strings to null for optional numeric fields
      const payload = { ...updates };
      if (payload.price_override === "" || payload.price_override === undefined) {
        payload.price_override = null;
      } else if (payload.price_override != null) {
        payload.price_override = Number(payload.price_override);
      }
      const { data } = await api.put(`/api/admin/schedules/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      setIsEditing(false);
      toast("success", "Schedule updated");
    },
    onError: () => toast("error", "Failed to update schedule"),
  });

  const generateMutation = useMutation({
    mutationFn: async (payload: { schedule_id: string; from_date: string; to_date: string }) => {
      const { data } = await api.post("/api/admin/schedules/trips/generate", payload);
      return data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["schedule-trips"] });
      setShowGenerate(false);
      toast("success", `Generated ${result.trips_created} trips (${result.trips_skipped} skipped)`);
    },
    onError: () => toast("error", "Failed to generate trips"),
  });

  if (isLoading) return <LoadingSpinner />;
  if (!schedule) return <div className="p-8 text-center text-gray-500">Schedule not found</div>;

  const startEditing = () => {
    setForm({
      departure_time: schedule.departure_time,
      recurrence: schedule.recurrence || "daily",
      valid_from: schedule.valid_from || "",
      valid_until: schedule.valid_until || "",
      price_override: schedule.price_override || "",
      is_active: schedule.is_active,
    });
    setIsEditing(true);
  };

  const trips = tripsData?.items || [];
  const totalTripPages = tripsData ? Math.ceil(tripsData.total / 10) : 0;

  return (
    <>
      <Breadcrumb items={[{ label: "Schedules", href: "/schedules" }, { label: schedule.route?.name || "Schedule" }]} />
      <Header
        title={schedule.route?.name || "Schedule"}
        subtitle={`${schedule.vehicle_type?.name || "—"} at ${formatTime(schedule.departure_time)}`}
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setShowGenerate(!showGenerate)}>
              <Zap className="h-4 w-4 mr-2" /> Generate Trips
            </Button>
            {!isEditing ? (
              <Button onClick={startEditing}>Edit Schedule</Button>
            ) : (
              <>
                <Button variant="secondary" onClick={() => setIsEditing(false)}>Cancel</Button>
                <Button onClick={() => updateMutation.mutate(form)} loading={updateMutation.isPending}>Save</Button>
              </>
            )}
          </div>
        }
      />

      {/* Generate Trips Panel */}
      {showGenerate && (
        <Card className="mb-6">
          <CardBody>
            <div className="flex items-end gap-4">
              <Input label="From Date" type="date" value={genFrom} onChange={(e) => setGenFrom(e.target.value)} />
              <Input label="To Date" type="date" value={genTo} onChange={(e) => setGenTo(e.target.value)} />
              <Button onClick={() => generateMutation.mutate({ schedule_id: id, from_date: genFrom, to_date: genTo })} loading={generateMutation.isPending} disabled={!genFrom || !genTo}>
                Generate
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Schedule Info */}
          <Card>
            <CardHeader>Schedule Details</CardHeader>
            <CardBody>
              {isEditing ? (
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Departure Time" type="time" value={form.departure_time || ""} onChange={(e) => setForm({ ...form, departure_time: e.target.value })} />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Recurrence</label>
                    <div className="flex flex-wrap gap-2">
                      {["mon","tue","wed","thu","fri","sat","sun"].map((day) => {
                        const days = (form.recurrence || "daily").toLowerCase().split(",").map((d: string) => d.trim());
                        const isDaily = days.includes("daily");
                        const checked = isDaily || days.includes(day);
                        return (
                          <label key={day} className="flex items-center gap-1.5 text-sm cursor-pointer">
                            <input type="checkbox" checked={checked} className="rounded border-gray-300"
                              onChange={(e) => {
                                let current = (form.recurrence || "").toLowerCase().split(",").map((d: string) => d.trim()).filter((d: string) => d && d !== "daily");
                                if (e.target.checked) { current.push(day); } else { current = current.filter((d: string) => d !== day); }
                                setForm({ ...form, recurrence: current.length === 7 ? "daily" : current.join(",") });
                              }}
                            />
                            <span className="capitalize">{day}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  <Input label="Valid From" type="date" value={form.valid_from || ""} onChange={(e) => setForm({ ...form, valid_from: e.target.value })} />
                  <Input label="Valid Until" type="date" value={form.valid_until || ""} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} />
                  <Input label="Price Override" type="number" value={form.price_override?.toString() || ""} onChange={(e) => setForm({ ...form, price_override: parseFloat(e.target.value) || null })} />
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="is_active" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="rounded border-gray-300" />
                    <label htmlFor="is_active" className="text-sm">Active</label>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                  <div><span className="text-gray-500">Route</span><p className="font-medium mt-0.5">{schedule.route?.name || schedule.route_id}</p></div>
                  <div><span className="text-gray-500">Vehicle Type</span><p className="font-medium mt-0.5">{schedule.vehicle_type?.name || schedule.vehicle_type_id}</p></div>
                  <div><span className="text-gray-500">Departure Time</span><p className="font-medium mt-0.5">{formatTime(schedule.departure_time)}</p></div>
                  <div><span className="text-gray-500">Recurrence</span><p className="font-medium mt-0.5">{schedule.recurrence || "daily"}</p></div>
                  <div><span className="text-gray-500">Valid From</span><p className="font-medium mt-0.5">{schedule.valid_from || "—"}</p></div>
                  <div><span className="text-gray-500">Valid Until</span><p className="font-medium mt-0.5">{schedule.valid_until || "—"}</p></div>
                  <div><span className="text-gray-500">Price Override</span><p className="font-medium mt-0.5">{schedule.price_override ? formatCurrency(schedule.price_override) : "Base price"}</p></div>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Trips Generated */}
          <Card>
            <CardHeader>Generated Trips ({tripsData?.total || 0})</CardHeader>
            <CardBody>
              {trips.length === 0 ? (
                <p className="text-sm text-gray-500 py-4 text-center">No trips generated yet</p>
              ) : (
                <>
                  <Table>
                    <Thead>
                      <tr><Th>Date</Th><Th>Time</Th><Th>Price</Th><Th>Seats</Th><Th>Status</Th></tr>
                    </Thead>
                    <Tbody>
                      {trips.map((t) => (
                        <Tr key={t.id} className="cursor-pointer hover:bg-gray-50" onClick={() => router.push(`/trips/${t.id}`)}>
                          <Td>{t.departure_date}</Td>
                          <Td>{formatTime(t.departure_time)}</Td>
                          <Td>{formatCurrency(t.price)}</Td>
                          <Td>{t.available_seats}/{t.total_seats}</Td>
                          <Td><Badge status={t.status} /></Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                  <Pagination page={tripsPage} totalPages={totalTripPages} onPageChange={setTripsPage} />
                </>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Sidebar */}
        <div>
          <Card>
            <CardBody>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Status</span>
                  <Badge status={schedule.is_active ? "active" : "retired"} />
                </div>
                <div className="text-sm">
                  <span className="text-gray-500">Vehicle Type</span>
                  <p className="font-medium mt-0.5">{schedule.vehicle_type?.name || "—"}</p>
                </div>
                <div className="text-sm">
                  <span className="text-gray-500">Departure</span>
                  <p className="font-medium mt-0.5">{formatTime(schedule.departure_time)}</p>
                </div>
                <div className="text-sm">
                  <span className="text-gray-500">Price</span>
                  <p className="font-medium mt-0.5">{schedule.price_override ? formatCurrency(schedule.price_override) : "Base"}</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
