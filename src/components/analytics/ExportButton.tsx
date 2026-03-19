"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import api from "@/lib/api";

interface ExportButtonProps {
  reportType: string;
  dateFrom: string;
  dateTo: string;
}

export default function ExportButton({ reportType, dateFrom, dateTo }: ExportButtonProps) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExport = async (format: "csv" | "xlsx") => {
    setExporting(true);
    setOpen(false);
    try {
      const res = await api.get("/api/admin/analytics/export", {
        params: { report_type: reportType, format, date_from: dateFrom, date_to: dateTo },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `${reportType}-${dateFrom}-to-${dateTo}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      // silent fail
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} disabled={exporting} className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">
        <Download className="h-4 w-4" /> {exporting ? "..." : "Export"}
      </button>
      {open && (
        <div className="absolute right-0 mt-1 bg-white border rounded-lg shadow-lg z-10 w-36">
          <button onClick={() => handleExport("csv")} className="block w-full px-4 py-2 text-sm text-left hover:bg-gray-50">CSV</button>
          <button onClick={() => handleExport("xlsx")} className="block w-full px-4 py-2 text-sm text-left hover:bg-gray-50">Excel</button>
        </div>
      )}
    </div>
  );
}
