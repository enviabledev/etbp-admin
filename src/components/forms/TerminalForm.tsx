"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import type { Terminal } from "@/types";

const schema = z.object({
  name: z.string().min(1, "Required"),
  code: z.string().min(1, "Required").max(20),
  city: z.string().min(1, "Required"),
  state: z.string().min(1, "Required"),
  country: z.string().min(1),
  address: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  phone: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  terminal?: Terminal;
  onSubmit: (data: Record<string, unknown>) => void;
  isLoading?: boolean;
}

export default function TerminalForm({ terminal, onSubmit, isLoading }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: terminal?.name || "",
      code: terminal?.code || "",
      city: terminal?.city || "",
      state: terminal?.state || "",
      country: terminal?.country || "Nigeria",
      address: terminal?.address || "",
      latitude: terminal?.latitude?.toString() || "",
      longitude: terminal?.longitude?.toString() || "",
      phone: terminal?.phone || "",
    },
  });

  const handle = (data: FormData) => {
    const payload: Record<string, unknown> = { ...data };
    if (data.latitude) payload.latitude = parseFloat(data.latitude);
    else delete payload.latitude;
    if (data.longitude) payload.longitude = parseFloat(data.longitude);
    else delete payload.longitude;
    if (!data.address) delete payload.address;
    if (!data.phone) delete payload.phone;
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit(handle)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Terminal Name" {...register("name")} error={errors.name?.message} />
        <Input label="Code" {...register("code")} error={errors.code?.message} placeholder="LAG" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Input label="City" {...register("city")} error={errors.city?.message} />
        <Input label="State" {...register("state")} error={errors.state?.message} />
        <Input label="Country" {...register("country")} />
      </div>
      <Input label="Address" {...register("address")} />
      <div className="grid grid-cols-3 gap-4">
        <Input label="Latitude" {...register("latitude")} type="number" step="any" />
        <Input label="Longitude" {...register("longitude")} type="number" step="any" />
        <Input label="Phone" {...register("phone")} />
      </div>
      <div className="flex justify-end pt-2">
        <Button type="submit" loading={isLoading}>{terminal ? "Update" : "Create"} Terminal</Button>
      </div>
    </form>
  );
}
