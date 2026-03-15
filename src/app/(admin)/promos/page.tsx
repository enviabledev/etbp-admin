"use client";

import { useState } from "react";
import Header from "@/components/layout/Header";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Pagination from "@/components/ui/Pagination";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Table, Thead, Tbody, Th, Tr, Td } from "@/components/ui/Table";
import { usePromos, useCreatePromo, useDeactivatePromo } from "@/hooks/queries/usePromos";
import { useToast } from "@/components/ui/Toast";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, Search, XCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const promoSchema = z.object({
  code: z.string().min(1, "Required").max(50),
  description: z.string().optional(),
  discount_type: z.enum(["percentage", "fixed"]),
  discount_value: z.string().min(1, "Required"),
  max_discount: z.string().optional(),
  min_booking_amount: z.string().optional(),
  usage_limit: z.string().optional(),
  valid_from: z.string().optional(),
  valid_until: z.string().optional(),
});

type PromoFormData = z.infer<typeof promoSchema>;

export default function PromosPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const { toast } = useToast();

  const { data, isLoading } = usePromos({ search: search || undefined, page, page_size: 20 });
  const createMutation = useCreatePromo();
  const deactivateMutation = useDeactivatePromo();

  const promos = data?.items || [];
  const totalPages = data ? Math.ceil(data.total / 20) : 0;

  const { register, handleSubmit, formState: { errors }, reset } = useForm<PromoFormData>({
    resolver: zodResolver(promoSchema),
    defaultValues: { discount_type: "percentage" },
  });

  const handleCreate = (formData: PromoFormData) => {
    const payload: Record<string, unknown> = {
      code: formData.code,
      discount_type: formData.discount_type,
      discount_value: parseFloat(formData.discount_value),
    };
    if (formData.description) payload.description = formData.description;
    if (formData.max_discount) payload.max_discount = parseFloat(formData.max_discount);
    if (formData.min_booking_amount) payload.min_booking_amount = parseFloat(formData.min_booking_amount);
    if (formData.usage_limit) payload.usage_limit = parseInt(formData.usage_limit);
    if (formData.valid_from) payload.valid_from = new Date(formData.valid_from).toISOString();
    if (formData.valid_until) payload.valid_until = new Date(formData.valid_until).toISOString();
    createMutation.mutate(payload, {
      onSuccess: () => { setShowCreate(false); reset(); toast("success", "Promo created"); },
      onError: () => toast("error", "Failed to create promo"),
    });
  };

  return (
    <>
      <Header title="Promo Codes" subtitle={`${data?.total || 0} promos`}
        actions={<Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-2" /> New Promo</Button>}
      />

      <Card className="mb-6">
        <div className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search promo codes..." value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
        </div>
      </Card>

      <Card>
        {isLoading ? <LoadingSpinner /> : (
          <>
            <Table>
              <Thead>
                <tr><Th>Code</Th><Th>Type</Th><Th>Value</Th><Th>Max</Th><Th>Usage</Th><Th>Valid Until</Th><Th>Status</Th><Th>Actions</Th></tr>
              </Thead>
              <Tbody>
                {promos.length === 0 ? (
                  <Tr><Td colSpan={8} className="text-center py-8 text-gray-500">No promos found</Td></Tr>
                ) : promos.map((p) => (
                  <Tr key={p.id}>
                    <Td className="font-mono font-bold text-primary-600">{p.code}</Td>
                    <Td className="capitalize">{p.discount_type}</Td>
                    <Td>{p.discount_type === "percentage" ? `${p.discount_value}%` : formatCurrency(p.discount_value)}</Td>
                    <Td>{p.max_discount ? formatCurrency(p.max_discount) : "—"}</Td>
                    <Td>{p.used_count}{p.usage_limit ? `/${p.usage_limit}` : ""}</Td>
                    <Td className="text-xs">{p.valid_until ? formatDate(p.valid_until) : "No expiry"}</Td>
                    <Td><Badge status={p.is_active ? "active" : "retired"} /></Td>
                    <Td>
                      {p.is_active && (
                        <button onClick={() => deactivateMutation.mutate(p.id, {
                          onSuccess: () => toast("success", "Promo deactivated"),
                        })} className="p-1 text-gray-400 hover:text-red-500" title="Deactivate">
                          <XCircle className="h-4 w-4" />
                        </button>
                      )}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </Card>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Promo Code" size="md">
        <form onSubmit={handleSubmit(handleCreate)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Code" {...register("code")} error={errors.code?.message} placeholder="SAVE20" />
            <Select label="Discount Type" {...register("discount_type")} options={[
              { value: "percentage", label: "Percentage" },
              { value: "fixed", label: "Fixed Amount" },
            ]} />
          </div>
          <Input label="Description" {...register("description")} placeholder="Save 20% on Lagos routes" />
          <div className="grid grid-cols-3 gap-4">
            <Input label="Discount Value" type="number" {...register("discount_value")} error={errors.discount_value?.message} />
            <Input label="Max Discount (NGN)" type="number" {...register("max_discount")} />
            <Input label="Min Booking (NGN)" type="number" {...register("min_booking_amount")} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input label="Usage Limit" type="number" {...register("usage_limit")} placeholder="Unlimited" />
            <Input label="Valid From" type="date" {...register("valid_from")} />
            <Input label="Valid Until" type="date" {...register("valid_until")} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button type="submit" loading={createMutation.isPending}>Create Promo</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
