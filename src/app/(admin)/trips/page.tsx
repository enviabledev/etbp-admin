"use client";

import { useState } from "react";
import Header from "@/components/layout/Header";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Pagination from "@/components/ui/Pagination";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";
import { Table, Thead, Tbody, Th, Tr, Td } from "@/components/ui/Table";
import { useTrips, useAssignTrip } from "@/hooks/queries/useTrips";
import { useVehicles } from "@/hooks/queries/useVehicles";
import { useDrivers } from "@/hooks/queries/useDrivers";
import { useToast } from "@/components/ui/Toast";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";
import { Truck } from "lucide-react";
import type { Trip } from "@/types";

export default function TripsPage() {
  const [page, setPage] = useState(1);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [assigning, setAssigning] = useState<Trip | null>(null);
  const [vehicleId, setVehicleId] = useState("");
  const [driverId, setDriverId] = useState("");
  const { toast } = useToast();

  const { data, isLoading } = useTrips({
    from_date: fromDate || undefined,
    to_date: toDate || undefined,
    status: statusFilter || undefined,
    page,
    page_size: 20,
  });
  const { data: vehiclesData } = useVehicles({ status: "active", page_size: 100 });
  const { data: driversData } = useDrivers({ is_available: true, page_size: 100 });
  const assignMutation = useAssignTrip();

  const trips = data?.items || [];
  const totalPages = data ? Math.ceil(data.total / 20) : 0;

  const handleAssign = () => {
    if (!assigning) return;
    assignMutation.mutate(
      { tripId: assigning.id, vehicle_id: vehicleId || undefined, driver_id: driverId || undefined },
      {
        onSuccess: () => { setAssigning(null); toast("success", "Trip assigned"); },
        onError: () => toast("error", "Failed to assign"),
      }
    );
  };

  return (
    <>
      <Header title="Trips" subtitle={`${data?.total || 0} trips`} />

      <Card className="mb-6">
        <div className="p-4 flex flex-wrap gap-4">
          <Input type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPage(1); }} placeholder="From" className="w-40" />
          <Input type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); setPage(1); }} placeholder="To" className="w-40" />
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white">
            <option value="">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="boarding">Boarding</option>
            <option value="departed">Departed</option>
            <option value="arrived">Arrived</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </Card>

      <Card>
        {isLoading ? <LoadingSpinner /> : (
          <>
            <Table>
              <Thead>
                <tr><Th>Route</Th><Th>Date</Th><Th>Departure</Th><Th>Price</Th><Th>Seats</Th><Th>Vehicle</Th><Th>Status</Th><Th>Actions</Th></tr>
              </Thead>
              <Tbody>
                {trips.length === 0 ? (
                  <Tr><Td colSpan={8} className="text-center py-8 text-gray-500">No trips found</Td></Tr>
                ) : trips.map((t) => (
                  <Tr key={t.id}>
                    <Td className="font-medium">{t.route?.name || "—"}</Td>
                    <Td>{formatDate(t.departure_date)}</Td>
                    <Td>{formatTime(t.departure_time)}</Td>
                    <Td>{formatCurrency(t.price)}</Td>
                    <Td>
                      <span className={t.available_seats === 0 ? "text-red-600 font-medium" : ""}>
                        {t.available_seats}/{t.total_seats}
                      </span>
                    </Td>
                    <Td className="text-xs">{t.vehicle?.plate_number || <span className="text-gray-400">Unassigned</span>}</Td>
                    <Td><Badge status={t.status} /></Td>
                    <Td>
                      <Button size="sm" variant="ghost" onClick={() => { setAssigning(t); setVehicleId(""); setDriverId(""); }}>
                        <Truck className="h-3 w-3 mr-1" /> Assign
                      </Button>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </Card>

      <Modal isOpen={!!assigning} onClose={() => setAssigning(null)} title="Assign Vehicle & Driver" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {assigning?.route?.name} — {assigning ? formatDate(assigning.departure_date) : ""} at {assigning ? formatTime(assigning.departure_time) : ""}
          </p>
          <Select label="Vehicle" value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}
            placeholder="Select vehicle..."
            options={(vehiclesData?.items || []).map((v) => ({ value: v.id, label: `${v.plate_number} — ${v.vehicle_type?.name || ""}` }))}
          />
          <Select label="Driver" value={driverId} onChange={(e) => setDriverId(e.target.value)}
            placeholder="Select driver..."
            options={(driversData?.items || []).map((d) => ({
              value: d.id, label: `${d.user?.first_name || ""} ${d.user?.last_name || ""} — ${d.license_number}`,
            }))}
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setAssigning(null)}>Cancel</Button>
            <Button onClick={handleAssign} loading={assignMutation.isPending}>Assign</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
