"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { useAllTerminals } from "@/hooks/queries/useTerminals";
import type { Route } from "@/types";

const routeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required").max(20),
  origin_terminal_id: z.string().min(1, "Origin terminal is required"),
  destination_terminal_id: z.string().min(1, "Destination terminal is required"),
  distance_km: z.string().optional(),
  estimated_duration_minutes: z.string().optional(),
  base_price: z.string().min(1, "Price is required"),
  luggage_policy: z.string().optional(),
});

type RouteFormData = z.infer<typeof routeSchema>;

interface RouteFormProps {
  route?: Route;
  onSubmit: (data: Record<string, unknown>) => void;
  isLoading?: boolean;
}

export default function RouteForm({ route, onSubmit, isLoading }: RouteFormProps) {
  const { data: terminalsData } = useAllTerminals();
  const terminals = terminalsData?.items || [];

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RouteFormData>({
    resolver: zodResolver(routeSchema),
    defaultValues: {
      name: route?.name || "",
      code: route?.code || "",
      origin_terminal_id: route?.origin_terminal?.id || "",
      destination_terminal_id: route?.destination_terminal?.id || "",
      distance_km: route?.distance_km?.toString() || "",
      estimated_duration_minutes: route?.estimated_duration_minutes?.toString() || "",
      base_price: route?.base_price?.toString() || "",
      luggage_policy: route?.luggage_policy || "",
    },
  });

  const handleFormSubmit = (data: RouteFormData) => {
    const payload: Record<string, unknown> = {
      name: data.name,
      code: data.code,
      origin_terminal_id: data.origin_terminal_id,
      destination_terminal_id: data.destination_terminal_id,
      base_price: parseFloat(data.base_price),
    };
    if (data.distance_km) payload.distance_km = parseFloat(data.distance_km);
    if (data.estimated_duration_minutes) payload.estimated_duration_minutes = parseInt(data.estimated_duration_minutes);
    if (data.luggage_policy) payload.luggage_policy = data.luggage_policy;
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Route Name" {...register("name")} error={errors.name?.message} placeholder="Lagos → Abuja" />
        <Input label="Route Code" {...register("code")} error={errors.code?.message} placeholder="LAG-ABJ" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Origin Terminal"
          {...register("origin_terminal_id")}
          error={errors.origin_terminal_id?.message}
          placeholder="Select origin..."
          options={terminals.map((t) => ({ value: t.id, label: `${t.name} (${t.code})` }))}
        />
        <Select
          label="Destination Terminal"
          {...register("destination_terminal_id")}
          error={errors.destination_terminal_id?.message}
          placeholder="Select destination..."
          options={terminals.map((t) => ({ value: t.id, label: `${t.name} (${t.code})` }))}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Input label="Distance (km)" type="number" {...register("distance_km")} error={errors.distance_km?.message} />
        <Input label="Duration (minutes)" type="number" {...register("estimated_duration_minutes")} error={errors.estimated_duration_minutes?.message} />
        <Input label="Base Price (NGN)" type="number" {...register("base_price")} error={errors.base_price?.message} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Luggage Policy</label>
        <textarea
          {...register("luggage_policy")}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          rows={3}
          placeholder="e.g. 1 main luggage (max 23kg) + 1 carry-on"
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" loading={isLoading}>
          {route ? "Update Route" : "Create Route"}
        </Button>
      </div>
    </form>
  );
}
