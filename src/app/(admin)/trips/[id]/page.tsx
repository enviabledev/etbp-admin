"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Breadcrumb from "@/components/ui/Breadcrumb";
import Header from "@/components/layout/Header";
import Card, { CardBody, CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Table, Thead, Tbody, Th, Tr, Td } from "@/components/ui/Table";
import { useToast } from "@/components/ui/Toast";
import { useVehicles } from "@/hooks/queries/useVehicles";
import { useDrivers } from "@/hooks/queries/useDrivers";
import { cn, formatCurrency, formatDate, formatTime } from "@/lib/utils";
import { ArrowLeft, Truck } from "lucide-react";
import api from "@/lib/api";

interface Seat {
  id: string;
  seat_number: string;
  seat_row: number | null;
  seat_column: number | null;
  seat_type: string | null;
  status: string;
  price_modifier: number;
}

interface TripDetail {
  id: string;
  route: { name: string; code: string } | null;
  vehicle: { plate_number: string; vehicle_type?: { name: string } } | null;
  driver: { user?: { first_name: string; last_name: string }; license_number: string } | null;
  departure_date: string;
  departure_time: string;
  status: string;
  price: number;
  available_seats: number;
  total_seats: number;
  seats: Seat[];
  bookings: { id: string; reference: string; status: string; passenger_count: number; passengers?: { first_name: string; last_name: string; seat_id: string; checked_in: boolean }[] }[];
}

const seatColors: Record<string, string> = {
  available: "bg-green-100 text-green-800 border-green-300",
  booked: "bg-primary-100 text-primary-800 border-primary-300",
  locked: "bg-amber-100 text-amber-800 border-amber-300",
};

