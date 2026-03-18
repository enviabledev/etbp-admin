"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Eye } from "lucide-react";
import api from "@/lib/api";
import { formatDate, cn } from "@/lib/utils";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

const STATUS_COLORS: Record<string, string> = { reported: "bg-yellow-100 text-yellow-700", investigating: "bg-blue-100 text-blue-700", found: "bg-green-100 text-green-700", returned: "bg-green-100 text-green-700", unclaimed: "bg-gray-100 text-gray-600", closed: "bg-gray-100 text-gray-600" };

export default function LostFoundPage() {
  const [statusFilter, setStatusFilter] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-lost-found", statusFilter],
    queryFn: async () => { const { data } = await api.get("/api/admin/lost-found", { params: { status: statusFilter || undefined } }); return data; },
  });
  const { data: stats } = useQuery({
    queryKey: ["admin-lost-found-stats"],
    queryFn: async () => { const { data } = await api.get("/api/admin/lost-found/stats"); return data; },
  });

  const reports = data?.items || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Lost & Found</h1>

      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border p-5"><p className="text-xs text-gray-500">Open Reports</p><p className="text-2xl font-bold text-yellow-600">{stats.open}</p></div>
          <div className="bg-white rounded-xl border p-5"><p className="text-xs text-gray-500">Found</p><p className="text-2xl font-bold text-green-600">{stats.found}</p></div>
          <div className="bg-white rounded-xl border p-5"><p className="text-xs text-gray-500">Returned</p><p className="text-2xl font-bold text-blue-600">{stats.returned}</p></div>
        </div>
      )}

      <div className="flex gap-2">
        {["", "reported", "investigating", "found", "returned", "closed"].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} className={cn("px-3 py-1.5 rounded-lg text-sm font-medium", statusFilter === s ? "bg-blue-50 text-blue-700" : "text-gray-500 hover:bg-gray-50")}>{s || "All"}</button>
        ))}
      </div>

      {isLoading ? <LoadingSpinner /> : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b"><tr>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Report #</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Type</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Category</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Description</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Reporter</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Date</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Status</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Actions</th>
            </tr></thead>
            <tbody className="divide-y">
              {reports.map((r: Record<string, string>) => (
                <tr key={r.id}>
                  <td className="px-5 py-4 text-sm font-mono">{r.report_number}</td>
                  <td className="px-5 py-4 text-sm capitalize">{r.report_type}</td>
                  <td className="px-5 py-4 text-sm capitalize">{r.item_category}</td>
                  <td className="px-5 py-4 text-sm text-gray-500 max-w-[200px] truncate">{r.item_description}</td>
                  <td className="px-5 py-4 text-sm">{r.reporter}</td>
                  <td className="px-5 py-4 text-sm text-gray-500">{formatDate(r.date_lost_found)}</td>
                  <td className="px-5 py-4"><span className={cn("text-xs px-2 py-0.5 rounded-full font-medium capitalize", STATUS_COLORS[r.status] || "")}>{r.status}</span></td>
                  <td className="px-5 py-4"><Link href={`/lost-found/${r.id}`}><button className="p-1.5 rounded hover:bg-gray-100"><Eye className="h-4 w-4 text-gray-500" /></button></Link></td>
                </tr>
              ))}
              {reports.length === 0 && <tr><td colSpan={8} className="text-center py-12 text-gray-400">No reports</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
