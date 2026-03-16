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
import EmptyState from "@/components/ui/EmptyState";
import { Table, Thead, Tbody, Th, Tr, Td } from "@/components/ui/Table";
import { useAllTerminals } from "@/hooks/queries/useTerminals";
import { useUpdateDriver } from "@/hooks/queries/useDrivers";
import { useToast } from "@/components/ui/Toast";
import { formatDate, formatTime } from "@/lib/utils";
import { ArrowLeft, Star, AlertTriangle, Truck } from "lucide-react";
import api from "@/lib/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface DriverDetail {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  license_number: string;
  license_expiry: string;
  license_class: string | null;
  years_experience: number | null;
  medical_check_expiry: string | null;
  rating_avg: number;
  total_trips: number;
  is_available: boolean;
  is_active: boolean;
  assigned_terminal_id: string | null;
  assigned_terminal?: { id: string; name: string; code: string } | null;
  created_at: string;
  trip_history: {
    id: string;
    route_name: string;
    departure_date: string;
    departure_time: string;
    status: string;
    vehicle_plate: string;
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

const TABS = ["Profile", "Compliance", "Trips", "Performance"] as const;
type Tab = (typeof TABS)[number];

export default function DriverDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState<Tab>("Profile");

  const { data: driver, isLoading } = useQuery<DriverDetail>({
    queryKey: ["admin-driver-detail", id],
    queryFn: async () => {
      const { data } = await api.get(`/api/admin/drivers/${id}/detail`);
      // Backend returns { driver, compliance, trip_history, performance }
      // Flatten into the shape the page expects
      const d = data.driver || data;
      const user = d.user || {};
      return {
        ...d,
        first_name: user.first_name || d.first_name || "",
        last_name: user.last_name || d.last_name || "",
        email: user.email || d.email || "",
        phone: user.phone || d.phone || "",
        is_active: user.is_active ?? d.is_active ?? true,
        rating_avg: data.performance?.rating_avg ?? d.rating_avg ?? 0,
        total_trips: data.performance?.total_trips ?? d.total_trips ?? 0,
        trip_history: data.trip_history || [],
      };
    },
    enabled: !!id,
  });

  const updateMutation = useUpdateDriver();
  const { data: terminalsData } = useAllTerminals();
  const terminals = terminalsData?.items || [];

  // Profile form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [assignedTerminalId, setAssignedTerminalId] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [isAvailable, setIsAvailable] = useState(false);

  // Compliance form state
  const [licenseExpiry, setLicenseExpiry] = useState("");
  const [medicalCheckExpiry, setMedicalCheckExpiry] = useState("");

  useEffect(() => {
    if (driver) {
      setFirstName(driver.first_name || "");
      setLastName(driver.last_name || "");
      setEmail(driver.email || "");
      setPhone(driver.phone || "");
      setAssignedTerminalId(driver.assigned_terminal_id || "");
      setYearsExperience(driver.years_experience ? String(driver.years_experience) : "");
      setIsAvailable(driver.is_available);
      setLicenseExpiry(driver.license_expiry || "");
      setMedicalCheckExpiry(driver.medical_check_expiry || "");
    }
  }, [driver]);

  if (isLoading || !driver) return <LoadingSpinner text="Loading driver..." />;

  const fullName = [driver.first_name, driver.last_name].filter(Boolean).join(" ") || "Unknown";

  const handleProfileSave = () => {
    updateMutation.mutate(
      {
        id: driver.id,
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        assigned_terminal_id: assignedTerminalId || null,
        years_experience: yearsExperience ? parseInt(yearsExperience) : null,
        is_available: isAvailable,
      },
      {
        onSuccess: () => {
          toast("success", "Driver profile updated");
          qc.invalidateQueries({ queryKey: ["admin-driver-detail", id] });
        },
        onError: () => toast("error", "Failed to update driver"),
      }
    );
  };

  const handleComplianceSave = () => {
    updateMutation.mutate(
      {
        id: driver.id,
        license_expiry: licenseExpiry || undefined,
        medical_check_expiry: medicalCheckExpiry || undefined,
      },
      {
        onSuccess: () => {
          toast("success", "Compliance details updated");
          qc.invalidateQueries({ queryKey: ["admin-driver-detail", id] });
        },
        onError: () => toast("error", "Failed to update compliance"),
      }
    );
  };

  const licenseDays = daysRemaining(driver.license_expiry);
  const medicalDays = daysRemaining(driver.medical_check_expiry);

  return (
    <>
      <Breadcrumb
        items={[{ label: "Drivers", href: "/drivers" }, { label: fullName }]}
      />
      <Header
        title={fullName}
        subtitle={`License: ${driver.license_number}`}
        actions={
          <Button variant="ghost" onClick={() => router.push("/drivers")}>
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

      {/* Profile Tab */}
      {activeTab === "Profile" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <h3 className="font-semibold">Driver Profile</h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="First Name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                    <Input
                      label="Last Name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <Input
                      label="Phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Select
                      label="Assigned Terminal"
                      value={assignedTerminalId}
                      onChange={(e) => setAssignedTerminalId(e.target.value)}
                      placeholder="Select terminal"
                      options={terminals.map((t) => ({
                        value: t.id,
                        label: `${t.name} (${t.code})`,
                      }))}
                    />
                    <Input
                      label="Years of Experience"
                      type="number"
                      value={yearsExperience}
                      onChange={(e) => setYearsExperience(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isAvailable}
                        onChange={(e) => setIsAvailable(e.target.checked)}
                        className="rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                      />
                      <span>Available for trips</span>
                    </label>
                  </div>
                  <div className="flex justify-end pt-2">
                    <Button onClick={handleProfileSave} loading={updateMutation.isPending}>
                      Save Profile
                    </Button>
                  </div>
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
                <span className="text-sm text-gray-500">Status</span>
                <Badge status={driver.is_available ? "active" : "maintenance"} />
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Rating</span>
                <span className="flex items-center gap-1 text-sm font-medium">
                  <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                  {(driver.rating_avg ?? 0).toFixed(1)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Total Trips</span>
                <span className="text-sm font-medium">{driver.total_trips}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Terminal</span>
                <span className="text-sm font-medium">
                  {driver.assigned_terminal?.name || "Unassigned"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Joined</span>
                <span className="text-sm font-medium">{formatDate(driver.created_at)}</span>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Compliance Tab */}
      {activeTab === "Compliance" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* License Card */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold">Driver License</h3>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">License Number</span>
                  <span className="font-mono text-sm font-medium">{driver.license_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Class</span>
                  <span className="text-sm font-medium">{driver.license_class || "—"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Expiry</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{formatDate(driver.license_expiry)}</span>
                    {isExpired(driver.license_expiry) && (
                      <span className="inline-flex items-center gap-0.5 text-xs bg-red-100 text-red-800 px-1.5 py-0.5 rounded-full font-medium">
                        <AlertTriangle className="h-3 w-3" /> Expired
                      </span>
                    )}
                    {isExpiringSoon(driver.license_expiry) && (
                      <span className="inline-flex items-center gap-0.5 text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full font-medium">
                        <AlertTriangle className="h-3 w-3" /> {licenseDays} days
                      </span>
                    )}
                  </div>
                </div>
                {licenseDays !== null && !isExpired(driver.license_expiry) && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Days Remaining</span>
                    <span className="text-sm font-medium">{licenseDays} days</span>
                  </div>
                )}
              </div>
              <Input
                label="Update Expiry Date"
                type="date"
                value={licenseExpiry}
                onChange={(e) => setLicenseExpiry(e.target.value)}
              />
            </CardBody>
          </Card>

          {/* Medical Check Card */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold">Medical Check</h3>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Expiry</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {driver.medical_check_expiry ? formatDate(driver.medical_check_expiry) : "Not set"}
                    </span>
                    {isExpired(driver.medical_check_expiry) && (
                      <span className="inline-flex items-center gap-0.5 text-xs bg-red-100 text-red-800 px-1.5 py-0.5 rounded-full font-medium">
                        <AlertTriangle className="h-3 w-3" /> Expired
                      </span>
                    )}
                    {isExpiringSoon(driver.medical_check_expiry) && (
                      <span className="inline-flex items-center gap-0.5 text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full font-medium">
                        <AlertTriangle className="h-3 w-3" /> {medicalDays} days
                      </span>
                    )}
                  </div>
                </div>
                {medicalDays !== null && !isExpired(driver.medical_check_expiry) && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Days Remaining</span>
                    <span className="text-sm font-medium">{medicalDays} days</span>
                  </div>
                )}
              </div>
              <Input
                label="Update Expiry Date"
                type="date"
                value={medicalCheckExpiry}
                onChange={(e) => setMedicalCheckExpiry(e.target.value)}
              />
            </CardBody>
          </Card>

          <div className="md:col-span-2 flex justify-end">
            <Button onClick={handleComplianceSave} loading={updateMutation.isPending}>
              Save Compliance
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
          {driver.trip_history && driver.trip_history.length > 0 ? (
            <Table>
              <Thead>
                <tr>
                  <Th>Route</Th>
                  <Th>Date</Th>
                  <Th>Time</Th>
                  <Th>Status</Th>
                  <Th>Vehicle</Th>
                </tr>
              </Thead>
              <Tbody>
                {driver.trip_history.map((trip) => (
                  <Tr key={trip.id}>
                    <Td className="font-medium">{trip.route_name}</Td>
                    <Td className="text-sm text-gray-500">{formatDate(trip.departure_date)}</Td>
                    <Td className="text-sm text-gray-500">{formatTime(trip.departure_time)}</Td>
                    <Td>
                      <Badge status={trip.status} />
                    </Td>
                    <Td className="font-mono text-xs">{trip.vehicle_plate || "—"}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          ) : (
            <EmptyState icon={Truck} title="No trips assigned yet" />
          )}
        </Card>
      )}

      {/* Performance Tab */}
      {activeTab === "Performance" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardBody className="text-center py-8">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Star className="h-8 w-8 text-amber-500 fill-amber-500" />
                <span className="text-4xl font-bold text-gray-900">
                  {(driver.rating_avg ?? 0).toFixed(1)}
                </span>
              </div>
              <p className="text-sm text-gray-500">Average Rating</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="text-center py-8">
              <p className="text-4xl font-bold text-gray-900 mb-2">{driver.total_trips}</p>
              <p className="text-sm text-gray-500">Total Trips</p>
            </CardBody>
          </Card>
        </div>
      )}
    </>
  );
}
