"use client";

import { useState } from "react";
import Header from "@/components/layout/Header";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Pagination from "@/components/ui/Pagination";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Table, Thead, Tbody, Th, Tr, Td } from "@/components/ui/Table";
import { useDrivers } from "@/hooks/queries/useDrivers";
import { formatDate } from "@/lib/utils";
import { Search, Star } from "lucide-react";

export default function DriversPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [availFilter, setAvailFilter] = useState<string>("");

  const { data, isLoading } = useDrivers({
    search: search || undefined,
    is_available: availFilter === "" ? undefined : availFilter === "true",
    page, page_size: 20,
  });

  const drivers = data?.items || [];
  const totalPages = data ? Math.ceil(data.total / 20) : 0;

  return (
    <>
      <Header title="Drivers" subtitle={`${data?.total || 0} drivers`} />

      <Card className="mb-6">
        <div className="p-4 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search name, license..." value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <select value={availFilter} onChange={(e) => { setAvailFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white">
            <option value="">All</option>
            <option value="true">Available</option>
            <option value="false">Unavailable</option>
          </select>
        </div>
      </Card>

      <Card>
        {isLoading ? <LoadingSpinner /> : (
          <>
            <Table>
              <Thead>
                <tr><Th>Name</Th><Th>License</Th><Th>Expiry</Th><Th>Rating</Th><Th>Trips</Th><Th>Terminal</Th><Th>Available</Th></tr>
              </Thead>
              <Tbody>
                {drivers.length === 0 ? (
                  <Tr><Td colSpan={7} className="text-center py-8 text-gray-500">No drivers found</Td></Tr>
                ) : drivers.map((d) => (
                  <Tr key={d.id}>
                    <Td className="font-medium">{d.user?.first_name} {d.user?.last_name}</Td>
                    <Td className="font-mono text-xs">{d.license_number}</Td>
                    <Td>{formatDate(d.license_expiry)}</Td>
                    <Td>
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                        {d.rating_avg.toFixed(1)}
                      </span>
                    </Td>
                    <Td>{d.total_trips}</Td>
                    <Td>{d.assigned_terminal?.name || "—"}</Td>
                    <Td><Badge status={d.is_available ? "active" : "maintenance"} /></Td>
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
