"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Breadcrumb from "@/components/ui/Breadcrumb";
import Header from "@/components/layout/Header";
import Card, { CardBody, CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Table, Thead, Tbody, Th, Tr, Td } from "@/components/ui/Table";
import { useVehicleTypes, useUpdateVehicle } from "@/hooks/queries/useVehicles";
import { useToast } from "@/components/ui/Toast";
import { formatDate } from "@/lib/utils";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import api from "@/lib/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface VehicleDetail {
  id: string;
  plate_number: string;
  vehicle_type_id: string;
  vehicle_type?: { id: string; name: string; seat_capacity: number };
  make: string | null;
  model: string | null;
  year: number | null;
  color: string | null;
  status: "active" | "maintenance" | "retired";
  current_mileage: number | null;
  insurance_expiry: string | null;
  registration_expiry: string | null;
  inspection_expiry: string | null;
  last_service_date: string | null;
  next_service_due: string | null;
  notes: string | null;
  trip_history?: {
    id: string;
    route_name: string;
    departure_date: string;
    driver_name: string | null;
    status: string;
  }[];
}

function daysRemaining(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function isExpired(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return new Date(dateStr).getTime() < Date.now();
}

function isExpiringSoon(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const days = daysRemaining(dateStr);
  return days !== null && days > 0 && days <= 30;
}

function getExpiryBadge(dateStr: string | null) {
  if (!dateStr) return null;
  if (isExpired(dateStr)) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs bg-red-100 text-red-800 px-1.5 py-0.5 rounded-full font-medium">
        <AlertTriangle className="h-3 w-3" /> Expired
      </span>
    );
  }
  if (isExpiringSoon(dateStr)) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full font-medium">
        <AlertTriangle className="h-3 w-3" /> Expiring soon
      </span>
    );
  }
  return (
    <span className="inline-flex items-center text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full font-medium">
      OK
    </span>
  );
}

const TABS = ["Details", "Documents", "Maintenance", "Trips"] as const;
type Tab = (typeof TABS)[number];

