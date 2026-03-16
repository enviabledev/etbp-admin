"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import Header from "@/components/layout/Header";
import Card, { CardHeader, CardBody } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Breadcrumb from "@/components/ui/Breadcrumb";
import Input from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { Table, Thead, Tbody, Th, Tr, Td } from "@/components/ui/Table";
import { Clock, Phone, MapPin } from "lucide-react";
import type { Terminal, Route } from "@/types";

export default function TerminalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<Partial<Terminal>>({});

  const { data: terminal, isLoading } = useQuery<Terminal>({
    queryKey: ["terminals", id],
    queryFn: async () => {
      const { data } = await api.get(`/api/admin/routes/terminals/${id}`);
      return data;
    },
  });

  const { data: routes } = useQuery<Route[]>({
    queryKey: ["terminal-routes", id],
    queryFn: async () => {
      const { data } = await api.get("/api/admin/routes", {
        params: { page_size: 100 },
      });
      const items = data.items || data;
      return (items as Route[]).filter(
        (r: Route) =>
          r.origin_terminal?.id === id || r.destination_terminal?.id === id
      );
    },
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<Terminal>) => {
      const { data } = await api.put(`/api/admin/routes/terminals/${id}`, updates);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["terminals"] });
      setIsEditing(false);
      toast("success", "Terminal updated");
    },
    onError: () => toast("error", "Failed to update terminal"),
  });

  if (isLoading) return <LoadingSpinner />;
  if (!terminal) return <div className="p-8 text-center text-gray-500">Terminal not found</div>;

  const startEditing = () => {
    setForm({
      name: terminal.name,
      code: terminal.code,
      city: terminal.city,
      state: terminal.state,
      country: terminal.country,
      address: terminal.address,
      phone: terminal.phone,
      latitude: terminal.latitude,
      longitude: terminal.longitude,
      opening_time: terminal.opening_time,
      closing_time: terminal.closing_time,
      is_active: terminal.is_active,
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    updateMutation.mutate(form);
  };

  return (
    <>
      <Breadcrumb items={[{ label: "Terminals", href: "/terminals" }, { label: terminal.name }]} />
      <Header
        title={terminal.name}
        subtitle={`${terminal.city}, ${terminal.state}`}
        actions={
          !isEditing ? (
            <Button onClick={startEditing}>Edit Terminal</Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setIsEditing(false)}>Cancel</Button>
              <Button onClick={handleSave} loading={updateMutation.isPending}>Save Changes</Button>
            </div>
          )
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>Terminal Information</CardHeader>
            <CardBody>
              {isEditing ? (
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Name" value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  <Input label="Code" value={form.code || ""} onChange={(e) => setForm({ ...form, code: e.target.value })} />
                  <Input label="City" value={form.city || ""} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                  <Input label="State" value={form.state || ""} onChange={(e) => setForm({ ...form, state: e.target.value })} />
                  <Input label="Country" value={form.country || ""} onChange={(e) => setForm({ ...form, country: e.target.value })} />
                  <Input label="Address" value={form.address || ""} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                  <Input label="Phone" value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  <Input label="Latitude" type="number" value={form.latitude?.toString() || ""} onChange={(e) => setForm({ ...form, latitude: parseFloat(e.target.value) || null })} />
                  <Input label="Longitude" type="number" value={form.longitude?.toString() || ""} onChange={(e) => setForm({ ...form, longitude: parseFloat(e.target.value) || null })} />
                  <Input label="Opening Time" type="time" value={form.opening_time || ""} onChange={(e) => setForm({ ...form, opening_time: e.target.value })} />
                  <Input label="Closing Time" type="time" value={form.closing_time || ""} onChange={(e) => setForm({ ...form, closing_time: e.target.value })} />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                  <div><span className="text-gray-500">Code</span><p className="font-mono font-medium mt-0.5">{terminal.code}</p></div>
                  <div><span className="text-gray-500">City</span><p className="font-medium mt-0.5">{terminal.city}</p></div>
                  <div><span className="text-gray-500">State</span><p className="font-medium mt-0.5">{terminal.state}</p></div>
                  <div><span className="text-gray-500">Country</span><p className="font-medium mt-0.5">{terminal.country}</p></div>
                  <div><span className="text-gray-500">Address</span><p className="font-medium mt-0.5">{terminal.address || "—"}</p></div>
                  <div><span className="text-gray-500">Phone</span><p className="font-medium mt-0.5">{terminal.phone || "—"}</p></div>
                  {terminal.latitude && (
                    <div><span className="text-gray-500">Coordinates</span><p className="font-medium mt-0.5">{terminal.latitude}, {terminal.longitude}</p></div>
                  )}
                  <div><span className="text-gray-500">Hours</span><p className="font-medium mt-0.5">{terminal.opening_time || "—"} - {terminal.closing_time || "—"}</p></div>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Routes */}
          <Card>
            <CardHeader>Routes ({routes?.length || 0})</CardHeader>
            <CardBody>
              {!routes || routes.length === 0 ? (
                <p className="text-sm text-gray-500 py-4 text-center">No routes use this terminal</p>
              ) : (
                <Table>
                  <Thead>
                    <tr><Th>Route</Th><Th>Origin</Th><Th>Destination</Th><Th>Status</Th></tr>
                  </Thead>
                  <Tbody>
                    {routes.map((r) => (
                      <Tr key={r.id} className="cursor-pointer hover:bg-gray-50" onClick={() => router.push(`/routes/${r.id}`)}>
                        <Td className="font-medium">{r.name}</Td>
                        <Td>{r.origin_terminal?.city}</Td>
                        <Td>{r.destination_terminal?.city}</Td>
                        <Td><Badge status={r.is_active ? "active" : "retired"} /></Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Sidebar */}
        <div>
          <Card>
            <CardBody>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Status</span>
                  <Badge status={terminal.is_active ? "active" : "retired"} />
                </div>
                {terminal.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span>{terminal.phone}</span>
                  </div>
                )}
                {terminal.opening_time && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span>{terminal.opening_time} - {terminal.closing_time}</span>
                  </div>
                )}
                {terminal.latitude && terminal.longitude && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span>{terminal.latitude?.toFixed(4)}, {terminal.longitude?.toFixed(4)}</span>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
