"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

interface AddWidgetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SOURCES: Record<string, string> = {
  revenue: "Revenue This Month",
  bookings: "Bookings Today",
  occupancy: "Occupancy Rate",
  customers: "Total Customers",
  satisfaction: "Customer Satisfaction",
  driver_performance: "Driver Performance",
};

export default function AddWidgetModal({ isOpen, onClose }: AddWidgetModalProps) {
  const [widgetType, setWidgetType] = useState("stat_card");
  const [dataSource, setDataSource] = useState("revenue");
  const [title, setTitle] = useState("Revenue This Month");
  const { toast } = useToast();
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      await api.post("/api/admin/analytics/dashboard/widgets", {
        widget_type: widgetType, data_source: dataSource, title,
        position: { x: 0, y: 100, w: widgetType === "stat_card" ? 3 : 6, h: widgetType === "stat_card" ? 2 : 4 },
      });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["dashboard-widgets"] }); onClose(); toast("success", "Widget added"); },
    onError: () => toast("error", "Failed to add widget"),
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Widget">
      <div className="space-y-4">
        <Select label="Type" value={widgetType} onChange={e => setWidgetType(e.target.value)} options={[
          { value: "stat_card", label: "Stat Card" },
          { value: "line_chart", label: "Line Chart" },
          { value: "bar_chart", label: "Bar Chart" },
          { value: "pie_chart", label: "Pie Chart" },
        ]} />
        <Select label="Data Source" value={dataSource} onChange={e => { setDataSource(e.target.value); setTitle(SOURCES[e.target.value] || e.target.value); }} options={Object.entries(SOURCES).map(([v, l]) => ({ value: v, label: l }))} />
        <Input label="Title" value={title} onChange={e => setTitle(e.target.value)} />
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} loading={mutation.isPending} disabled={!title}>Add</Button>
        </div>
      </div>
    </Modal>
  );
}
