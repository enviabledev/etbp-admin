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
import { useChangeUserRole, useToggleUserActive } from "@/hooks/queries/useUsers";
import { useToast } from "@/components/ui/Toast";
import { formatDate, formatDateTime } from "@/lib/utils";
import { ArrowLeft, User, Mail, Phone, Shield } from "lucide-react";
import api from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const ADMIN_ROLES = [
  { value: "admin", label: "Admin" },
  { value: "super_admin", label: "Super Admin" },
  { value: "fleet_manager", label: "Fleet Manager" },
];


interface AdminUserDetail {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
  last_login_at: string | null;
  audit_log?: {
    id: string;
    action: string;
    resource: string;
    details: string | null;
    created_at: string;
  }[];
}

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: user, isLoading } = useQuery<AdminUserDetail>({
    queryKey: ["admin-user-detail", id],
    queryFn: async () => {
      const { data } = await api.get(`/api/admin/users/admins/${id}`);
      return data;
    },
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data } = await api.put(`/api/admin/users/admins/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-user-detail", id] });
      qc.invalidateQueries({ queryKey: ["admin-users-list"] });
    },
  });

  const changeRoleMutation = useChangeUserRole();
  const toggleActiveMutation = useToggleUserActive();

  const [editMode, setEditMode] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || "");
      setLastName(user.last_name || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");
      setRole(user.role || "");
    }
  }, [user]);

  if (isLoading || !user) return <LoadingSpinner text="Loading admin user..." />;

  const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ") || "Unknown";

  const handleSave = () => {
    updateMutation.mutate(
      {
        first_name: firstName,
        last_name: lastName,
        email,
        phone: phone || null,
      },
      {
        onSuccess: () => {
          toast("success", "Admin user updated successfully");
          setEditMode(false);
        },
        onError: () => toast("error", "Failed to update admin user"),
      }
    );
  };

  const handleRoleChange = (newRole: string) => {
    setRole(newRole);
    changeRoleMutation.mutate(
      { userId: id, role: newRole },
      {
        onSuccess: () => {
          toast("success", "Role updated successfully");
          qc.invalidateQueries({ queryKey: ["admin-user-detail", id] });
          qc.invalidateQueries({ queryKey: ["admin-users-list"] });
        },
        onError: () => {
          setRole(user.role);
          toast("error", "Failed to change role");
        },
      }
    );
  };

  const handleToggleActive = () => {
    toggleActiveMutation.mutate(
      { userId: id, activate: !user.is_active },
      {
        onSuccess: () => {
          toast("success", user.is_active ? "User deactivated" : "User activated");
          qc.invalidateQueries({ queryKey: ["admin-user-detail", id] });
          qc.invalidateQueries({ queryKey: ["admin-users-list"] });
        },
        onError: () => toast("error", "Failed to update status"),
      }
    );
  };

  return (
    <>
      <Breadcrumb
        items={[{ label: "Admin Users", href: "/admin-users" }, { label: fullName }]}
      />
      <Header
        title={fullName}
        subtitle={user.role.replace(/_/g, " ")}
        actions={
          <Button variant="ghost" onClick={() => router.push("/admin-users")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT */}
        <div className="space-y-6">
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
                      <p className="text-sm text-gray-500 capitalize">{user.role.replace(/_/g, " ")}</p>
                    </div>
                  </div>
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-700">{user.email || "—"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-700">{user.phone || "—"}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Role */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-gray-500" />
                <h3 className="font-semibold">Role</h3>
              </div>
            </CardHeader>
            <CardBody>
              <Select
                label="Admin Role"
                value={role}
                onChange={(e) => handleRoleChange(e.target.value)}
                options={ADMIN_ROLES}
              />
              {changeRoleMutation.isPending && (
                <p className="text-xs text-gray-500 mt-2">Updating role...</p>
              )}
            </CardBody>
          </Card>

          {/* Status */}
          <Card>
            <CardBody className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Status</span>
                <Badge status={user.is_active ? "active" : "retired"} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Joined</span>
                <span className="text-sm font-medium">{formatDate(user.created_at)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Last Login</span>
                <span className="text-sm font-medium">
                  {user.last_login_at ? formatDate(user.last_login_at) : "Never"}
                </span>
              </div>
              <div className="pt-2">
                <Button
                  variant={user.is_active ? "danger" : "primary"}
                  size="sm"
                  className="w-full"
                  onClick={handleToggleActive}
                  loading={toggleActiveMutation.isPending}
                >
                  {user.is_active ? "Deactivate User" : "Activate User"}
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* RIGHT - Audit Log */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <h3 className="font-semibold">Recent Audit Log</h3>
            </CardHeader>
            {user.audit_log && user.audit_log.length > 0 ? (
              <Table>
                <Thead>
                  <tr>
                    <Th>Action</Th>
                    <Th>Resource</Th>
                    <Th>Details</Th>
                    <Th>Date</Th>
                  </tr>
                </Thead>
                <Tbody>
                  {user.audit_log.map((log) => (
                    <Tr key={log.id}>
                      <Td>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 capitalize">
                          {log.action}
                        </span>
                      </Td>
                      <Td className="text-sm">{log.resource}</Td>
                      <Td className="text-sm text-gray-500 max-w-xs truncate">
                        {log.details || "—"}
                      </Td>
                      <Td className="text-sm text-gray-500">
                        {formatDateTime(log.created_at)}
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            ) : (
              <CardBody>
                <p className="text-sm text-gray-500 text-center py-6">No audit log entries</p>
              </CardBody>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
