"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Breadcrumb from "@/components/ui/Breadcrumb";
import Header from "@/components/layout/Header";
import Card, { CardBody, CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Table, Thead, Tbody, Th, Tr, Td } from "@/components/ui/Table";
import { cn, formatCurrency, formatDate, formatTime } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
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
  bookings: { id: string; reference: string; status: string; passenger_count: number; contact_phone: string | null; passengers?: { first_name: string; last_name: string; seat_id: string; checked_in: boolean }[] }[];
}

const seatColors: Record<string, string> = {
  available: "bg-green-100 text-green-800 border-green-300",
  booked: "bg-primary-100 text-primary-800 border-primary-300",
  locked: "bg-amber-100 text-amber-800 border-amber-300",
};

export default function TripDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: trip, isLoading } = useQuery<TripDetail>({
    queryKey: ["admin-trip-detail", id],
    queryFn: async () => {
      const { data } = await api.get(`/api/admin/schedules/trips/${id}`);
      return data;
    },
    enabled: !!id,
  });

  if (isLoading || !trip) return <LoadingSpinner text="Loading trip..." />;

  // Build seat grid
  const maxRow = Math.max(...trip.seats.map((s) => s.seat_row || 0), 0);
  const maxCol = Math.max(...trip.seats.map((s) => s.seat_column || 0), 0);
  const seatMap = new Map(trip.seats.map((s) => [`${s.seat_row}-${s.seat_column}`, s]));

  // Build passenger manifest from bookings
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
  passengers.sort((a, b) => a.seat.localeCompare(b.seat));

  return (
    <>
      <Breadcrumb items={[{ label: "Trips", href: "/trips" }, { label: `${trip.route?.name || "Trip"} — ${formatDate(trip.departure_date)}` }]} />
      <Header title={`${trip.route?.name || "Trip Detail"}`} subtitle={`${formatDate(trip.departure_date)} at ${formatTime(trip.departure_time)}`}
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
                        <div key={seat.id} title={`${seat.seat_number} — ${seat.status}`}
                          className={cn("w-12 h-12 rounded-lg border-2 flex items-center justify-center text-xs font-bold transition-colors", seatColors[seat.status] || "bg-gray-100 text-gray-400 border-gray-200")}>
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
              <div className="flex justify-between"><span className="text-sm text-gray-500">Status</span><Badge status={trip.status} /></div>
              <div className="flex justify-between"><span className="text-sm text-gray-500">Price</span><span className="font-medium">{formatCurrency(trip.price)}</span></div>
              <div className="flex justify-between"><span className="text-sm text-gray-500">Seats</span><span>{trip.available_seats}/{trip.total_seats}</span></div>
              <div className="flex justify-between"><span className="text-sm text-gray-500">Route</span><span className="text-sm">{trip.route?.name || "—"}</span></div>
            </CardBody>
          </Card>
          <Card>
            <CardHeader><h3 className="font-semibold">Assignment</h3></CardHeader>
            <CardBody className="space-y-3">
              <div className="flex justify-between"><span className="text-sm text-gray-500">Vehicle</span><span className="text-sm font-mono">{trip.vehicle?.plate_number || "Unassigned"}</span></div>
              <div className="flex justify-between"><span className="text-sm text-gray-500">Driver</span><span className="text-sm">{trip.driver ? `${trip.driver.user?.first_name} ${trip.driver.user?.last_name}` : "Unassigned"}</span></div>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
