"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Card from "@/components/ui/Card";
import Pagination from "@/components/ui/Pagination";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Table, Thead, Tbody, Th, Tr, Td } from "@/components/ui/Table";
import { useCustomers } from "@/hooks/queries/useCustomers";
import { formatDate } from "@/lib/utils";
import { Search } from "lucide-react";

export default function CustomersPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useCustomers({
    search: search || undefined,
    page,
    page_size: 20,
  });

  const customers = data?.items || [];
  const totalPages = data ? Math.ceil(data.total / 20) : 0;

  return (
    <>
      <Header title="Customers" subtitle={`${data?.total || 0} customers`} />

      <Card className="mb-6">
        <div className="p-4 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search name, email, phone..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </Card>

      <Card>
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <>
            <Table>
              <Thead>
                <tr>
                  <Th>Name</Th>
                  <Th>Email</Th>
                  <Th>Phone</Th>
                  <Th>Total Bookings</Th>
                  <Th>Last Booking</Th>
                  <Th>Registered</Th>
                </tr>
              </Thead>
              <Tbody>
                {customers.length === 0 ? (
                  <Tr>
                    <Td colSpan={6} className="text-center py-8 text-gray-500">
                      No customers found
                    </Td>
                  </Tr>
                ) : (
                  customers.map((c) => (
                    <Tr key={c.id} onClick={() => router.push(`/customers/${c.id}`)}>
                      <Td className="font-medium">
                        {c.first_name} {c.last_name}
                        {(c as unknown as Record<string, unknown>).has_logged_in === false && (
                          <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700">Terminal only</span>
                        )}
                      </Td>
                      <Td className="text-sm text-gray-500">{c.email || "—"}</Td>
                      <Td className="text-sm text-gray-500">{c.phone || "—"}</Td>
                      <Td>{c.total_bookings}</Td>
                      <Td className="text-sm text-gray-500">
                        {c.last_booking_date ? formatDate(c.last_booking_date) : "—"}
                      </Td>
                      <Td className="text-sm text-gray-500">
                        {formatDate(c.created_at)}
                      </Td>
                    </Tr>
                  ))
                )}
              </Tbody>
            </Table>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </Card>
    </>
  );
}
