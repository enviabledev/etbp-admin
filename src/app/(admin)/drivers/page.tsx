"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Pagination from "@/components/ui/Pagination";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Table, Thead, Tbody, Th, Tr, Td } from "@/components/ui/Table";
import { useDrivers, useCreateDriver } from "@/hooks/queries/useDrivers";
import { useAllTerminals } from "@/hooks/queries/useTerminals";
import { useToast } from "@/components/ui/Toast";
import { formatDate } from "@/lib/utils";
import { Plus, Search, Star, AlertTriangle } from "lucide-react";

function isExpiringSoon(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  const expiry = new Date(dateStr);
  const now = new Date();
  const diffDays = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays <= 30;
}

function isExpired(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

export default function DriversPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [availFilter, setAvailFilter] = useState<string>("");
  const [showCreate, setShowCreate] = useState(false);
  const { toast } = useToast();

  // Create form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseExpiry, setLicenseExpiry] = useState("");
  const [licenseClass, setLicenseClass] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [medicalCheckExpiry, setMedicalCheckExpiry] = useState("");
  const [assignedTerminalId, setAssignedTerminalId] = useState("");

  const { data, isLoading } = useDrivers({
    search: search || undefined,
    is_available: availFilter === "" ? undefined : availFilter === "true",
    page,
    page_size: 20,
  });
  const createMutation = useCreateDriver();
  const { data: terminalsData } = useAllTerminals();

  const drivers = data?.items || [];
  const totalPages = data ? Math.ceil(data.total / 20) : 0;
  const terminals = terminalsData?.items || [];

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setPassword("");
    setLicenseNumber("");
    setLicenseExpiry("");
    setLicenseClass("");
    setYearsExperience("");
    setMedicalCheckExpiry("");
    setAssignedTerminalId("");
  };

  const handleCreate = () => {
    const payload: Record<string, unknown> = {
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      license_number: licenseNumber,
      license_expiry: licenseExpiry,
    };
    if (password) payload.password = password;
    if (licenseClass) payload.license_class = licenseClass;
    if (yearsExperience) payload.years_experience = parseInt(yearsExperience);
    if (medicalCheckExpiry) payload.medical_check_expiry = medicalCheckExpiry;
    if (assignedTerminalId) payload.assigned_terminal_id = assignedTerminalId;

    createMutation.mutate(payload, {
      onSuccess: () => {
        setShowCreate(false);
        resetForm();
        toast("success", "Driver created successfully");
      },
      onError: () => toast("error", "Failed to create driver"),
    });
  };

  return (
    <>
      <Header
        title="Drivers"
        subtitle={`${data?.total || 0} drivers`}
        actions={
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-2" /> Create Driver
          </Button>
        }
      />

      <Card className="mb-6">
        <div className="p-4 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search name, phone, license..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <select
            value={availFilter}
            onChange={(e) => {
              setAvailFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white"
          >
            <option value="">All</option>
            <option value="true">Available</option>
            <option value="false">Unavailable</option>
          </select>
        </div>
      </Card>

      <Card>
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <>
            <Table>
              <Thead>
                <tr>
                  <Th>Name</Th>
                  <Th>Phone</Th>
                  <Th>License</Th>
                  <Th>License Expiry</Th>
                  <Th>Terminal</Th>
                  <Th>Rating</Th>
                  <Th>Trips</Th>
                  <Th>Available</Th>
                </tr>
              </Thead>
              <Tbody>
                {drivers.length === 0 ? (
                  <Tr>
                    <Td colSpan={8} className="text-center py-8 text-gray-500">
                      No drivers found
                    </Td>
                  </Tr>
                ) : (
                  drivers.map((d) => (
                    <Tr key={d.id} onClick={() => router.push(`/drivers/${d.id}`)}>
                      <Td className="font-medium">
                        {d.user?.first_name} {d.user?.last_name}
                      </Td>
                      <Td className="text-sm text-gray-500">{d.user?.phone || "—"}</Td>
                      <Td className="font-mono text-xs">{d.license_number}</Td>
                      <Td>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">{formatDate(d.license_expiry)}</span>
                          {isExpired(d.license_expiry) && (
                            <span className="inline-flex items-center gap-0.5 text-xs bg-red-100 text-red-800 px-1.5 py-0.5 rounded-full font-medium">
                              <AlertTriangle className="h-3 w-3" /> Expired
                            </span>
                          )}
                          {!isExpired(d.license_expiry) && isExpiringSoon(d.license_expiry) && (
                            <span className="inline-flex items-center gap-0.5 text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full font-medium">
                              <AlertTriangle className="h-3 w-3" /> Expiring
                            </span>
                          )}
                        </div>
                      </Td>
                      <Td>{d.assigned_terminal?.name || "—"}</Td>
                      <Td>
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                          {d.rating_avg.toFixed(1)}
                        </span>
                      </Td>
                      <Td>{d.total_trips}</Td>
                      <Td>
                        <Badge status={d.is_available ? "active" : "maintenance"} />
                      </Td>
                    </Tr>
                  ))
                )}
              </Tbody>
            </Table>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </Card>

      <Modal
        isOpen={showCreate}
        onClose={() => {
          setShowCreate(false);
          resetForm();
        }}
        title="Create Driver"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="John"
            />
            <Input
              label="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Doe"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="driver@example.com"
            />
            <Input
              label="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+234..."
            />
          </div>
          <Input
            label="Password (optional)"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Leave blank for auto-generated"
          />
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="License Number"
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
              placeholder="DRV-12345"
            />
            <Input
              label="License Expiry"
              type="date"
              value={licenseExpiry}
              onChange={(e) => setLicenseExpiry(e.target.value)}
            />
            <Input
              label="License Class"
              value={licenseClass}
              onChange={(e) => setLicenseClass(e.target.value)}
              placeholder="Class B"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Years of Experience"
              type="number"
              value={yearsExperience}
              onChange={(e) => setYearsExperience(e.target.value)}
              placeholder="5"
            />
            <Input
              label="Medical Check Expiry"
              type="date"
              value={medicalCheckExpiry}
              onChange={(e) => setMedicalCheckExpiry(e.target.value)}
            />
          </div>
          <Select
            label="Assigned Terminal"
            value={assignedTerminalId}
            onChange={(e) => setAssignedTerminalId(e.target.value)}
            placeholder="Select terminal (optional)"
            options={terminals.map((t) => ({
              value: t.id,
              label: `${t.name} (${t.code})`,
            }))}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => {
                setShowCreate(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              loading={createMutation.isPending}
              disabled={!firstName || !lastName || !email || !phone || !licenseNumber || !licenseExpiry}
            >
              Create Driver
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
