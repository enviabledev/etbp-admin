"use client";

import { useState } from "react";
import Header from "@/components/layout/Header";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Table, Thead, Tbody, Th, Tr, Td } from "@/components/ui/Table";
import { useVehicleTypes, useCreateVehicleType } from "@/hooks/queries/useVehicles";
import { useToast } from "@/components/ui/Toast";
import { Plus, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function VehicleTypesPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("");
  const [description, setDescription] = useState("");
  const { toast } = useToast();

  const { data: types, isLoading } = useVehicleTypes();
  const createMutation = useCreateVehicleType();

  const handleCreate = () => {
    createMutation.mutate({ name, seat_capacity: parseInt(capacity), description: description || undefined }, {
      onSuccess: () => { setShowCreate(false); setName(""); setCapacity(""); setDescription(""); toast("success", "Vehicle type created"); },
      onError: () => toast("error", "Failed to create vehicle type"),
    });
  };

  return (
    <>
      <Header title="Vehicle Types" subtitle={`${types?.length || 0} types`}
        actions={
          <div className="flex gap-3">
            <Link href="/fleet"><Button variant="ghost"><ArrowLeft className="h-4 w-4 mr-2" /> Back to Fleet</Button></Link>
            <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-2" /> New Type</Button>
          </div>
        }
      />
      <Card>
        {isLoading ? <LoadingSpinner /> : (
          <Table>
            <Thead><tr><Th>Name</Th><Th>Capacity</Th><Th>Description</Th><Th>Amenities</Th></tr></Thead>
            <Tbody>
              {(!types || types.length === 0) ? (
                <Tr><Td colSpan={4} className="text-center py-8 text-gray-500">No vehicle types</Td></Tr>
              ) : types.map((t) => (
                <Tr key={t.id}>
                  <Td className="font-medium">{t.name}</Td>
                  <Td>{t.seat_capacity} seats</Td>
                  <Td className="text-gray-500 max-w-xs truncate">{t.description || "—"}</Td>
                  <Td>
                    <div className="flex flex-wrap gap-1">
                      {t.amenities && Object.entries(t.amenities).filter(([, v]) => v).map(([k]) => (
                        <span key={k} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{k.replace(/_/g, " ")}</span>
                      ))}
                    </div>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Vehicle Type" size="sm">
        <div className="space-y-4">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Executive Bus" />
          <Input label="Seat Capacity" type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="32" />
          <Input label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Luxury bus with WiFi" />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} loading={createMutation.isPending} disabled={!name || !capacity}>Create</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
