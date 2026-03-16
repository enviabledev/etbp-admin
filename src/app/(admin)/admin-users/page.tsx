"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import Pagination from "@/components/ui/Pagination";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Table, Thead, Tbody, Th, Tr, Td } from "@/components/ui/Table";
import { useAdminUsersList } from "@/hooks/queries/useAdminUsers";
import { useChangeUserRole, useToggleUserActive } from "@/hooks/queries/useUsers";
import { useToast } from "@/components/ui/Toast";
import { formatDate } from "@/lib/utils";
import { Search, Shield } from "lucide-react";
import type { User } from "@/types";

const ADMIN_ROLES = [
  { value: "admin", label: "Admin" },
  { value: "super_admin", label: "Super Admin" },
  { value: "fleet_manager", label: "Fleet Manager" },
];

const ROLE_COLORS: Record<string, string> = {
  super_admin: "bg-purple-100 text-purple-800",
  admin: "bg-blue-100 text-blue-800",
  fleet_manager: "bg-teal-100 text-teal-800",
};

export default function AdminUsersPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [roleModal, setRoleModal] = useState<User | null>(null);
  const [newRole, setNewRole] = useState("");
  const { toast } = useToast();

  const { data, isLoading } = useAdminUsersList({
    search: search || undefined,
    page,
    page_size: 20,
  });
  const changeRoleMutation = useChangeUserRole();
  const toggleActiveMutation = useToggleUserActive();

  const users = data?.items || [];
  const totalPages = data ? Math.ceil(data.total / 20) : 0;

  const handleChangeRole = () => {
    if (!roleModal || !newRole) return;
    changeRoleMutation.mutate(
      { userId: roleModal.id, role: newRole },
      {
        onSuccess: () => {
          setRoleModal(null);
          toast("success", "Role updated successfully");
        },
        onError: () => toast("error", "Failed to change role"),
      }
    );
  };

  const handleToggleActive = (user: User) => {
    toggleActiveMutation.mutate(
      { userId: user.id, activate: !user.is_active },
      {
        onSuccess: () =>
          toast("success", user.is_active ? "User deactivated" : "User activated"),
        onError: () => toast("error", "Failed to update user status"),
      }
    );
  };

  return (
    <>
      <Header title="Admin Users" subtitle={`${data?.total || 0} admin users`} />

      <Card className="mb-6">
        <div className="p-4 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search name, email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
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
                  <Th>Email</Th>
                  <Th>Role</Th>
                  <Th>Status</Th>
                  <Th>Joined</Th>
                  <Th>Actions</Th>
                </tr>
              </Thead>
              <Tbody>
                {users.length === 0 ? (
                  <Tr>
                    <Td colSpan={6} className="text-center py-8 text-gray-500">
                      No admin users found
                    </Td>
                  </Tr>
                ) : (
                  users.map((u) => (
                    <Tr key={u.id} onClick={() => router.push(`/admin-users/${u.id}`)}>
                      <Td className="font-medium">
                        {u.first_name} {u.last_name}
                      </Td>
                      <Td className="text-sm text-gray-500">{u.email || "—"}</Td>
                      <Td>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                            ROLE_COLORS[u.role] || "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {u.role.replace(/_/g, " ")}
                        </span>
                      </Td>
                      <Td>
                        <Badge status={u.is_active ? "active" : "retired"} />
                      </Td>
                      <Td className="text-sm text-gray-500">
                        {formatDate(u.created_at)}
                      </Td>
                      <Td>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setRoleModal(u);
                              setNewRole(u.role);
                            }}
                            className="p-1 text-gray-400 hover:text-primary-500"
                            title="Change role"
                          >
                            <Shield className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleToggleActive(u)}
                            className={`text-xs px-2 py-1 rounded ${
                              u.is_active
                                ? "text-red-600 hover:bg-red-50"
                                : "text-green-600 hover:bg-green-50"
                            }`}
                          >
                            {u.is_active ? "Deactivate" : "Activate"}
                          </button>
                        </div>
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
        isOpen={!!roleModal}
        onClose={() => setRoleModal(null)}
        title="Change Admin Role"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Changing role for{" "}
            <strong>
              {roleModal?.first_name} {roleModal?.last_name}
            </strong>{" "}
            ({roleModal?.email})
          </p>
          <Select
            label="New Role"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            options={ADMIN_ROLES}
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setRoleModal(null)}>
              Cancel
            </Button>
            <Button onClick={handleChangeRole} loading={changeRoleMutation.isPending}>
              Update Role
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
