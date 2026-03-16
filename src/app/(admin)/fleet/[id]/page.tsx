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
import { useUpdateVehicle } from "@/hooks/queries/useVehicles";
import { useToast } from "@/components/ui/Toast";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import api from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import type { Vehicle } from "@/types";

function isExpiringSoon(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const diff = new Date(dateStr).getTime() - Date.now();
  return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000;
}

function isExpired(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return new Date(dateStr).getTime() < Date.now();
}

export default function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const { data: vehicle, isLoading } = useQuery<Vehicle>({
    queryKey: ["admin-vehicle", id],
    queryFn: async () => { const { data } = await api.get(`/api/admin/vehicles/${id}`); return data; },
    enabled: !!id,
  });
  const updateMutation = useUpdateVehicle();

  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [color, setColor] = useState("");
  const [status, setStatus] = useState("");
  const [mileage, setMileage] = useState("");
  const [insuranceExpiry, setInsuranceExpiry] = useState("");
  const [registrationExpiry, setRegistrationExpiry] = useState("");
  const [inspectionExpiry, setInspectionExpiry] = useState("");
  const [lastServiceDate, setLastServiceDate] = useState("");
  const [nextServiceDue, setNextServiceDue] = useState("");

  useEffect(() => {
    if (vehicle) {
      setMake(vehicle.make || "");
      setModel(vehicle.model || "");
      setYear(vehicle.year ? String(vehicle.year) : "");
      setColor(vehicle.color || "");
      setStatus(vehicle.status || "active");
      setMileage(vehicle.current_mileage ? String(vehicle.current_mileage) : "");
      const v = vehicle as unknown as Record<string, unknown>;
      setInsuranceExpiry((v.insurance_expiry as string) || "");
      setRegistrationExpiry((v.registration_expiry as string) || "");
      setInspectionExpiry((v.inspection_expiry as string) || "");
      setLastServiceDate((v.last_service_date as string) || "");
      setNextServiceDue((v.next_service_due as string) || "");
    }
  }, [vehicle]);

  if (isLoading || !vehicle) return <LoadingSpinner text="Loading vehicle..." />;

  const handleSave = () => {
    const payload: Record<string, unknown> = { id };
    if (make) payload.make = make;
    if (model) payload.model = model;
    if (year) payload.year = parseInt(year);
    if (color) payload.color = color;
    if (status) payload.status = status;
    if (mileage) payload.current_mileage = parseFloat(mileage);
    if (insuranceExpiry) payload.insurance_expiry = insuranceExpiry;
    if (registrationExpiry) payload.registration_expiry = registrationExpiry;
    if (inspectionExpiry) payload.inspection_expiry = inspectionExpiry;
    if (lastServiceDate) payload.last_service_date = lastServiceDate;
    if (nextServiceDue) payload.next_service_due = nextServiceDue;
    updateMutation.mutate(payload as Parameters<typeof updateMutation.mutate>[0], {
      onSuccess: () => toast("success", "Vehicle updated"),
      onError: () => toast("error", "Failed to update"),
    });
  };

  const ExpiryField = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
    <div>
      <Input label={label} type="date" value={value} onChange={(e) => onChange(e.target.value)} />
      {isExpired(value) && <p className="flex items-center gap-1 mt-1 text-xs text-red-600"><AlertTriangle className="h-3 w-3" /> Expired</p>}
      {isExpiringSoon(value) && !isExpired(value) && <p className="flex items-center gap-1 mt-1 text-xs text-amber-600"><AlertTriangle className="h-3 w-3" /> Expiring soon</p>}
    </div>
  );

  return (
    <>
      <Breadcrumb items={[{ label: "Fleet", href: "/fleet" }, { label: vehicle.plate_number }]} />
      <Header title={vehicle.plate_number} subtitle={`${vehicle.vehicle_type?.name || ""} — ${vehicle.make || ""} ${vehicle.model || ""}`}
        actions={<Button variant="ghost" onClick={() => router.push("/fleet")}><ArrowLeft className="h-4 w-4 mr-2" /> Back</Button>} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><h3 className="font-semibold">Vehicle Details</h3></CardHeader>
            <CardBody className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input label="Make" value={make} onChange={(e) => setMake(e.target.value)} />
                <Input label="Model" value={model} onChange={(e) => setModel(e.target.value)} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Input label="Year" type="number" value={year} onChange={(e) => setYear(e.target.value)} />
                <Input label="Color" value={color} onChange={(e) => setColor(e.target.value)} />
                <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}
                  options={[{value:"active",label:"Active"},{value:"maintenance",label:"Maintenance"},{value:"retired",label:"Retired"}]} />
              </div>
              <Input label="Current Mileage (km)" type="number" value={mileage} onChange={(e) => setMileage(e.target.value)} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader><h3 className="font-semibold">Documents</h3></CardHeader>
            <CardBody className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <ExpiryField label="Insurance Expiry" value={insuranceExpiry} onChange={setInsuranceExpiry} />
                <ExpiryField label="Registration Expiry" value={registrationExpiry} onChange={setRegistrationExpiry} />
                <ExpiryField label="Inspection Expiry" value={inspectionExpiry} onChange={setInspectionExpiry} />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader><h3 className="font-semibold">Maintenance</h3></CardHeader>
            <CardBody className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input label="Last Service Date" type="date" value={lastServiceDate} onChange={(e) => setLastServiceDate(e.target.value)} />
                <ExpiryField label="Next Service Due" value={nextServiceDue} onChange={setNextServiceDue} />
              </div>
            </CardBody>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSave} loading={updateMutation.isPending}>Save Changes</Button>
          </div>
        </div>

        <Card>
          <CardHeader><h3 className="font-semibold">Summary</h3></CardHeader>
          <CardBody className="space-y-3">
            <div className="flex justify-between"><span className="text-sm text-gray-500">Plate</span><span className="font-mono font-medium">{vehicle.plate_number}</span></div>
            <div className="flex justify-between"><span className="text-sm text-gray-500">Type</span><span className="text-sm">{vehicle.vehicle_type?.name}</span></div>
            <div className="flex justify-between"><span className="text-sm text-gray-500">Status</span><Badge status={vehicle.status} /></div>
            <div className="flex justify-between"><span className="text-sm text-gray-500">Capacity</span><span className="text-sm">{vehicle.vehicle_type?.seat_capacity} seats</span></div>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
