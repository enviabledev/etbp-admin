"use client";

import { useState } from "react";
import Header from "@/components/layout/Header";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Table, Thead, Tbody, Th, Tr, Td } from "@/components/ui/Table";
import ScheduleForm from "@/components/forms/ScheduleForm";
import Input from "@/components/ui/Input";
import { useSchedules, useCreateSchedule, useGenerateTrips } from "@/hooks/queries/useSchedules";
import { useToast } from "@/components/ui/Toast";
import { formatCurrency, formatTime } from "@/lib/utils";
import { Plus, Zap } from "lucide-react";
import type { Schedule } from "@/types";

export default function SchedulesPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [generating, setGenerating] = useState<Schedule | null>(null);
  const [genFrom, setGenFrom] = useState("");
  const [genTo, setGenTo] = useState("");
  const { toast } = useToast();

  const { data: schedules, isLoading } = useSchedules();
  const createMutation = useCreateSchedule();
  const generateMutation = useGenerateTrips();

  const handleGenerate = () => {
    if (!generating || !genFrom || !genTo) return;
    generateMutation.mutate(
      { schedule_id: generating.id, from_date: genFrom, to_date: genTo },
      {
        onSuccess: (result) => {
          setGenerating(null);
          toast("success", `Generated ${result.trips_created} trips (${result.trips_skipped} skipped)`);
        },
        onError: () => toast("error", "Failed to generate trips"),
      }
    );
  };

  return (
    <>
      <Header title="Schedules" subtitle={`${schedules?.length || 0} schedules`}
        actions={<Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-2" /> New Schedule</Button>}
      />

      <Card>
        {isLoading ? <LoadingSpinner /> : (
          <Table>
            <Thead>
              <tr><Th>Route</Th><Th>Vehicle Type</Th><Th>Departure</Th><Th>Recurrence</Th><Th>Price</Th><Th>Status</Th><Th>Actions</Th></tr>
            </Thead>
            <Tbody>
              {(!schedules || schedules.length === 0) ? (
                <Tr><Td colSpan={7} className="text-center py-8 text-gray-500">No schedules</Td></Tr>
              ) : schedules.map((s) => (
                <Tr key={s.id}>
                  <Td className="font-medium">{s.route?.name || s.route_id.slice(0, 8)}</Td>
                  <Td>{s.vehicle_type?.name || "—"}</Td>
                  <Td>{formatTime(s.departure_time)}</Td>
                  <Td><span className="text-xs bg-gray-100 px-2 py-1 rounded">{s.recurrence || "daily"}</span></Td>
                  <Td>{s.price_override ? formatCurrency(s.price_override) : "Base"}</Td>
                  <Td><Badge status={s.is_active ? "active" : "retired"} /></Td>
                  <Td>
                    <Button size="sm" variant="secondary" onClick={() => { setGenerating(s); setGenFrom(""); setGenTo(""); }}>
                      <Zap className="h-3 w-3 mr-1" /> Generate
                    </Button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Schedule" size="lg">
        <ScheduleForm onSubmit={(d) => createMutation.mutate(d, {
          onSuccess: () => { setShowCreate(false); toast("success", "Schedule created"); },
          onError: () => toast("error", "Failed to create schedule"),
        })} isLoading={createMutation.isPending} />
      </Modal>

      <Modal isOpen={!!generating} onClose={() => setGenerating(null)} title="Generate Trips" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Generate trips for <strong>{generating?.route?.name}</strong> at{" "}
            <strong>{generating ? formatTime(generating.departure_time) : ""}</strong>
          </p>
          <Input label="From Date" type="date" value={genFrom} onChange={(e) => setGenFrom(e.target.value)} />
          <Input label="To Date" type="date" value={genTo} onChange={(e) => setGenTo(e.target.value)} />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setGenerating(null)}>Cancel</Button>
            <Button onClick={handleGenerate} loading={generateMutation.isPending} disabled={!genFrom || !genTo}>
              Generate Trips
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