export default function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState<Tab>("Details");

  const { data: vehicle, isLoading } = useQuery<VehicleDetail>({
    queryKey: ["admin-vehicle-detail", id],
    queryFn: async () => {
      try {
        const { data } = await api.get(`/api/admin/vehicles/${id}/detail`);
        // Backend returns { vehicle, documents, maintenance, trip_history, notes }
        const v = data.vehicle || data;
        return {
          ...v,
          insurance_expiry: data.documents?.insurance?.expiry ?? v.insurance_expiry ?? null,
          registration_expiry: data.documents?.registration?.expiry ?? v.registration_expiry ?? null,
          inspection_expiry: data.documents?.inspection?.expiry ?? v.inspection_expiry ?? null,
          last_service_date: data.maintenance?.last_service_date ?? v.last_service_date ?? null,
          next_service_due: data.maintenance?.next_service_due ?? v.next_service_due ?? null,
          notes: data.notes ?? v.notes ?? null,
          trip_history: data.trip_history || [],
        };
      } catch {
        const { data } = await api.get(`/api/admin/vehicles/${id}`);
        return data;
      }
    },
    enabled: !!id,
  });

  const { data: vehicleTypes } = useVehicleTypes();
  const updateMutation = useUpdateVehicle();

  // Details form
  const [plateNumber, setPlateNumber] = useState("");
  const [vehicleTypeId, setVehicleTypeId] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [color, setColor] = useState("");
  const [status, setStatus] = useState("");
  const [mileage, setMileage] = useState("");
  const [notes, setNotes] = useState("");

  // Documents form
  const [insuranceExpiry, setInsuranceExpiry] = useState("");
  const [registrationExpiry, setRegistrationExpiry] = useState("");
  const [inspectionExpiry, setInspectionExpiry] = useState("");

  // Maintenance form
  const [lastServiceDate, setLastServiceDate] = useState("");
  const [nextServiceDue, setNextServiceDue] = useState("");

  useEffect(() => {
    if (vehicle) {
      setPlateNumber(vehicle.plate_number || "");
      setVehicleTypeId(vehicle.vehicle_type_id || vehicle.vehicle_type?.id || "");
      setMake(vehicle.make || "");
      setModel(vehicle.model || "");
      setYear(vehicle.year ? String(vehicle.year) : "");
      setColor(vehicle.color || "");
      setStatus(vehicle.status || "active");
      setMileage(vehicle.current_mileage ? String(vehicle.current_mileage) : "");
      setNotes(vehicle.notes || "");
      setInsuranceExpiry(vehicle.insurance_expiry || "");
      setRegistrationExpiry(vehicle.registration_expiry || "");
      setInspectionExpiry(vehicle.inspection_expiry || "");
      setLastServiceDate(vehicle.last_service_date || "");
      setNextServiceDue(vehicle.next_service_due || "");
    }
  }, [vehicle]);

  if (isLoading || !vehicle) return <LoadingSpinner text="Loading vehicle..." />;

  const handleDetailsSave = () => {
    const payload: Record<string, unknown> = {
      id,
      plate_number: plateNumber,
      vehicle_type_id: vehicleTypeId || undefined,
      make: make || null,
      model: model || null,
      year: year ? parseInt(year) : null,
      color: color || null,
      status,
      current_mileage: mileage ? parseFloat(mileage) : null,
      notes: notes || null,
    };
    updateMutation.mutate(payload as Parameters<typeof updateMutation.mutate>[0], {
      onSuccess: () => {
        toast("success", "Vehicle details updated");
        qc.invalidateQueries({ queryKey: ["admin-vehicle-detail", id] });
      },
      onError: () => toast("error", "Failed to update vehicle"),
    });
  };

  const handleDocumentsSave = () => {
    const payload: Record<string, unknown> = {
      id,
      insurance_expiry: insuranceExpiry || null,
      registration_expiry: registrationExpiry || null,
      inspection_expiry: inspectionExpiry || null,
    };
    updateMutation.mutate(payload as Parameters<typeof updateMutation.mutate>[0], {
      onSuccess: () => {
        toast("success", "Documents updated");
        qc.invalidateQueries({ queryKey: ["admin-vehicle-detail", id] });
      },
      onError: () => toast("error", "Failed to update documents"),
    });
  };

  const handleMaintenanceSave = () => {
    const payload: Record<string, unknown> = {
      id,
      last_service_date: lastServiceDate || null,
      next_service_due: nextServiceDue || null,
    };
    updateMutation.mutate(payload as Parameters<typeof updateMutation.mutate>[0], {
      onSuccess: () => {
        toast("success", "Maintenance info updated");
        qc.invalidateQueries({ queryKey: ["admin-vehicle-detail", id] });
      },
      onError: () => toast("error", "Failed to update maintenance"),
    });
  };

  const serviceStatusBadge = () => {
    if (!nextServiceDue) return null;
    if (isExpired(nextServiceDue)) return <Badge status="expired" />;
    if (isExpiringSoon(nextServiceDue)) return <Badge status="pending" />;
    return <Badge status="active" />;
  };

  return (
    <>
      <Breadcrumb items={[{ label: "Fleet", href: "/fleet" }, { label: vehicle.plate_number }]} />
      <Header
        title={vehicle.plate_number}
        subtitle={`${vehicle.vehicle_type?.name || ""} ${vehicle.make ? `- ${vehicle.make}` : ""} ${vehicle.model || ""}`}
        actions={
          <Button variant="ghost" onClick={() => router.push("/fleet")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
        }
      />

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-6">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Details Tab */}
      {activeTab === "Details" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <h3 className="font-semibold">Vehicle Details</h3>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Plate Number"
                    value={plateNumber}
                    onChange={(e) => setPlateNumber(e.target.value)}
                  />
                  <Select
                    label="Vehicle Type"
                    value={vehicleTypeId}
                    onChange={(e) => setVehicleTypeId(e.target.value)}
                    placeholder="Select type"
                    options={(vehicleTypes || []).map((t) => ({
                      value: t.id,
                      label: `${t.name} (${t.seat_capacity} seats)`,
                    }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Make" value={make} onChange={(e) => setMake(e.target.value)} />
                  <Input label="Model" value={model} onChange={(e) => setModel(e.target.value)} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Input
                    label="Year"
                    type="number"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                  />
                  <Input label="Color" value={color} onChange={(e) => setColor(e.target.value)} />
                  <Select
                    label="Status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    options={[
                      { value: "active", label: "Active" },
                      { value: "maintenance", label: "Maintenance" },
                      { value: "retired", label: "Retired" },
                    ]}
                  />
                </div>
                <Input
                  label="Current Mileage (km)"
                  type="number"
                  value={mileage}
                  onChange={(e) => setMileage(e.target.value)}
                />
                <Input
                  label="Notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional notes..."
                />
                <div className="flex justify-end pt-2">
                  <Button onClick={handleDetailsSave} loading={updateMutation.isPending}>
                    Save Details
                  </Button>
                </div>
              </CardBody>
            </Card>
          </div>

          <Card className="h-fit">
            <CardHeader>
              <h3 className="font-semibold">Summary</h3>
            </CardHeader>
            <CardBody className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Plate</span>
                <span className="font-mono font-medium">{vehicle.plate_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Type</span>
                <span className="text-sm">{vehicle.vehicle_type?.name || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Status</span>
                <Badge status={vehicle.status} />
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Capacity</span>
                <span className="text-sm">{vehicle.vehicle_type?.seat_capacity || "—"} seats</span>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Documents Tab */}
      {activeTab === "Documents" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Insurance */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Insurance</h3>
                  {getExpiryBadge(vehicle.insurance_expiry)}
                </div>
              </CardHeader>
              <CardBody className="space-y-3">
                <Input
                  label="Expiry Date"
                  type="date"
                  value={insuranceExpiry}
                  onChange={(e) => setInsuranceExpiry(e.target.value)}
                />
                {vehicle.insurance_expiry && (
                  <div className="text-sm text-gray-500">
                    {daysRemaining(vehicle.insurance_expiry) !== null && (
                      <span>
                        {isExpired(vehicle.insurance_expiry)
                          ? `Expired ${Math.abs(daysRemaining(vehicle.insurance_expiry)!)} days ago`
                          : `${daysRemaining(vehicle.insurance_expiry)} days remaining`}
                      </span>
                    )}
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Registration */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Registration</h3>
                  {getExpiryBadge(vehicle.registration_expiry)}
                </div>
              </CardHeader>
              <CardBody className="space-y-3">
                <Input
                  label="Expiry Date"
                  type="date"
                  value={registrationExpiry}
                  onChange={(e) => setRegistrationExpiry(e.target.value)}
                />
                {vehicle.registration_expiry && (
                  <div className="text-sm text-gray-500">
                    {daysRemaining(vehicle.registration_expiry) !== null && (
                      <span>
                        {isExpired(vehicle.registration_expiry)
                          ? `Expired ${Math.abs(daysRemaining(vehicle.registration_expiry)!)} days ago`
                          : `${daysRemaining(vehicle.registration_expiry)} days remaining`}
                      </span>
                    )}
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Inspection */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Inspection</h3>
                  {getExpiryBadge(vehicle.inspection_expiry)}
                </div>
              </CardHeader>
              <CardBody className="space-y-3">
                <Input
                  label="Expiry Date"
                  type="date"
                  value={inspectionExpiry}
                  onChange={(e) => setInspectionExpiry(e.target.value)}
                />
                {vehicle.inspection_expiry && (
                  <div className="text-sm text-gray-500">
                    {daysRemaining(vehicle.inspection_expiry) !== null && (
                      <span>
                        {isExpired(vehicle.inspection_expiry)
                          ? `Expired ${Math.abs(daysRemaining(vehicle.inspection_expiry)!)} days ago`
                          : `${daysRemaining(vehicle.inspection_expiry)} days remaining`}
                      </span>
                    )}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleDocumentsSave} loading={updateMutation.isPending}>
              Save Documents
            </Button>
          </div>
        </div>
      )}

      {/* Maintenance Tab */}
      {activeTab === "Maintenance" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <h3 className="font-semibold">Last Service</h3>
              </CardHeader>
              <CardBody>
                <Input
                  label="Last Service Date"
                  type="date"
                  value={lastServiceDate}
                  onChange={(e) => setLastServiceDate(e.target.value)}
                />
                {vehicle.last_service_date && (
                  <p className="text-sm text-gray-500 mt-2">
                    Serviced on {formatDate(vehicle.last_service_date)}
                  </p>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Next Service Due</h3>
                  {serviceStatusBadge()}
                </div>
              </CardHeader>
              <CardBody>
                <Input
                  label="Next Service Due"
                  type="date"
                  value={nextServiceDue}
                  onChange={(e) => setNextServiceDue(e.target.value)}
                />
                {vehicle.next_service_due && (
                  <div className="mt-2">
                    {isExpired(vehicle.next_service_due) ? (
                      <p className="flex items-center gap-1 text-sm text-red-600">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Service overdue by {Math.abs(daysRemaining(vehicle.next_service_due)!)} days
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500">
                        Due in {daysRemaining(vehicle.next_service_due)} days
                      </p>
                    )}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleMaintenanceSave} loading={updateMutation.isPending}>
              Save Maintenance
            </Button>
          </div>
        </div>
      )}

      {/* Trips Tab */}
      {activeTab === "Trips" && (
        <Card>
          <CardHeader>
            <h3 className="font-semibold">Trip History</h3>
          </CardHeader>
          {vehicle.trip_history && vehicle.trip_history.length > 0 ? (
            <Table>
              <Thead>
                <tr>
                  <Th>Route</Th>
                  <Th>Date</Th>
                  <Th>Driver</Th>
                  <Th>Status</Th>
                </tr>
              </Thead>
              <Tbody>
                {vehicle.trip_history.map((trip) => (
                  <Tr key={trip.id}>
                    <Td className="font-medium">{trip.route_name || "—"}</Td>
                    <Td className="text-sm text-gray-500">{formatDate(trip.departure_date)}</Td>
                    <Td className="text-sm text-gray-500">{trip.driver_name || "—"}</Td>
                    <Td>
                      <Badge status={trip.status} />
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          ) : (
            <CardBody>
              <p className="text-sm text-gray-500 text-center py-6">No trip history</p>
            </CardBody>
          )}
        </Card>
      )}
    </>
  );
}
