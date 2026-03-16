"use client";

import { useState } from "react";
import Header from "@/components/layout/Header";
import Breadcrumb from "@/components/ui/Breadcrumb";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Pagination from "@/components/ui/Pagination";
import EmptyState from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { Table, Thead, Tbody, Th, Tr, Td } from "@/components/ui/Table";
import { useSupportTickets, useResolveTicket } from "@/hooks/queries/useSettings";
import { useToast } from "@/components/ui/Toast";
import { formatDateTime } from "@/lib/utils";
import { HelpCircle, CheckCircle } from "lucide-react";

export default function SupportTicketsPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const { toast } = useToast();

  const { data, isLoading } = useSupportTickets({
    status: statusFilter || undefined,
    page, page_size: 20,
  });
  const resolveMutation = useResolveTicket();

  const tickets = data?.items || [];
  const totalPages = data ? Math.ceil(data.total / 20) : 0;

  return (
    <>
      <Breadcrumb items={[{ label: "Settings", href: "/settings" }, { label: "Support Tickets" }]} />
      <Header title="Support Tickets" subtitle={`${data?.total || 0} tickets`} />

      <Card className="mb-6">
        <div className="p-4">
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white">
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </Card>

      <Card>
        {isLoading ? <TableSkeleton /> : tickets.length === 0 ? (
          <EmptyState icon={HelpCircle} title="No support tickets" description="Customer support tickets will appear here" />
        ) : (
          <>
            <Table>
              <Thead><tr><Th>Subject</Th><Th>Category</Th><Th>Priority</Th><Th>Status</Th><Th>Created</Th><Th>Actions</Th></tr></Thead>
              <Tbody>
                {tickets.map((t) => (
                  <Tr key={t.id}>
                    <Td className="font-medium max-w-xs truncate">{t.subject}</Td>
                    <Td><span className="text-xs bg-gray-100 px-2 py-1 rounded">{t.category}</span></Td>
                    <Td><Badge status={t.priority === "urgent" ? "cancelled" : t.priority === "high" ? "delayed" : "scheduled"} /></Td>
                    <Td><Badge status={t.status === "open" ? "pending" : t.status === "resolved" ? "confirmed" : t.status} /></Td>
                    <Td className="text-xs text-gray-500">{formatDateTime(t.created_at)}</Td>
                    <Td>
                      {t.status !== "resolved" && t.status !== "closed" && (
                        <Button size="sm" variant="ghost" onClick={() => resolveMutation.mutate(t.id, {
                          onSuccess: () => toast("success", "Ticket resolved"),
                          onError: () => toast("error", "Failed to resolve"),
                        })} loading={resolveMutation.isPending}>
                          <CheckCircle className="h-3 w-3 mr-1" /> Resolve
                        </Button>
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
    </>
  );
}
