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
import { useToast } from "@/components/ui/Toast";
import { formatDate, formatCurrency } from "@/lib/utils";
import { ArrowLeft, User, Mail, Phone } from "lucide-react";
import api from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface AgentDetail {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  total_bookings: number;
  total_revenue: number;
  bookings_this_month: number;
  recent_bookings: {
    id: string;
    reference: string;
    route_name: string;
    departure_date: string;
    status: string;
    total_amount: number;
  }[];
}

export default function AgentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: agent, isLoading } = useQuery<AgentDetail>({
    queryKey: ["admin-agent-detail", id],
    queryFn: async () => {
      const { data } = await api.get(`/api/admin/agents/${id}`);
      // Backend returns { user, stats, recent_bookings }
      const u = data.user || data;
      return {
        ...u,
        total_bookings: data.stats?.total_bookings ?? 0,
        total_revenue: data.stats?.total_revenue ?? 0,
        bookings_this_month: data.stats?.bookings_this_month ?? 0,
        recent_bookings: (data.recent_bookings || []).map((b: Record<string, unknown>) => ({
          ...b,
          id: b.id || b.reference,
          total_amount: b.amount ?? b.total_amount ?? 0,
        })),
      };
    },
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data } = await api.put(`/api/admin/agents/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-agent-detail", id] });
      qc.invalidateQueries({ queryKey: ["admin-agents"] });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async (activate: boolean) => {
      const endpoint = activate ? "activate" : "deactivate";
      const { data } = await api.put(`/api/admin/users/${id}/${endpoint}`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-agent-detail", id] });
      qc.invalidateQueries({ queryKey: ["admin-agents"] });
    },
  });

  const [editMode, setEditMode] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (agent) {
      setFirstName(agent.first_name || "");
      setLastName(agent.last_name || "");
      setEmail(agent.email || "");
      setPhone(agent.phone || "");
    }
  }, [agent]);

  if (isLoading || !agent) return <LoadingSpinner text="Loading agent..." />;

  const fullName = [agent.first_name, agent.last_name].filter(Boolean).join(" ") || "Unknown";

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
          toast("success", "Agent updated successfully");
          setEditMode(false);
        },
        onError: () => toast("error", "Failed to update agent"),
      }
    );
  };

  const handleToggleActive = () => {
    toggleActiveMutation.mutate(!agent.is_active, {
      onSuccess: () =>
        toast("success", agent.is_active ? "Agent deactivated" : "Agent activated"),
      onError: () => toast("error", "Failed to update status"),
    });
  };

  return (
    <>
      <Breadcrumb
        items={[{ label: "Agents", href: "/agents" }, { label: fullName }]}
      />
      <Header
        title={fullName}
        subtitle={agent.email || "No email"}
        actions={
          <Button variant="ghost" onClick={() => router.push("/agents")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT - Profile */}
        <div className="space-y-6">
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
                      <p className="text-sm text-gray-500">Agent</p>
                    </div>
                  </div>
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-700">{agent.email || "—"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-700">{agent.phone || "—"}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Status */}
          <Card>
            <CardBody className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Status</span>
                <Badge status={agent.is_active ? "active" : "retired"} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Registered</span>
                <span className="text-sm font-medium">{formatDate(agent.created_at)}</span>
              </div>
              <div className="pt-2">
                <Button
                  variant={agent.is_active ? "danger" : "primary"}
                  size="sm"
                  className="w-full"
                  onClick={handleToggleActive}
                  loading={toggleActiveMutation.isPending}
                >
                  {agent.is_active ? "Deactivate Agent" : "Activate Agent"}
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* RIGHT */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardBody className="text-center">
                <p className="text-2xl font-bold text-gray-900">{agent.total_bookings}</p>
                <p className="text-sm text-gray-500">Total Bookings</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(agent.total_revenue || 0)}
                </p>
                <p className="text-sm text-gray-500">Total Revenue</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="text-center">
                <p className="text-2xl font-bold text-gray-900">{agent.bookings_this_month || 0}</p>
                <p className="text-sm text-gray-500">Bookings This Month</p>
              </CardBody>
            </Card>
          </div>

          {/* Recent Bookings */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold">Recent Bookings</h3>
            </CardHeader>
            {agent.recent_bookings && agent.recent_bookings.length > 0 ? (
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
                  {agent.recent_bookings.map((b) => (
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
