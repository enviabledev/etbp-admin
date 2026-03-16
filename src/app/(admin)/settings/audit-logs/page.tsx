"use client";

import { useState } from "react";
import Header from "@/components/layout/Header";
import Breadcrumb from "@/components/ui/Breadcrumb";
import Card from "@/components/ui/Card";
import Pagination from "@/components/ui/Pagination";
import EmptyState from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { Table, Thead, Tbody, Th, Tr, Td } from "@/components/ui/Table";
import { useAuditLogs } from "@/hooks/queries/useSettings";
import { formatDateTime } from "@/lib/utils";
import { ScrollText, Search } from "lucide-react";

export default function AuditLogsPage() {
  const [action, setAction] = useState("");
  const [resourceType, setResourceType] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useAuditLogs({
    action: action || undefined,
    resource_type: resourceType || undefined,
    page, page_size: 30,
  });

  const logs = data?.items || [];
  const totalPages = data ? Math.ceil(data.total / 30) : 0;

  return (
    <>
      <Breadcrumb items={[{ label: "Settings", href: "/settings" }, { label: "Audit Logs" }]} />
      <Header title="Audit Logs" subtitle="Track all system actions" />

      <Card className="mb-6">
        <div className="p-4 flex gap-4">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Filter by action..." value={action}
              onChange={(e) => { setAction(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <input type="text" placeholder="Filter by resource type..." value={resourceType}
            onChange={(e) => { setResourceType(e.target.value); setPage(1); }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm max-w-xs" />
        </div>
      </Card>

      <Card>
        {isLoading ? <TableSkeleton rows={8} cols={5} /> : logs.length === 0 ? (
          <EmptyState icon={ScrollText} title="No audit logs" description="Actions will appear here as they happen" />
        ) : (
          <>
            <Table>
              <Thead><tr><Th>Action</Th><Th>Resource</Th><Th>Resource ID</Th><Th>User</Th><Th>Timestamp</Th></tr></Thead>
              <Tbody>
                {logs.map((l) => (
                  <Tr key={l.id}>
                    <Td><span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{l.action}</span></Td>
                    <Td>{l.resource_type}</Td>
                    <Td className="text-xs font-mono text-gray-500">{l.resource_id?.slice(0, 8) || "—"}</Td>
                    <Td className="text-xs text-gray-500">{l.user_id?.slice(0, 8) || "system"}</Td>
                    <Td className="text-xs text-gray-500">{formatDateTime(l.created_at)}</Td>
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
