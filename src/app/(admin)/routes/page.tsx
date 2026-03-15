"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Pagination from "@/components/ui/Pagination";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Table, Thead, Tbody, Th, Tr, Td } from "@/components/ui/Table";
import RouteForm from "@/components/forms/RouteForm";
import { useRoutes, useCreateRoute } from "@/hooks/queries/useRoutes";
import { useToast } from "@/components/ui/Toast";
import { formatCurrency } from "@/lib/utils";
import { Plus, Search } from "lucide-react";

export default function RoutesPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const { data, isLoading } = useRoutes({ search: search || undefined, page, page_size: 20 });
  const createMutation = useCreateRoute();

  const routes = data?.items || [];
  const totalPages = data ? Math.ceil(data.total / 20) : 0;

  const handleCreate = (formData: Record<string, unknown>) => {
    createMutation.mutate(formData, {
      onSuccess: () => {
        setShowCreate(false);
        toast("success", "Route created successfully");
      },
      onError: (err: Error & { response?: { data?: { detail?: string } } }) => {
        toast("error", err?.response?.data?.detail || "Failed to create route");
      },
    });
  };

  return (
    <>
      <Header
        title="Routes"
        subtitle={`${data?.total || 0} routes`}
        actions={
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-2" /> New Route
          </Button>
        }
      />

      {/* Search */}
      <Card className="mb-6">
        <div className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search routes..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card>
        {isLoading ? (
          <LoadingSpinner text="Loading routes..." />
        ) : (
          <>
            <Table>
              <Thead>
                <tr>
                  <Th>Route</Th>
                  <Th>Code</Th>
                  <Th>Origin</Th>
                  <Th>Destination</Th>
                  <Th>Distance</Th>
                  <Th>Duration</Th>
                  <Th>Price</Th>
                  <Th>Status</Th>
                </tr>
              </Thead>
              <Tbody>
                {routes.length === 0 ? (
                  <Tr>
                    <Td className="text-center py-8 text-gray-500" colSpan={8}>
                      No routes found
                    </Td>
                  </Tr>
                ) : (
                  routes.map((route) => (
                    <Tr key={route.id} onClick={() => router.push(`/routes/${route.id}`)}>
                      <Td className="font-medium text-gray-900">{route.name}</Td>
                      <Td><span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{route.code}</span></Td>
                      <Td>{route.origin_terminal?.name || "—"}</Td>
                      <Td>{route.destination_terminal?.name || "—"}</Td>
                      <Td>{route.distance_km ? `${route.distance_km} km` : "—"}</Td>
                      <Td>{route.estimated_duration_minutes ? `${Math.floor(route.estimated_duration_minutes / 60)}h ${route.estimated_duration_minutes % 60}m` : "—"}</Td>
                      <Td className="font-medium">{formatCurrency(route.base_price)}</Td>
                      <Td><Badge status={route.is_active ? "active" : "retired"} /></Td>
                    </Tr>
                  ))
                )}
              </Tbody>
            </Table>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </Card>

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Route" size="lg">
        <RouteForm onSubmit={handleCreate} isLoading={createMutation.isPending} />
      </Modal>
    </>
  );
}
