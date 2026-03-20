"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/Header";
import Card, { CardBody, CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Table, Thead, Tbody, Th, Tr, Td } from "@/components/ui/Table";
import { useCheckInBooking, useUpdateBookingStatus } from "@/hooks/queries/useBookings";
import { useToast } from "@/components/ui/Toast";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { ArrowLeft, CheckCircle, Send, Luggage } from "lucide-react";
import api from "@/lib/api";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import Modal from "@/components/ui/Modal";
import type { Booking } from "@/types";

export default function BookingDetailPage() {
  const { ref } = useParams<{ ref: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const { data: booking, isLoading } = useQuery<Booking>({
    queryKey: ["admin-booking-ref", ref],
    queryFn: async () => {
      // Search by reference via admin endpoint
      const { data } = await api.get("/api/admin/bookings", { params: { reference: ref, page_size: 1 } });
      const items = data.items || [];
      if (items.length === 0) throw new Error("Not found");
      // Fetch full detail
      const { data: detail } = await api.get(`/api/admin/bookings/${items[0].id}`);
      return detail;
    },
    enabled: !!ref,
  });

  const { data: addons } = useQuery({
    queryKey: ["booking-addons", booking?.id],
    queryFn: async () => {
      const { data } = await api.get(`/api/v1/bookings/${booking!.reference}/addons`);
      return data;
    },
    enabled: !!booking?.reference,
  });

  const checkInMutation = useCheckInBooking();
  const statusMutation = useUpdateBookingStatus();
  const qc = useQueryClient();
  const [showTransfer, setShowTransfer] = useState(false);
  const [showLuggage, setShowLuggage] = useState(false);
  const [transferName, setTransferName] = useState("");
  const [transferPhone, setTransferPhone] = useState("");
  const [transferReason, setTransferReason] = useState("");
  const [luggageQty, setLuggageQty] = useState(1);
  const [luggageMethod, setLuggageMethod] = useState("cash");

  const transferMutation = useMutation({
    mutationFn: async (data: Record<string, string>) => {
      const res = await api.post(`/api/admin/bookings/${booking?.id}/transfer`, data);
      return res.data;
    },
    onSuccess: () => { toast("success", "Booking transferred"); setShowTransfer(false); qc.invalidateQueries({ queryKey: ["admin-booking-ref", ref] }); },
    onError: () => toast("error", "Transfer failed"),
  });

  const luggageMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await api.post(`/api/admin/bookings/${booking?.id}/add-luggage`, data);
      return res.data;
    },
    onSuccess: () => { toast("success", "Luggage added"); setShowLuggage(false); qc.invalidateQueries({ queryKey: ["admin-booking-ref", ref] }); },
    onError: () => toast("error", "Failed to add luggage"),
  });

  if (isLoading || !booking) return <LoadingSpinner text="Loading booking..." />;

  return (
    <>
      <Header
        title={`Booking ${booking.reference}`}
        actions={
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => router.push("/bookings")}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            {booking.status === "confirmed" && (
              <>
                <Button variant="secondary" onClick={() => setShowTransfer(true)}>
                  <Send className="h-4 w-4 mr-2" /> Transfer
                </Button>
                <Button variant="secondary" onClick={() => setShowLuggage(true)}>
                  <Luggage className="h-4 w-4 mr-2" /> Add Luggage
                </Button>
                <Button onClick={() => checkInMutation.mutate(booking.id, {
                  onSuccess: () => toast("success", "Checked in!"),
                  onError: () => toast("error", "Check-in failed"),
                })} loading={checkInMutation.isPending}>
                  <CheckCircle className="h-4 w-4 mr-2" /> Check In
                </Button>
              </>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Passengers */}
          <Card>
            <CardHeader><h3 className="font-semibold">Passengers ({booking.passenger_count})</h3></CardHeader>
            <Table>
              <Thead>
                <tr><Th>Name</Th><Th>Gender</Th><Th>Phone</Th><Th>Primary</Th><Th>Checked In</Th></tr>
              </Thead>
              <Tbody>
                {(booking.passengers || []).map((p) => (
                  <Tr key={p.id}>
                    <Td className="font-medium">{p.first_name} {p.last_name}</Td>
                    <Td className="capitalize">{p.gender || "—"}</Td>
                    <Td>{p.phone || "—"}</Td>
                    <Td>{p.is_primary ? <Badge status="confirmed" /> : "—"}</Td>
                    <Td>{p.checked_in ? <Badge status="checked_in" /> : <Badge status="pending" />}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader><h3 className="font-semibold">Booking Details</h3></CardHeader>
            <CardBody className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Status</span>
                <select value={booking.status} className="text-sm border rounded px-2 py-1"
                  onChange={(e) => statusMutation.mutate(
                    { bookingId: booking.id, status: e.target.value },
                    {
                      onSuccess: () => { toast("success", "Status updated"); qc.invalidateQueries({ queryKey: ["admin-booking-ref", ref] }); },
                      onError: () => toast("error", "Failed to update status"),
                    }
                  )}>
                  {(({
                    pending: ["confirmed", "cancelled"],
                    confirmed: ["checked_in", "cancelled", "no_show", "completed"],
                    checked_in: ["completed"],
                    expired: ["pending", "confirmed", "cancelled"],
                    cancelled: ["pending", "confirmed"],
                    completed: [] as string[],
                    no_show: [] as string[],
                  } as Record<string, string[]>)[booking.status] || []).map(s => (
                    <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                  ))}
                </select>
              </div>
              {(booking as unknown as Record<string, string>).payment_deadline ? (
                <div className="flex justify-between"><span className="text-sm text-gray-500">Payment Deadline</span><span className="text-xs font-medium text-amber-600">{formatDateTime((booking as unknown as Record<string, string>).payment_deadline)}</span></div>
              ) : null}
              <div className="flex justify-between"><span className="text-sm text-gray-500">Amount</span><span className="font-medium">{formatCurrency(booking.total_amount)}</span></div>
              <div className="flex justify-between"><span className="text-sm text-gray-500">Currency</span><span>{booking.currency}</span></div>
              <div className="flex justify-between"><span className="text-sm text-gray-500">Passengers</span><span>{booking.passenger_count}</span></div>
              <div className="flex justify-between"><span className="text-sm text-gray-500">Created</span><span className="text-xs">{formatDateTime(booking.created_at)}</span></div>
              {booking.checked_in_at && (
                <div className="flex justify-between"><span className="text-sm text-gray-500">Checked In</span><span className="text-xs">{formatDateTime(booking.checked_in_at)}</span></div>
              )}
              {booking.cancelled_at && (
                <div className="flex justify-between"><span className="text-sm text-gray-500">Cancelled</span><span className="text-xs">{formatDateTime(booking.cancelled_at)}</span></div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader><h3 className="font-semibold">Contact</h3></CardHeader>
            <CardBody className="space-y-3">
              <div className="flex justify-between"><span className="text-sm text-gray-500">Email</span><span className="text-sm">{booking.contact_email || "—"}</span></div>
              <div className="flex justify-between"><span className="text-sm text-gray-500">Phone</span><span className="text-sm">{booking.contact_phone || "—"}</span></div>
              {booking.emergency_contact_name && (
                <>
                  <div className="border-t border-gray-100 pt-3 flex justify-between"><span className="text-sm text-gray-500">Emergency</span><span className="text-sm">{booking.emergency_contact_name}</span></div>
                  <div className="flex justify-between"><span className="text-sm text-gray-500">Emergency Phone</span><span className="text-sm">{booking.emergency_contact_phone}</span></div>
                </>
              )}
            </CardBody>
          </Card>

          {booking.cancellation_reason && (
            <Card>
              <CardHeader><h3 className="font-semibold text-red-600">Cancellation</h3></CardHeader>
              <CardBody>
                <p className="text-sm text-gray-600">{booking.cancellation_reason}</p>
              </CardBody>
            </Card>
          )}

          {addons && addons.length > 0 && (
            <Card>
              <CardHeader><h3 className="font-semibold">Add-ons</h3></CardHeader>
              <CardBody>
                {addons.map((a: Record<string, string | number>, i: number) => (
                  <div key={i} className="flex justify-between text-sm py-1">
                    <span><Luggage className="h-4 w-4 inline mr-1" />{a.quantity} Extra Bag{(a.quantity as number) > 1 ? "s" : ""}</span>
                    <span className="font-medium">{formatCurrency(a.total_price as number)} <span className={`text-xs ${a.status === "paid" ? "text-green-600" : "text-orange-600"}`}>{a.status === "paid" ? "Paid" : "Pending"}</span></span>
                  </div>
                ))}
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      <Modal isOpen={showTransfer} onClose={() => setShowTransfer(false)} title="Transfer Booking">
        <div className="space-y-4">
          <input value={transferName} onChange={e => setTransferName(e.target.value)} placeholder="Recipient full name" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          <input value={transferPhone} onChange={e => setTransferPhone(e.target.value)} placeholder="Recipient phone (+234...)" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          <textarea value={transferReason} onChange={e => setTransferReason(e.target.value)} placeholder="Reason for transfer (required)" rows={2} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowTransfer(false)}>Cancel</Button>
            <Button onClick={() => transferMutation.mutate({ recipient_name: transferName, recipient_phone: transferPhone, reason: transferReason })} loading={transferMutation.isPending}>Transfer</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showLuggage} onClose={() => setShowLuggage(false)} title="Add Extra Luggage">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Number of bags</label>
            <select value={luggageQty} onChange={e => setLuggageQty(Number(e.target.value))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
              {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} bag{n > 1 ? "s" : ""}</option>)}
            </select>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-600">Price per bag: {formatCurrency(2000)}</p>
            <p className="text-lg font-bold">{formatCurrency(2000 * luggageQty)}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment method</label>
            <select value={luggageMethod} onChange={e => setLuggageMethod(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
              <option value="cash">Cash</option>
              <option value="pos">POS</option>
              <option value="wallet">Wallet</option>
            </select>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowLuggage(false)}>Cancel</Button>
            <Button onClick={() => luggageMutation.mutate({ quantity: luggageQty, payment_method: luggageMethod })} loading={luggageMutation.isPending}>Add Luggage</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
