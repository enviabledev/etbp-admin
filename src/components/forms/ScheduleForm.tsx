"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { useRoutes } from "@/hooks/queries/useRoutes";
import { useVehicleTypes } from "@/hooks/queries/useVehicles";

const schema = z.object({
  route_id: z.string().min(1, "Required"),
  vehicle_type_id: z.string().min(1, "Required"),
  departure_time: z.string().min(1, "Required"),
  recurrence: z.string().optional(),
  valid_from: z.string().optional(),
  valid_until: z.string().optional(),
  price_override: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  onSubmit: (data: Record<string, unknown>) => void;
  isLoading?: boolean;
}

export default function ScheduleForm({ onSubmit, isLoading }: Props) {
  const { data: routesData } = useRoutes({ page_size: 100 });
  const { data: vehicleTypes } = useVehicleTypes();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { recurrence: "daily" },
  });

  const handle = (data: FormData) => {
    const payload: Record<string, unknown> = {
      route_id: data.route_id,
      vehicle_type_id: data.vehicle_type_id,
      departure_time: data.departure_time,
    };
    if (data.recurrence) payload.recurrence = data.recurrence;
    if (data.valid_from) payload.valid_from = data.valid_from;
    if (data.valid_until) payload.valid_until = data.valid_until;
    if (data.price_override) payload.price_override = parseFloat(data.price_override);
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit(handle)} className="space-y-4">
      <Select
        label="Route" {...register("route_id")} error={errors.route_id?.message}
        placeholder="Select route..."
        options={(routesData?.items || []).map((r) => ({ value: r.id, label: `${r.name} (${r.code})` }))}
      />
      <Select
        label="Vehicle Type" {...register("vehicle_type_id")} error={errors.vehicle_type_id?.message}
        placeholder="Select vehicle type..."
        options={(vehicleTypes || []).map((v) => ({ value: v.id, label: `${v.name} (${v.seat_capacity} seats)` }))}
      />
      <div className="grid grid-cols-2 gap-4">
        <Input label="Departure Time" type="time" {...register("departure_time")} error={errors.departure_time?.message} />
        <Select
          label="Recurrence" {...register("recurrence")}
          options={[
            { value: "daily", label: "Daily" },
            { value: "mon,tue,wed,thu,fri", label: "Weekdays" },
            { value: "sat,sun", label: "Weekends" },
            { value: "mon,wed,fri", label: "Mon/Wed/Fri" },
            { value: "tue,thu,sat", label: "Tue/Thu/Sat" },
          ]}
        />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Input label="Valid From" type="date" {...register("valid_from")} />
        <Input label="Valid Until" type="date" {...register("valid_until")} />
        <Input label="Price Override (NGN)" type="number" {...register("price_override")} placeholder="Leave blank for base price" />
      </div>
      <div className="flex justify-end pt-2">
        <Button type="submit" loading={isLoading}>Create Schedule</Button>
      </div>
    </form>
  );
}