export default function TripDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [showAssign, setShowAssign] = useState(false);
  const [vehicleId, setVehicleId] = useState("");
  const [driverId, setDriverId] = useState("");
  const [assigning, setAssigning] = useState(false);

  const { data: trip, isLoading } = useQuery<TripDetail>({
    queryKey: ["admin-trip-detail", id],
    queryFn: async () => {
      const { data } = await api.get(`/api/admin/schedules/trips/${id}`);
      return data;
    },
    enabled: !!id,
  });

  const { data: vehiclesData } = useVehicles({ status: "active", page_size: 100 });
  const { data: driversData } = useDrivers({ is_available: true, page_size: 100 });

  if (isLoading || !trip) return <LoadingSpinner text="Loading trip..." />;

  const isAssigned = !!(trip.vehicle || trip.driver);

  const handleAssign = async () => {
    if (!vehicleId && !driverId) {
      toast("error", "Select a vehicle or driver");
      return;
    }
    setAssigning(true);
    try {
      const payload: Record<string, string> = {};
      if (vehicleId) payload.vehicle_id = vehicleId;
      if (driverId) payload.driver_id = driverId;
      await api.put(`/api/admin/schedules/trips/${id}/assign`, payload);
      toast("success", "Vehicle and driver assigned");
      setShowAssign(false);
      qc.invalidateQueries({ queryKey: ["admin-trip-detail", id] });
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string }; status?: number } };
      const detail = axiosErr?.response?.data?.detail || "Failed to assign";
      toast("error", detail);
    } finally {
      setAssigning(false);
    }
  };

  const openAssignModal = () => {
    setVehicleId("");
    setDriverId("");
    setShowAssign(true);
  };

  // Build seat grid
  const maxRow = Math.max(...trip.seats.map((s) => s.seat_row || 0), 0);
  const maxCol = Math.max(...trip.seats.map((s) => s.seat_column || 0), 0);
  const seatMap = new Map(trip.seats.map((s) => [`${s.seat_row}-${s.seat_column}`, s]));

  // Build passenger manifest
  const passengers: { name: string; reference: string; seat: string; checked_in: boolean }[] = [];
  for (const booking of trip.bookings || []) {
    if (booking.status === "cancelled" || booking.status === "expired") continue;
    for (const p of booking.passengers || []) {
      const seat = trip.seats.find((s) => s.id === p.seat_id);
      passengers.push({
        name: `${p.first_name} ${p.last_name}`,
        reference: booking.reference,
        seat: seat?.seat_number || "—",
        checked_in: p.checked_in,
      });
    }
  }
  passengers.sort((a, b) => (parseInt(a.seat) || 0) - (parseInt(b.seat) || 0));

  return (
    <>
      <Breadcrumb items={[{ label: "Trips", href: "/trips" }, { label: `${trip.route?.name || "Trip"} — ${formatDate(trip.departure_date)}` }]} />
      <Header title={trip.route?.name || "Trip Detail"} subtitle={`${formatDate(trip.departure_date)} at ${formatTime(trip.departure_time)}`}
        actions={<Button variant="ghost" onClick={() => router.push("/trips")}><ArrowLeft className="h-4 w-4 mr-2" /> Back</Button>} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Seat Map */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Seat Map</h3>
                <div className="flex gap-4 text-xs">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-200 border border-green-400" /> Available</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-primary-200 border border-primary-400" /> Booked</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-200 border border-amber-400" /> Locked</span>
                </div>
              </div>
            </CardHeader>
            <CardBody>
              <div className="flex justify-center">
                <div className="inline-grid gap-2" style={{ gridTemplateColumns: `repeat(${maxCol}, 1fr)` }}>
                  {Array.from({ length: maxRow }, (_, r) =>
                    Array.from({ length: maxCol }, (_, c) => {
                      const seat = seatMap.get(`${r + 1}-${c + 1}`);
                      if (!seat) return <div key={`${r}-${c}`} className="w-12 h-12" />;
                      return (
                        <div key={seat.id} title={`Seat ${seat.seat_number} — ${seat.status}`}
                          className={cn("w-12 h-12 rounded-lg border-2 flex items-center justify-center text-sm font-bold", seatColors[seat.status] || "bg-gray-100 text-gray-400 border-gray-200")}>
                          {seat.seat_number}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
              <p className="text-center text-xs text-gray-500 mt-4">{trip.available_seats} of {trip.total_seats} seats available</p>
            </CardBody>
          </Card>

          {/* Passenger Manifest */}
          <Card>
            <CardHeader><h3 className="font-semibold">Passenger Manifest ({passengers.length})</h3></CardHeader>
            {passengers.length > 0 ? (
              <Table>
                <Thead><tr><Th>Seat</Th><Th>Passenger</Th><Th>Booking</Th><Th>Checked In</Th></tr></Thead>
                <Tbody>
                  {passengers.map((p, i) => (
                    <Tr key={i}>
                      <Td className="font-mono font-bold">{p.seat}</Td>
                      <Td className="font-medium">{p.name}</Td>
                      <Td><span className="font-mono text-xs text-primary-600">{p.reference}</span></Td>
                      <Td>{p.checked_in ? <Badge status="checked_in" /> : <Badge status="pending" />}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            ) : (
              <CardBody><p className="text-sm text-gray-500 text-center py-6">No passengers booked yet</p></CardBody>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader><h3 className="font-semibold">Trip Info</h3></CardHeader>
            <CardBody className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Status</span>
                {["completed", "cancelled"].includes(trip.status) ? (
                  <span className={`text-sm font-medium px-2 py-1 rounded ${trip.status === "completed" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {trip.status.replace(/_/g, " ")}
                  </span>
                ) : (
                  <select value={trip.status} className="text-sm border rounded px-2 py-1"
                    onChange={async (e) => {
                      try {
                        await api.put(`/api/admin/schedules/trips/${id}`, { status: e.target.value });
                        qc.invalidateQueries({ queryKey: ["admin-trip-detail", id] });
                        toast("success", "Status updated");
                      } catch { toast("error", "Failed to update status"); }
                    }}>
                    {["scheduled","boarding","departed","en_route","arrived","completed","cancelled"].map(s => (
                      <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                    ))}
                  </select>
                )}
              </div>
              <div className="flex justify-between"><span className="text-sm text-gray-500">Price</span><span className="font-medium">{formatCurrency(trip.price)}</span></div>
              <div className="flex justify-between"><span className="text-sm text-gray-500">Seats</span><span>{trip.available_seats}/{trip.total_seats}</span></div>
              <div className="flex justify-between"><span className="text-sm text-gray-500">Route</span><span className="text-sm">{trip.route?.name || "—"}</span></div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Assignment</h3>
                <Button size="sm" variant={isAssigned ? "secondary" : "primary"} onClick={openAssignModal}>
                  <Truck className="h-3 w-3 mr-1" /> {isAssigned ? "Reassign" : "Assign"}
                </Button>
              </div>
            </CardHeader>
            <CardBody className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Vehicle</span>
                {trip.vehicle ? (
                  <span className="text-sm font-mono font-medium text-gray-900">{trip.vehicle.plate_number}</span>
                ) : (
                  <span className="text-sm text-gray-400 italic">Unassigned</span>
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Driver</span>
                {trip.driver ? (
                  <span className="text-sm font-medium text-gray-900">{trip.driver.user?.first_name} {trip.driver.user?.last_name}</span>
                ) : (
                  <span className="text-sm text-gray-400 italic">Unassigned</span>
                )}
              </div>
              {trip.vehicle?.vehicle_type && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Type</span>
                  <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{trip.vehicle.vehicle_type.name}</span>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Assign Modal */}
      <Modal isOpen={showAssign} onClose={() => setShowAssign(false)} title="Assign Vehicle & Driver" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {trip.route?.name} — {formatDate(trip.departure_date)} at {formatTime(trip.departure_time)}
          </p>

          <Select
            label="Vehicle"
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
            placeholder="Select vehicle..."
            options={(vehiclesData?.items || []).map((v) => ({
              value: v.id,
              label: `${v.plate_number} — ${v.vehicle_type?.name || ""}`,
            }))}
          />

          <Select
            label="Driver"
            value={driverId}
            onChange={(e) => setDriverId(e.target.value)}
            placeholder="Select driver..."
            options={(driversData?.items || []).map((d) => ({
              value: d.id,
              label: `${d.user?.first_name || ""} ${d.user?.last_name || ""} — ${d.license_number}`,
            }))}
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowAssign(false)}>Cancel</Button>
            <Button onClick={handleAssign} loading={assigning} disabled={!vehicleId && !driverId}>
              Assign
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
