"use client";

import { useState } from "react";
import Header from "@/components/layout/Header";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import Pagination from "@/components/ui/Pagination";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Table, Thead, Tbody, Th, Tr, Td } from "@/components/ui/Table";
import { useAdminUsers, useChangeUserRole, useToggleUserActive } from "@/hooks/queries/useUsers";
import { useToast } from "@/components/ui/Toast";
import { formatDateTime } from "@/lib/utils";
import { Search, Shield } from "lucide-react";
import type { User } from "@/types";

const ROLES = [
  { value: "passenger", label: "Passenger" },
  { value: "agent", label: "Agent" },
  { value: "driver", label: "Driver" },
  { value: "fleet_manager", label: "Fleet Manager" },
  { value: "admin", label: "Admin" },
  { value: "super_admin", label: "Super Admin" },
];

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [roleModal, setRoleModal] = useState<User | null>(null);
  const [newRole, setNewRole] = useState("");
  const { toast } = useToast();

  const { data, isLoading } = useAdminUsers({
    search: search || undefined,
    role: roleFilter || undefined,
    page, page_size: 20,
  });
  const changeRoleMutation = useChangeUserRole();
  const toggleActiveMutation = useToggleUserActive();

  const users = data?.items || [];
  const totalPages = data ? Math.ceil(data.total / 20) : 0;

  const handleChangeRole = () => {
    if (!roleModal || !newRole) return;
    changeRoleMutation.mutate({ userId: roleModal.id, role: newRole }, {
      onSuccess: (result) => { setRoleModal(null); toast("success", `Role changed to ${result.new_role}`); },
      onError: () => toast("error", "Failed to change role"),
    });
  };

  const handleToggleActive = (user: User) => {
    toggleActiveMutation.mutate({ userId: user.id, activate: !user.is_active }, {
      onSuccess: () => toast("success", user.is_active ? "User deactivated" : "User activated"),
      onError: () => toast("error", "Failed to update user"),
    });
  };

  return (
    <>
      <Header title="Users" subtitle={`${data?.total || 0} users`} />

      <Card className="mb-6">
        <div className="p-4 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search email, name, phone..." value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white">
            <option value="">All Roles</option>
            {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
      </Card>

      <Card>
        {isLoading ? <LoadingSpinner /> : (
          <>
            <Table>
              <Thead>
                <tr><Th>Name</Th><Th>Email</Th><Th>Phone</Th><Th>Role</Th><Th>Status</Th><Th>Joined</Th><Th>Actions</Th></tr>
              </Thead>
              <Tbody>
                {users.length === 0 ? (
                  <Tr><Td colSpan={7} className="text-center py-8 text-gray-500">No users found</Td></Tr>
                ) : users.map((u) => (
                  <Tr key={u.id}>
                    <Td className="font-medium">{u.first_name} {u.last_name}</Td>
                    <Td className="text-sm text-gray-500">{u.email || "—"}</Td>
                    <Td className="text-sm text-gray-500">{u.phone || "—"}</Td>
                    <Td><span className="text-xs bg-gray-100 px-2 py-1 rounded capitalize">{u.role.replace(/_/g, " ")}</span></Td>
                    <Td><Badge status={u.is_active ? "active" : "retired"} /></Td>
                    <Td className="text-xs text-gray-500">{formatDateTime(u.created_at)}</Td>
                    <Td>
                      <div className="flex gap-2">
                        <button onClick={() => { setRoleModal(u); setNewRole(u.role); }}
                          className="p-1 text-gray-400 hover:text-primary-500" title="Change role">
                          <Shield className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleToggleActive(u)}
                          className={`text-xs px-2 py-1 rounded ${u.is_active ? "text-red-600 hover:bg-red-50" : "text-green-600 hover:bg-green-50"}`}>
                          {u.is_active ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </Card>

      <Modal isOpen={!!roleModal} onClose={() => setRoleModal(null)} title="Change User Role" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Changing role for <strong>{roleModal?.first_name} {roleModal?.last_name}</strong> ({roleModal?.email})
          </p>
          <Select label="New Role" value={newRole} onChange={(e) => setNewRole(e.target.value)} options={ROLES} />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setRoleModal(null)}>Cancel</Button>
            <Button onClick={handleChangeRole} loading={changeRoleMutation.isPending}>Update Role</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
