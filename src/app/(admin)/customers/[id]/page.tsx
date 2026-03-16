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
import { useToast } from "@/components/ui/Toast";
import { formatDate, formatCurrency } from "@/lib/utils";
import { ArrowLeft, User, Calendar, Phone, Mail, MapPin } from "lucide-react";
import api from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface CustomerDetail {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  gender: string | null;
  date_of_birth: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  is_active: boolean;
  created_at: string;
  last_login_at: string | null;
  total_bookings: number;
  total_spent: number;
  wallet_balance: number;
  favourite_route: string | null;
  recent_bookings: {
    id: string;
    reference: string;
    route_name: string;
    departure_date: string;
    status: string;
    total_amount: number;
  }[];
}

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: customer, isLoading } = useQuery<CustomerDetail>({
    queryKey: ["admin-customer-detail", id],
    queryFn: async () => {
      const { data } = await api.get(`/api/admin/users/customers/${id}`);
      return data;
    },
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data } = await api.put(`/api/admin/users/customers/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-customer-detail", id] });
      qc.invalidateQueries({ queryKey: ["admin-customers"] });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async (activate: boolean) => {
      const endpoint = activate ? "activate" : "deactivate";
      const { data } = await api.put(`/api/admin/users/${id}/${endpoint}`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-customer-detail", id] });
      qc.invalidateQueries({ queryKey: ["admin-customers"] });
    },
  });

  const [editMode, setEditMode] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");

  useEffect(() => {
    if (customer) {
      setFirstName(customer.first_name || "");
      setLastName(customer.last_name || "");
      setPhone(customer.phone || "");
      setGender(customer.gender || "");
      setDob(customer.date_of_birth || "");
      setEmergencyName(customer.emergency_contact_name || "");
      setEmergencyPhone(customer.emergency_contact_phone || "");
    }
  }, [customer]);

  if (isLoading || !customer) return <LoadingSpinner text="Loading customer..." />;

  const fullName = [customer.first_name, customer.last_name].filter(Boolean).join(" ") || "Unknown";

  const handleSave = () => {
    updateMutation.mutate(
      {
        first_name: firstName,
        last_name: lastName,
        phone: phone || null,
        gender: gender || null,
        date_of_birth: dob || null,
        emergency_contact_name: emergencyName || null,
        emergency_contact_phone: emergencyPhone || null,
      },
      {
        onSuccess: () => {
          toast("success", "Customer updated successfully");
          setEditMode(false);
        },
        onError: () => toast("error", "Failed to update customer"),
      }
    );
  };

  const handleToggleActive = () => {
    toggleActiveMutation.mutate(!customer.is_active, {
      onSuccess: () =>
        toast("success", customer.is_active ? "Customer deactivated" : "Customer activated"),
      onError: () => toast("error", "Failed to update status"),
    });
  };

  return (
    <>
      <Breadcrumb
        items={[
          { label: "Customers", href: "/customers" },
          { label: fullName },
        ]}
      />
      <Header
        title={fullName}
        subtitle={customer.email || "No email"}
        actions={
          <Button variant="ghost" onClick={() => router.push("/customers")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Profile</h3>
                {!editMode && (
                  <Button variant="ghost" size="sm" onClick={() => setEditMode(true)}>
                    Edit
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardBody>
              {editMode ? (
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
                  <Input
                    label="Phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                  <Select
                    label="Gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    placeholder="Select gender"
                    options={[
                      { value: "male", label: "Male" },
                      { value: "female", label: "Female" },
                      { value: "other", label: "Other" },
                    ]}
                  />
                  <Input
                    label="Date of Birth"
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                  />
                  <Input
                    label="Emergency Contact Name"
                    value={emergencyName}
                    onChange={(e) => setEmergencyName(e.target.value)}
                  />
                  <Input
                    label="Emergency Contact Phone"
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                  />
                  <div className="flex gap-3 pt-2">
                    <Button onClick={handleSave} loading={updateMutation.isPending}>
                      Save
                    </Button>
                    <Button variant="secondary" onClick={() => setEditMode(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                      <User className="h-6 w-6 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{fullName}</p>
                      <p className="text-sm text-gray-500">{customer.gender ? customer.gender.charAt(0).toUpperCase() + customer.gender.slice(1) : "—"}</p>
                    </div>
                  </div>
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-700">{customer.email || "—"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-700">{customer.phone || "—"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-700">
                        {customer.date_of_birth ? formatDate(customer.date_of_birth) : "—"}
                      </span>
                    </div>
                    {(customer.emergency_contact_name || customer.emergency_contact_phone) && (
                      <div className="pt-2 border-t border-gray-100">
                        <p className="text-xs font-medium text-gray-500 mb-1">Emergency Contact</p>
                        <p className="text-sm text-gray-700">
                          {customer.emergency_contact_name || "—"} &middot;{" "}
                          {customer.emergency_contact_phone || "—"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Status & Meta */}
          <Card>
            <CardBody className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Status</span>
                <Badge status={customer.is_active ? "active" : "retired"} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Registered</span>
                <span className="text-sm font-medium">{formatDate(customer.created_at)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Last Login</span>
                <span className="text-sm font-medium">
                  {customer.last_login_at ? formatDate(customer.last_login_at) : "Never"}
                </span>
              </div>
              <div className="pt-2">
                <Button
                  variant={customer.is_active ? "danger" : "primary"}
                  size="sm"
                  className="w-full"
                  onClick={handleToggleActive}
                  loading={toggleActiveMutation.isPending}
                >
                  {customer.is_active ? "Deactivate Customer" : "Activate Customer"}
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardBody className="text-center">
                <p className="text-2xl font-bold text-gray-900">{customer.total_bookings}</p>
                <p className="text-sm text-gray-500">Total Bookings</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(customer.total_spent || 0)}
                </p>
                <p className="text-sm text-gray-500">Total Spent</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(customer.wallet_balance || 0)}
                </p>
                <p className="text-sm text-gray-500">Wallet Balance</p>
              </CardBody>
            </Card>
          </div>

          {/* Favourite Route */}
          {customer.favourite_route && (
            <Card>
              <CardBody>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary-500" />
                  <span className="text-sm text-gray-500">Favourite Route:</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700">
                    {customer.favourite_route}
                  </span>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Recent Bookings */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold">Recent Bookings</h3>
            </CardHeader>
            {customer.recent_bookings && customer.recent_bookings.length > 0 ? (
              <Table>
                <Thead>
                  <tr>
                    <Th>Reference</Th>
                    <Th>Route</Th>
                    <Th>Date</Th>
                    <Th>Status</Th>
                    <Th>Amount</Th>
                  </tr>
                </Thead>
                <Tbody>
                  {customer.recent_bookings.map((b) => (
                    <Tr
                      key={b.id}
                      onClick={() => router.push(`/bookings/${b.reference}`)}
                    >
                      <Td className="font-mono text-xs">{b.reference}</Td>
                      <Td>{b.route_name || "—"}</Td>
                      <Td className="text-sm text-gray-500">
                        {b.departure_date ? formatDate(b.departure_date) : "—"}
                      </Td>
                      <Td>
                        <Badge status={b.status} />
                      </Td>
                      <Td className="font-medium">{formatCurrency(b.total_amount)}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            ) : (
              <CardBody>
                <p className="text-sm text-gray-500 text-center py-6">No bookings yet</p>
              </CardBody>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
