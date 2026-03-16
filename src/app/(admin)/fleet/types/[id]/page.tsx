"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Breadcrumb from "@/components/ui/Breadcrumb";
import Header from "@/components/layout/Header";
import Card, { CardBody, CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Table, Thead, Tbody, Th, Tr, Td } from "@/components/ui/Table";
import { useVehicleType, useUpdateVehicleType, useVehicles } from "@/hooks/queries/useVehicles";
import { useToast } from "@/components/ui/Toast";
import { ArrowLeft } from "lucide-react";

type ApiError = Error & { response?: { data?: { detail?: string } } };

const COMMON_AMENITIES = [
  "wifi",
  "air_conditioning",
  "usb_charging",
  "reclining_seats",
  "entertainment",
  "luggage_storage",
  "restroom",
  "snacks",
  "blankets",
  "reading_lights",
];

interface SeatLayout {
  rows?: number;
  columns?: number;
  seats?: { row: number; col: number; number: string; type?: string }[];
}

function SeatLayoutPreview({ layout }: { layout: SeatLayout | null }) {
  if (!layout || !layout.rows || !layout.columns) {
    return (
      <p className="text-sm text-gray-500 text-center py-6">
        No seat layout configured
      </p>
    );
  }

  const { rows, columns, seats } = layout;

  // Build a grid map from seat data
  const seatMap: Record<string, string> = {};
  if (seats && Array.isArray(seats)) {
    seats.forEach((s) => {
      seatMap[`${s.row}-${s.col}`] = s.number;
    });
  }

  return (
    <div className="flex flex-col items-center gap-1 py-4">
      <div className="text-xs text-gray-400 mb-2">Front</div>
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="flex gap-1">
          {Array.from({ length: columns }, (_, c) => {
            const key = `${r + 1}-${c + 1}`;
            const seatNumber = seatMap[key];
            const hasSeat = seats ? !!seatNumber : true;
            const displayLabel = seatNumber || (seats ? "" : `${r * columns + c + 1}`);

            return (
              <div
                key={c}
                className={`w-10 h-10 rounded flex items-center justify-center text-xs font-medium ${
                  hasSeat
                    ? "bg-primary-100 text-primary-700 border border-primary-300"
                    : "bg-gray-50 border border-dashed border-gray-200"
                }`}
              >
                {hasSeat ? displayLabel : ""}
              </div>
            );
          })}
        </div>
      ))}
      <div className="text-xs text-gray-400 mt-2">Back</div>
    </div>
  );
}

export default function VehicleTypeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const { data: vehicleType, isLoading } = useVehicleType(id);
  const updateMutation = useUpdateVehicleType();
  const { data: vehiclesData } = useVehicles({ page_size: 100 });

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [seatCapacity, setSeatCapacity] = useState("");
  const [amenities, setAmenities] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (vehicleType) {
      setName(vehicleType.name || "");
      setDescription(vehicleType.description || "");
      setSeatCapacity(vehicleType.seat_capacity ? String(vehicleType.seat_capacity) : "");
      if (vehicleType.amenities && typeof vehicleType.amenities === "object") {
        const am: Record<string, boolean> = {};
        COMMON_AMENITIES.forEach((a) => {
          am[a] = !!(vehicleType.amenities as Record<string, unknown>)?.[a];
        });
        setAmenities(am);
      }
    }
  }, [vehicleType]);

  if (isLoading || !vehicleType) return <LoadingSpinner text="Loading vehicle type..." />;

  // Filter vehicles that use this type
  const vehiclesOfType = (vehiclesData?.items || []).filter(
    (v) => v.vehicle_type?.id === id || v.vehicle_type_id === id
  );

  const handleSave = () => {
    const payload: Record<string, unknown> = {
      id,
      name,
      description: description || null,
      seat_capacity: seatCapacity ? parseInt(seatCapacity) : undefined,
      amenities,
    };

    updateMutation.mutate(payload as Record<string, unknown> & { id: string }, {
      onSuccess: () => toast("success", "Vehicle type updated successfully"),
      onError: (err: ApiError) =>
        toast("error", err?.response?.data?.detail || "Failed to update vehicle type"),
    });
  };

  const toggleAmenity = (key: string) => {
    setAmenities((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <>
      <Breadcrumb
        items={[
          { label: "Fleet", href: "/fleet" },
          { label: "Vehicle Types", href: "/fleet/types" },
          { label: vehicleType.name },
        ]}
      />
      <Header
        title={vehicleType.name}
        subtitle={`${vehicleType.seat_capacity} seats`}
        actions={
          <Button variant="ghost" onClick={() => router.push("/fleet/types")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Edit Form */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold">Edit Vehicle Type</h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Executive Bus"
                  />
                  <Input
                    label="Seat Capacity"
                    type="number"
                    value={seatCapacity}
                    onChange={(e) => setSeatCapacity(e.target.value)}
                    placeholder="32"
                  />
                </div>
                <Input
                  label="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Luxury bus with WiFi and AC"
                />

                {/* Amenities */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amenities
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {COMMON_AMENITIES.map((amenity) => (
                      <label
                        key={amenity}
                        className="flex items-center gap-2 text-sm cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={amenities[amenity] || false}
                          onChange={() => toggleAmenity(amenity)}
                          className="rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                        />
                        <span className="capitalize">{amenity.replace(/_/g, " ")}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Seat Layout Preview */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold">Seat Layout Preview</h3>
            </CardHeader>
            <CardBody>
              <SeatLayoutPreview layout={vehicleType.seat_layout as SeatLayout | null} />
            </CardBody>
          </Card>

          {/* Vehicles Using This Type */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold">
                Vehicles Using This Type ({vehiclesOfType.length})
              </h3>
            </CardHeader>
            {vehiclesOfType.length > 0 ? (
              <Table>
                <Thead>
                  <tr>
                    <Th>Plate Number</Th>
                    <Th>Make / Model</Th>
                    <Th>Year</Th>
                    <Th>Status</Th>
                  </tr>
                </Thead>
                <Tbody>
                  {vehiclesOfType.map((v) => (
                    <Tr key={v.id}>
                      <Td className="font-mono font-medium">{v.plate_number}</Td>
                      <Td>{[v.make, v.model].filter(Boolean).join(" ") || "—"}</Td>
                      <Td>{v.year || "—"}</Td>
                      <Td>
                        <Badge status={v.status} />
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            ) : (
              <CardBody>
                <p className="text-sm text-gray-500 text-center py-6">
                  No vehicles are using this type
                </p>
              </CardBody>
            )}
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSave} loading={updateMutation.isPending}>
              Save Changes
            </Button>
          </div>
        </div>

        {/* Sidebar Summary */}
        <Card className="h-fit">
          <CardHeader>
            <h3 className="font-semibold">Type Summary</h3>
          </CardHeader>
          <CardBody className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Name</span>
              <span className="text-sm font-medium">{vehicleType.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Capacity</span>
              <span className="text-sm font-medium">{vehicleType.seat_capacity} seats</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Vehicles</span>
              <span className="text-sm font-medium">{vehiclesOfType.length}</span>
            </div>
            {vehicleType.amenities && (
              <div>
                <span className="text-sm text-gray-500 block mb-1.5">Amenities</span>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(vehicleType.amenities)
                    .filter(([, v]) => v)
                    .map(([k]) => (
                      <span
                        key={k}
                        className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded"
                      >
                        {k.replace(/_/g, " ")}
                      </span>
                    ))}
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
