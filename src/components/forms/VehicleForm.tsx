"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { useVehicleTypes } from "@/hooks/queries/useVehicles";

const schema = z.object({
  vehicle_type_id: z.string().min(1, "Required"),
  plate_number: z.string().min(1, "Required"),
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.string().optional(),
  color: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  onSubmit: (data: Record<string, unknown>) => void;
  isLoading?: boolean;
}

export default function VehicleForm({ onSubmit, isLoading }: Props) {
  const { data: vehicleTypes } = useVehicleTypes();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const handle = (data: FormData) => {
    const payload: Record<string, unknown> = {
      vehicle_type_id: data.vehicle_type_id,
      plate_number: data.plate_number,
    };
    if (data.make) payload.make = data.make;
    if (data.model) payload.model = data.model;
    if (data.year) payload.year = parseInt(data.year);
    if (data.color) payload.color = data.color;
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit(handle)} className="space-y-4">
      <Select
        label="Vehicle Type" {...register("vehicle_type_id")} error={errors.vehicle_type_id?.message}
        placeholder="Select type..."
        options={(vehicleTypes || []).map((v) => ({ value: v.id, label: `${v.name} (${v.seat_capacity} seats)` }))}
      />
      <Input label="Plate Number" {...register("plate_number")} error={errors.plate_number?.message} placeholder="LAG-123-AB" />
      <div className="grid grid-cols-2 gap-4">
        <Input label="Make" {...register("make")} placeholder="Toyota" />
        <Input label="Model" {...register("model")} placeholder="Hiace" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Year" type="number" {...register("year")} placeholder="2024" />
        <Input label="Color" {...register("color")} placeholder="White" />
      </div>
      <div className="flex justify-end pt-2">
        <Button type="submit" loading={isLoading}>Create Vehicle</Button>
      </div>
    </form>
  );
}
