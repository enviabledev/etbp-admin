"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Pagination from "@/components/ui/Pagination";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Table, Thead, Tbody, Th, Tr, Td } from "@/components/ui/Table";
import { useAdminBookings } from "@/hooks/queries/useBookings";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import Button from "@/components/ui/Button";
import { Search, Plus } from "lucide-react";

export default function BookingsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const router = useRouter();

  const { data, isLoading } = useAdminBookings({
    reference: search || undefined,
    status: statusFilter || undefined,
    from_date: fromDate || undefined,
    to_date: toDate || undefined,
    page, page_size: 20,
  });

  const bookings = data?.items || [];
  const totalPages = data ? Math.ceil(data.total / 20) : 0;

  return (
    <>
      <Header title="Bookings" subtitle={`${data?.total || 0} bookings`}
        actions={<Button onClick={() => router.push("/bookings/new")}><Plus className="h-4 w-4 mr-2" /> New Booking</Button>}
      />

      <Card className="mb-6">
        <div className="p-4 flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search reference..." value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white">
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="checked_in">Checked In</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="expired">Expired</option>
          </select>
          <input type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          <input type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); setPage(1); }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        </div>
      </Card>

      <Card>
        {isLoading ? <LoadingSpinner /> : (
          <>
            <Table>
              <Thead>
                <tr><Th>Reference</Th><Th>Status</Th><Th>Passengers</Th><Th>Amount</Th><Th>Contact</Th><Th>Created</Th></tr>
              </Thead>
              <Tbody>
                {bookings.length === 0 ? (
                  <Tr><Td colSpan={6} className="text-center py-8 text-gray-500">No bookings found</Td></Tr>
                ) : bookings.map((b) => (
                  <Tr key={b.id} onClick={() => router.push(`/bookings/${b.reference}`)}>
                    <Td className="font-mono font-medium text-primary-600">{b.reference}</Td>
                    <Td><Badge status={b.status} /></Td>
                    <Td>{b.passenger_count}</Td>
                    <Td className="font-medium">{formatCurrency(b.total_amount)}</Td>
                    <Td className="text-xs text-gray-500">{b.contact_phone || b.contact_email || "—"}</Td>
                    <Td className="text-xs text-gray-500">{formatDateTime(b.created_at)}</Td>
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
