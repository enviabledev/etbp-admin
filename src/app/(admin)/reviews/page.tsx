"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Star, Flag, MessageCircle, Eye } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { formatDateTime, cn } from "@/lib/utils";
import Button from "@/components/ui/Button";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function ReviewsPage() {
  const [page, setPage] = useState(1);
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-reviews", page, flaggedOnly],
    queryFn: async () => {
      const { data } = await api.get("/api/admin/reviews", {
        params: { page, page_size: 20, flagged_only: flaggedOnly || undefined },
      });
      return data;
    },
  });

  const reviews = data?.items || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
          <p className="text-sm text-gray-500 mt-1">{data?.total || 0} reviews</p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={flaggedOnly} onChange={e => setFlaggedOnly(e.target.checked)} className="rounded" />
          Flagged only
        </label>
      </div>

      {isLoading ? <LoadingSpinner /> : reviews.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border">
          <Star className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No reviews yet</h3>
          <p className="text-gray-500">Reviews will appear here after passengers rate their trips.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Date</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Customer</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Rating</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Comment</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {reviews.map((r: Record<string, unknown>) => (
                <tr key={r.id as string}>
                  <td className="px-5 py-4 text-sm text-gray-500">{formatDateTime(r.created_at as string)}</td>
                  <td className="px-5 py-4 text-sm font-medium">{r.reviewer as string}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} className={cn("h-3.5 w-3.5", s <= (r.overall_rating as number) ? "text-amber-400 fill-amber-400" : "text-gray-300")} />
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600 max-w-[200px] truncate">{(r.comment as string) || "\u2014"}</td>
                  <td className="px-5 py-4">
                    <div className="flex gap-1">
                      {r.is_flagged ? <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Flagged</span> : null}
                      {r.has_response ? <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Responded</span> : null}
                      {!r.is_flagged && !r.has_response ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Visible</span> : null}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <Link href={`/reviews/${r.id}`}>
                      <button className="p-1.5 rounded hover:bg-gray-100"><Eye className="h-4 w-4 text-gray-500" /></button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
