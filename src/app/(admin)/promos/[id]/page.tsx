"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import api from "@/lib/api";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Card, { CardBody, CardHeader } from "@/components/ui/Card";
import { Table, Thead, Tbody, Th, Tr, Td } from "@/components/ui/Table";
import Badge from "@/components/ui/Badge";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export default function PromoDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: promoData, isLoading: loadingPromo } = useQuery({
    queryKey: ["admin-promo", id],
    queryFn: async () => { const { data } = await api.get(`/api/admin/promos/${id}`); return data; },
    enabled: !!id,
  });

  const { data: usageData, isLoading: loadingUsage } = useQuery({
    queryKey: ["admin-promo-usage", id],
    queryFn: async () => { const { data } = await api.get(`/api/admin/promos/${id}/usage`); return data; },
    enabled: !!id,
  });

  if (loadingPromo) return <LoadingSpinner />;
  const promo = promoData?.promo || promoData;
  if (!promo) return <div className="text-center py-16 text-gray-500">Promo not found</div>;

  return (
    <div className="space-y-6">
      <Link href="/promos" className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600">
        <ArrowLeft className="h-4 w-4" /> Back to Promos
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{promo.code}</h1>
          <p className="text-sm text-gray-500 mt-1">{promo.description || "No description"}</p>
        </div>
        <Badge status={promo.is_active ? "active" : "retired"} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardBody>
          <p className="text-xs text-gray-500">Discount</p>
          <p className="text-xl font-bold">{promo.discount_type === "percentage" ? `${promo.discount_value}%` : formatCurrency(promo.discount_value)}</p>
        </CardBody></Card>
        <Card><CardBody>
          <p className="text-xs text-gray-500">Usage</p>
          <p className="text-xl font-bold">{promo.used_count}{promo.usage_limit ? `/${promo.usage_limit}` : ""}</p>
        </CardBody></Card>
        <Card><CardBody>
          <p className="text-xs text-gray-500">Total Discount Given</p>
          <p className="text-xl font-bold">{formatCurrency(usageData?.total_discount || 0)}</p>
        </CardBody></Card>
        <Card><CardBody>
          <p className="text-xs text-gray-500">Valid Until</p>
          <p className="text-sm font-medium">{promo.valid_until ? formatDateTime(promo.valid_until) : "No expiry"}</p>
        </CardBody></Card>
      </div>

      <Card>
        <CardHeader><h3 className="font-semibold">Usage History</h3></CardHeader>
        {loadingUsage ? <div className="p-8 text-center text-gray-400">Loading...</div> : (
          <Table>
            <Thead><tr><Th>User</Th><Th>Email</Th><Th>Discount</Th><Th>Date</Th></tr></Thead>
            <Tbody>
              {(usageData?.items || []).length === 0 ? (
                <Tr><Td colSpan={4} className="text-center text-gray-400 py-8">No usage yet</Td></Tr>
              ) : (usageData?.items || []).map((u: Record<string, string | number>) => (
                <Tr key={u.id}>
                  <Td className="font-medium">{u.user_name}</Td>
                  <Td className="text-sm text-gray-500">{u.user_email || "—"}</Td>
                  <Td className="font-medium">{formatCurrency(u.discount_applied as number)}</Td>
                  <Td className="text-sm text-gray-500">{formatDateTime(u.used_at as string)}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}
