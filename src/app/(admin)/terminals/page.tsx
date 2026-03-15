"use client";

import { useState } from "react";
import Header from "@/components/layout/Header";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Pagination from "@/components/ui/Pagination";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Table, Thead, Tbody, Th, Tr, Td } from "@/components/ui/Table";
import TerminalForm from "@/components/forms/TerminalForm";
import { useTerminals, useCreateTerminal, useUpdateTerminal } from "@/hooks/queries/useTerminals";
import { useToast } from "@/components/ui/Toast";
import { Plus, Search, Pencil } from "lucide-react";
import type { Terminal } from "@/types";

export default function TerminalsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Terminal | null>(null);
  const { toast } = useToast();

  const { data, isLoading } = useTerminals({ search: search || undefined, page, page_size: 20 });
  const createMutation = useCreateTerminal();
  const updateMutation = useUpdateTerminal();

  const terminals = data?.items || [];
  const totalPages = data ? Math.ceil(data.total / 20) : 0;

  return (
    <>
      <Header title="Terminals" subtitle={`${data?.total || 0} terminals`}
        actions={<Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-2" /> New Terminal</Button>}
      />

      <Card className="mb-6">
        <div className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search terminals..." value={search}
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
                <tr><Th>Name</Th><Th>Code</Th><Th>City</Th><Th>State</Th><Th>Phone</Th><Th>Status</Th><Th>Actions</Th></tr>
              </Thead>
              <Tbody>
                {terminals.length === 0 ? (
                  <Tr><Td colSpan={7} className="text-center py-8 text-gray-500">No terminals found</Td></Tr>
                ) : terminals.map((t) => (
                  <Tr key={t.id}>
                    <Td className="font-medium text-gray-900">{t.name}</Td>
                    <Td><span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{t.code}</span></Td>
                    <Td>{t.city}</Td>
                    <Td>{t.state}</Td>
                    <Td>{t.phone || "—"}</Td>
                    <Td><Badge status={t.is_active ? "active" : "retired"} /></Td>
                    <Td>
                      <button onClick={() => setEditing(t)} className="p-1 text-gray-400 hover:text-primary-500">
                        <Pencil className="h-4 w-4" />
                      </button>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </Card>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Terminal" size="lg">
        <TerminalForm onSubmit={(d) => createMutation.mutate(d, {
          onSuccess: () => { setShowCreate(false); toast("success", "Terminal created"); },
          onError: () => toast("error", "Failed to create terminal"),
        })} isLoading={createMutation.isPending} />
      </Modal>

      <Modal isOpen={!!editing} onClose={() => setEditing(null)} title="Edit Terminal" size="lg">
        {editing && <TerminalForm terminal={editing} onSubmit={(d) => updateMutation.mutate({ id: editing.id, ...d }, {
          onSuccess: () => { setEditing(null); toast("success", "Terminal updated"); },
          onError: () => toast("error", "Failed to update terminal"),
        })} isLoading={updateMutation.isPending} />}
      </Modal>
    </>
  );
}
