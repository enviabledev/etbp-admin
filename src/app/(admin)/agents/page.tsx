"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Pagination from "@/components/ui/Pagination";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Table, Thead, Tbody, Th, Tr, Td } from "@/components/ui/Table";
import { useAgents, useCreateAgent } from "@/hooks/queries/useAgents";
import { useToast } from "@/components/ui/Toast";
import { formatDate } from "@/lib/utils";
import { Plus, Search } from "lucide-react";

export default function AgentsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();

  const { data, isLoading } = useAgents({
    search: search || undefined,
    page,
    page_size: 20,
  });
  const createMutation = useCreateAgent();

  const agents = data?.items || [];
  const totalPages = data ? Math.ceil(data.total / 20) : 0;

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setPassword("");
  };

  const handleCreate = () => {
    const payload: Record<string, unknown> = {
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
    };
    if (password) payload.password = password;

    createMutation.mutate(payload, {
      onSuccess: () => {
        setShowCreate(false);
        resetForm();
        toast("success", "Agent created successfully");
      },
      onError: () => toast("error", "Failed to create agent"),
    });
  };

  return (
    <>
      <Header
        title="Agents"
        subtitle={`${data?.total || 0} agents`}
        actions={
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-2" /> Create Agent
          </Button>
        }
      />

      <Card className="mb-6">
        <div className="p-4 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search name, email, phone..."
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
                  <Th>Phone</Th>
                  <Th>Bookings</Th>
                  <Th>Last Booking</Th>
                  <Th>Status</Th>
                </tr>
              </Thead>
              <Tbody>
                {agents.length === 0 ? (
                  <Tr>
                    <Td colSpan={6} className="text-center py-8 text-gray-500">
                      No agents found
                    </Td>
                  </Tr>
                ) : (
                  agents.map((a) => (
                    <Tr key={a.id} onClick={() => router.push(`/agents/${a.id}`)}>
                      <Td className="font-medium">
                        {a.first_name} {a.last_name}
                      </Td>
                      <Td className="text-sm text-gray-500">{a.email || "—"}</Td>
                      <Td className="text-sm text-gray-500">{a.phone || "—"}</Td>
                      <Td>{(a as unknown as Record<string, unknown>).booking_count as number ?? 0}</Td>
                      <Td className="text-sm text-gray-500">
                        {(a as unknown as Record<string, unknown>).last_booking_date
                          ? formatDate((a as unknown as Record<string, unknown>).last_booking_date as string)
                          : "—"}
                      </Td>
                      <Td>
                        <Badge status={a.is_active ? "active" : "retired"} />
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
        title="Create Agent"
        size="md"
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
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="agent@example.com"
          />
          <Input
            label="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+234..."
          />
          <Input
            label="Password (optional)"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Leave blank for auto-generated"
          />
          <div className="flex justify-end gap-3">
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
              disabled={!firstName || !lastName || !email || !phone}
            >
              Create Agent
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
