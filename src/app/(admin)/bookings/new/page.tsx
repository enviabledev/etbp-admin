"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Breadcrumb from "@/components/ui/Breadcrumb";
import Card, { CardBody, CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";
import { Search, User, Ticket, Check } from "lucide-react";
import api from "@/lib/api";

type Step = "customer" | "trip" | "seats" | "confirm";

interface CustomerInfo {
  id?: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  is_new: boolean;
  has_logged_in?: boolean;
}

interface TripInfo {
  id: string;
  route_name: string;
  departure_date: string;
  departure_time: string;
  price: number;
  available_seats: number;
}

interface SeatInfo {
  id: string;
  seat_number: string;
  seat_row: number;
  seat_column: number;
  status: string;
  price_modifier: number;
}

export default function NewBookingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("customer");

  // Customer state
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [customer, setCustomer] = useState<CustomerInfo | null>(null);
  const [custForm, setCustForm] = useState({ first_name: "", last_name: "", email: "", phone: "" });

  // Trip state
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");
  const [trips, setTrips] = useState<TripInfo[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<TripInfo | null>(null);
  const [searchingTrips, setSearchingTrips] = useState(false);

  // Seats state
  const [seats, setSeats] = useState<SeatInfo[]>([]);
  const [selectedSeatIds, setSelectedSeatIds] = useState<Set<string>>(new Set());

  // Confirm state
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [submitting, setSubmitting] = useState(false);
  const [bookingRef, setBookingRef] = useState("");

  // Customer search
  async function searchCustomer() {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const { data } = await api.get("/api/admin/bookings/customer-search", { params: { q: searchQuery.trim() } });
      if (data.found) {
        setCustomer({ ...data.user, is_new: false });
      } else {
        setCustomer(null);
        setCustForm({ ...custForm, phone: searchQuery.trim() });
      }
    } catch {
      toast("error", "Search failed");
    } finally {
      setSearching(false);
    }
  }

  function confirmCustomer(isNew: boolean) {
    if (isNew) {
      setCustomer({
        first_name: custForm.first_name,
        last_name: custForm.last_name,
        phone: custForm.phone,
        email: custForm.email,
        is_new: true,
      });
    }
    setStep("trip");
  }

  // Trip search
  async function searchTrips() {
    if (!origin || !destination || !date) return;
    setSearchingTrips(true);
    try {
      const { data } = await api.get("/api/v1/routes/search", {
        params: { origin, destination, date, passengers: 1 },
      });
      const results = Array.isArray(data) ? data : data.results || [];
      setTrips(results.map((t: Record<string, unknown>) => ({
        id: t.id as string,
        route_name: (t.route as Record<string, unknown>)?.name as string || "",
        departure_date: t.departure_date as string,
        departure_time: t.departure_time as string,
        price: t.price as number,
        available_seats: t.available_seats as number,
      })));
    } catch {
      toast("error", "Trip search failed");
    } finally {
      setSearchingTrips(false);
    }
  }

  async function selectTrip(trip: TripInfo) {
    setSelectedTrip(trip);
    try {
      const { data } = await api.get(`/api/v1/trips/${trip.id}/seats`);
      setSeats((data.seats || []) as SeatInfo[]);
      setSelectedSeatIds(new Set());
      setStep("seats");
    } catch {
      toast("error", "Failed to load seats");
    }
  }

  function toggleSeat(id: string) {
    setSelectedSeatIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  // Submit booking
  async function submitBooking() {
    if (!customer || !selectedTrip || selectedSeatIds.size === 0) return;
    setSubmitting(true);

    const selectedSeatObjects = seats.filter(s => selectedSeatIds.has(s.id));

    try {
      const { data } = await api.post("/api/admin/bookings/create-for-customer", {
        customer_phone: customer.phone,
        customer_email: customer.email || undefined,
        customer_first_name: customer.first_name,
        customer_last_name: customer.last_name,
        trip_id: selectedTrip.id,
        passengers: selectedSeatObjects.map((s, i) => ({
          seat_id: s.id,
          first_name: i === 0 ? customer.first_name : customer.first_name,
          last_name: i === 0 ? customer.last_name : customer.last_name,
          is_primary: i === 0,
        })),
        contact_phone: customer.phone,
        contact_email: customer.email || undefined,
        payment_method: paymentMethod,
      });
      setBookingRef(data.booking.reference);
      setStep("confirm");
      toast("success", `Booking ${data.booking.reference} created`);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      toast("error", e?.response?.data?.detail || "Failed to create booking");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Breadcrumb items={[{ label: "Bookings", href: "/bookings" }, { label: "New Booking" }]} />
      <Header title="Book for Customer" subtitle={`Step: ${step}`} />

      {/* Step: Customer */}
      {step === "customer" && (
        <div className="max-w-2xl space-y-6">
          <Card>
            <CardHeader>Find Customer</CardHeader>
            <CardBody>
              <div className="flex gap-3">
                <Input label="Phone or Email" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="+2348012345678" />
                <Button onClick={searchCustomer} loading={searching} className="mt-6"><Search className="h-4 w-4 mr-1" /> Search</Button>
              </div>

              {customer && !customer.is_new && (
                <div className="mt-4 p-4 border rounded-lg bg-green-50">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-green-600" />
                    <span className="font-semibold">{customer.first_name} {customer.last_name}</span>
                    {!customer.has_logged_in && <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700">Terminal only</span>}
                  </div>
                  <p className="text-sm text-gray-600">{customer.phone} • {customer.email || "No email"}</p>
                  <Button size="sm" className="mt-3" onClick={() => confirmCustomer(false)}>Book for this customer</Button>
                </div>
              )}

              {customer === null && searchQuery && !searching && (
                <div className="mt-4 p-4 border rounded-lg">
                  <p className="text-sm text-gray-600 mb-3">No customer found. Create a new one:</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="First Name" value={custForm.first_name} onChange={e => setCustForm({ ...custForm, first_name: e.target.value })} />
                    <Input label="Last Name" value={custForm.last_name} onChange={e => setCustForm({ ...custForm, last_name: e.target.value })} />
                    <Input label="Phone" value={custForm.phone} onChange={e => setCustForm({ ...custForm, phone: e.target.value })} />
                    <Input label="Email (optional)" value={custForm.email} onChange={e => setCustForm({ ...custForm, email: e.target.value })} />
                  </div>
                  <Button size="sm" className="mt-3" onClick={() => confirmCustomer(true)}
                    disabled={!custForm.first_name || !custForm.last_name || !custForm.phone}>
                    Create & Continue
                  </Button>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {/* Step: Trip */}
      {step === "trip" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>Search Trips</CardHeader>
            <CardBody>
              <div className="grid grid-cols-4 gap-3">
                <Input label="Origin" value={origin} onChange={e => setOrigin(e.target.value)} placeholder="Lagos" />
                <Input label="Destination" value={destination} onChange={e => setDestination(e.target.value)} placeholder="Abuja" />
                <Input label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} />
                <div className="mt-6"><Button onClick={searchTrips} loading={searchingTrips}>Search</Button></div>
              </div>
            </CardBody>
          </Card>

          {trips.length > 0 && (
            <Card>
              <CardBody>
                <div className="space-y-3">
                  {trips.map(t => (
                    <div key={t.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer" onClick={() => selectTrip(t)}>
                      <div>
                        <p className="font-medium">{t.route_name}</p>
                        <p className="text-sm text-gray-500">{formatDate(t.departure_date)} at {formatTime(t.departure_time)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(t.price)}</p>
                        <p className="text-xs text-gray-500">{t.available_seats} seats</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}

          <Button variant="secondary" onClick={() => setStep("customer")}>Back</Button>
        </div>
      )}

      {/* Step: Seats */}
      {step === "seats" && selectedTrip && (
        <div className="space-y-6">
          <Card>
            <CardHeader>{selectedTrip.route_name} — Select Seats</CardHeader>
            <CardBody>
              <div className="flex flex-wrap gap-2 justify-center">
                {seats.filter(s => s.status === "available").map(s => {
                  const selected = selectedSeatIds.has(s.id);
                  return (
                    <button key={s.id} onClick={() => toggleSeat(s.id)}
                      className={`w-12 h-12 rounded-lg border-2 font-bold text-sm ${selected ? "bg-primary-500 text-white border-primary-600" : "bg-gray-100 border-gray-300 hover:border-primary-400"}`}>
                      {s.seat_number}
                    </button>
                  );
                })}
              </div>
              <p className="text-center text-sm text-gray-500 mt-4">
                {selectedSeatIds.size} seat{selectedSeatIds.size !== 1 ? "s" : ""} selected •{" "}
                {formatCurrency(selectedSeatIds.size * selectedTrip.price)}
              </p>
            </CardBody>
          </Card>

          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setStep("trip")}>Back</Button>
            <Button disabled={selectedSeatIds.size === 0} onClick={() => setStep("confirm")}>
              Continue to Review
            </Button>
          </div>
        </div>
      )}

      {/* Step: Confirm */}
      {step === "confirm" && !bookingRef && customer && selectedTrip && (
        <div className="max-w-2xl space-y-6">
          <Card>
            <CardHeader>Review Booking</CardHeader>
            <CardBody className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-500">Customer</span><p className="font-medium">{customer.first_name} {customer.last_name}</p></div>
                <div><span className="text-gray-500">Phone</span><p className="font-medium">{customer.phone}</p></div>
                <div><span className="text-gray-500">Trip</span><p className="font-medium">{selectedTrip.route_name}</p></div>
                <div><span className="text-gray-500">Date</span><p className="font-medium">{formatDate(selectedTrip.departure_date)} at {formatTime(selectedTrip.departure_time)}</p></div>
                <div><span className="text-gray-500">Seats</span><p className="font-medium">{selectedSeatIds.size} seat{selectedSeatIds.size !== 1 ? "s" : ""}</p></div>
                <div><span className="text-gray-500">Total</span><p className="font-bold text-lg">{formatCurrency(selectedSeatIds.size * selectedTrip.price)}</p></div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Select label="Payment Method" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} options={[
                { value: "cash", label: "Cash (collected at terminal)" },
                { value: "card", label: "Card (Paystack)" },
              ]} />
            </CardBody>
          </Card>

          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setStep("seats")}>Back</Button>
            <Button onClick={submitBooking} loading={submitting}>
              <Ticket className="h-4 w-4 mr-2" /> Confirm Booking
            </Button>
          </div>
        </div>
      )}

      {/* Step: Success */}
      {bookingRef && (
        <div className="max-w-md mx-auto text-center py-12">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold mb-2">Booking Created</h2>
          <p className="text-3xl font-bold font-mono tracking-wider mb-6">{bookingRef}</p>
          <div className="flex gap-3 justify-center">
            <Button variant="secondary" onClick={() => router.push(`/bookings/${bookingRef}`)}>View Booking</Button>
            <Button onClick={() => router.push("/bookings/new")}>New Booking</Button>
          </div>
        </div>
      )}
    </>
  );
}
