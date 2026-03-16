"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Pagination from "@/components/ui/Pagination";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Table, Thead, Tbody, Th, Tr, Td } from "@/components/ui/Table";
import VehicleForm from "@/components/forms/VehicleForm";
import { useVehicles, useCreateVehicle } from "@/hooks/queries/useVehicles";
import { useToast } from "@/components/ui/Toast";
import { Plus, Search, Settings } from "lucide-react";

export default function FleetPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const { toast } = useToast();

  const { data, isLoading } = useVehicles({ search: search || undefined, status: statusFilter || undefined, page, page_size: 20 });
  const createMutation = useCreateVehicle();

  const vehicles = data?.items || [];
  const totalPages = data ? Math.ceil(data.total / 20) : 0;

  return (
    <>
      <Header title="Fleet" subtitle={`${data?.total || 0} vehicles`}
        actions={
          <div className="flex gap-3">
            <Link href="/fleet/types">
              <Button variant="secondary"><Settings className="h-4 w-4 mr-2" /> Vehicle Types</Button>
            </Link>
            <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-2" /> Add Vehicle</Button>
          </div>
        }
      />

      <Card className="mb-6">
        <div className="p-4 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search plate, make, model..." value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white">
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="maintenance">Maintenance</option>
            <option value="retired">Retired</option>
          </select>
        </div>
      </Card>

      <Card>
        {isLoading ? <LoadingSpinner /> : (
          <>
            <Table>
              <Thead>
                <tr><Th>Plate</Th><Th>Type</Th><Th>Make / Model</Th><Th>Year</Th><Th>Color</Th><Th>Status</Th></tr>
              </Thead>
              <Tbody>
                {vehicles.length === 0 ? (
                  <Tr><Td colSpan={6} className="text-center py-8 text-gray-500">No vehicles found</Td></Tr>
                ) : vehicles.map((v) => (
                  <Tr key={v.id} onClick={() => router.push(`/fleet/${v.id}`)}>
                    <Td className="font-mono font-medium">{v.plate_number}</Td>
                    <Td>{v.vehicle_type?.name || "—"}</Td>
                    <Td>{[v.make, v.model].filter(Boolean).join(" ") || "—"}</Td>
                    <Td>{v.year || "—"}</Td>
                    <Td>{v.color || "—"}</Td>
                    <Td><Badge status={v.status} /></Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </Card>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Add Vehicle" size="md">
        <VehicleForm onSubmit={(d) => createMutation.mutate(d, {
          onSuccess: () => { setShowCreate(false); toast("success", "Vehicle added"); },
          onError: () => toast("error", "Failed to add vehicle"),
        })} isLoading={createMutation.isPending} />
      </Modal>
    </>
  );
}
