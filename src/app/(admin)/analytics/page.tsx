"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, Star, Download } from "lucide-react";
import api from "@/lib/api";
import { formatCurrency, cn } from "@/lib/utils";
import Card, { CardBody, CardHeader } from "@/components/ui/Card";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

type Tab = "revenue" | "occupancy" | "customers" | "satisfaction" | "drivers" | "profitability";

export default function AnalyticsPage() {
  const [tab, setTab] = useState<Tab>("revenue");
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setDate(1); return d.toISOString().split("T")[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split("T")[0]);

  const { data: revenueData, isLoading: revLoading } = useQuery({
    queryKey: ["analytics-revenue", dateFrom, dateTo],
    queryFn: async () => { const { data } = await api.get("/api/admin/analytics/revenue", { params: { date_from: dateFrom, date_to: dateTo } }); return data; },
    enabled: tab === "revenue",
  });

  const { data: occData, isLoading: occLoading } = useQuery({
    queryKey: ["analytics-occupancy", dateFrom, dateTo],
    queryFn: async () => { const { data } = await api.get("/api/admin/analytics/occupancy", { params: { date_from: dateFrom, date_to: dateTo } }); return data; },
    enabled: tab === "occupancy",
  });

  const { data: custData, isLoading: custLoading } = useQuery({
    queryKey: ["analytics-customers", dateFrom, dateTo],
    queryFn: async () => { const { data } = await api.get("/api/admin/analytics/customers", { params: { date_from: dateFrom, date_to: dateTo } }); return data; },
    enabled: tab === "customers",
  });

  const { data: satData, isLoading: satLoading } = useQuery({
    queryKey: ["analytics-satisfaction", dateFrom, dateTo],
    queryFn: async () => { const { data } = await api.get("/api/admin/analytics/satisfaction", { params: { date_from: dateFrom, date_to: dateTo } }); return data; },
    enabled: tab === "satisfaction",
  });

  const { data: driverData, isLoading: driverLoading } = useQuery({
    queryKey: ["analytics-drivers", dateFrom, dateTo],
    queryFn: async () => { const { data } = await api.get("/api/admin/analytics/driver-performance", { params: { date_from: dateFrom, date_to: dateTo } }); return data; },
    enabled: tab === "drivers",
  });

  const { data: profitData, isLoading: profitLoading } = useQuery({
    queryKey: ["analytics-profitability", dateFrom, dateTo],
    queryFn: async () => { const { data } = await api.get("/api/admin/analytics/route-profitability", { params: { date_from: dateFrom, date_to: dateTo } }); return data; },
    enabled: tab === "profitability",
  });

  const handleExport = async (reportType: string, format: "csv" | "xlsx") => {
    try {
      const response = await api.get("/api/admin/analytics/export", {
        params: { report_type: reportType, format, date_from: dateFrom, date_to: dateTo },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `${reportType}-report.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch { /* ignore */ }
  };

  function ExportDropdown({ reportType }: { reportType: string }) {
    const [open, setOpen] = useState(false);
    return (
      <div className="relative">
        <button onClick={() => setOpen(!open)} className="flex items-center gap-1 px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50">
          <Download className="h-4 w-4" /> Export
        </button>
        {open && (
          <div className="absolute right-0 mt-1 bg-white border rounded-lg shadow-lg z-10 w-36">
            <button onClick={() => { handleExport(reportType, "csv"); setOpen(false); }} className="block w-full px-4 py-2 text-sm text-left hover:bg-gray-50">CSV</button>
            <button onClick={() => { handleExport(reportType, "xlsx"); setOpen(false); }} className="block w-full px-4 py-2 text-sm text-left hover:bg-gray-50">Excel</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <div className="flex gap-2">
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm" />
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm" />
          <ExportDropdown reportType={tab} />
        </div>
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {(["revenue", "occupancy", "customers", "satisfaction", "drivers", "profitability"] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn("px-4 py-2 rounded-md text-sm font-medium capitalize", tab === t ? "bg-white text-blue-600 shadow-sm" : "text-gray-500")}>{t}</button>
        ))}
      </div>

      {/* Revenue Tab */}
      {tab === "revenue" && (revLoading ? <LoadingSpinner /> : revenueData && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card><CardBody>
              <p className="text-xs text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold">{formatCurrency(revenueData.total_revenue)}</p>
              {revenueData.comparison?.change_percentage !== 0 && (
                <p className={cn("text-xs font-medium mt-1", revenueData.comparison.change_percentage > 0 ? "text-green-600" : "text-red-600")}>
                  {revenueData.comparison.change_percentage > 0 ? <TrendingUp className="h-3 w-3 inline mr-1" /> : <TrendingDown className="h-3 w-3 inline mr-1" />}
                  {revenueData.comparison.change_percentage > 0 ? "+" : ""}{revenueData.comparison.change_percentage}% vs previous period
                </p>
              )}
            </CardBody></Card>
            <Card><CardBody><p className="text-xs text-gray-500">Total Bookings</p><p className="text-2xl font-bold">{revenueData.total_bookings}</p></CardBody></Card>
            <Card><CardBody><p className="text-xs text-gray-500">Avg Ticket</p><p className="text-2xl font-bold">{formatCurrency(revenueData.avg_ticket)}</p></CardBody></Card>
            <Card><CardBody><p className="text-xs text-gray-500">Previous Period</p><p className="text-2xl font-bold">{formatCurrency(revenueData.comparison?.previous_period_revenue || 0)}</p></CardBody></Card>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card><CardHeader><h3 className="font-semibold">Revenue by Route</h3></CardHeader><CardBody>
              {(revenueData.by_route || []).map((r: Record<string, string | number>, i: number) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-700">{r.route_name}</span>
                  <span className="text-sm font-medium">{formatCurrency(r.revenue as number)}</span>
                </div>
              ))}
            </CardBody></Card>
            <Card><CardHeader><h3 className="font-semibold">By Payment Method</h3></CardHeader><CardBody>
              {(revenueData.by_payment_method || []).map((m: Record<string, string | number>, i: number) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-700 capitalize">{m.method}</span>
                  <div className="text-right">
                    <span className="text-sm font-medium">{formatCurrency(m.revenue as number)}</span>
                    <span className="text-xs text-gray-400 ml-2">({m.count} txns)</span>
                  </div>
                </div>
              ))}
            </CardBody></Card>
          </div>
        </div>
      ))}

      {/* Occupancy Tab */}
      {tab === "occupancy" && (occLoading ? <LoadingSpinner /> : occData && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <Card><CardBody><p className="text-xs text-gray-500">Overall Occupancy</p><p className="text-2xl font-bold">{occData.overall_occupancy_rate}%</p></CardBody></Card>
            <Card><CardBody><p className="text-xs text-gray-500">Busiest Day</p><p className="text-lg font-bold text-green-600">{occData.busiest?.label} ({occData.busiest?.occupancy_rate}%)</p></CardBody></Card>
            <Card><CardBody><p className="text-xs text-gray-500">Quietest Day</p><p className="text-lg font-bold text-red-600">{occData.quietest?.label} ({occData.quietest?.occupancy_rate}%)</p></CardBody></Card>
          </div>
          <Card><CardHeader><h3 className="font-semibold">Daily Occupancy</h3></CardHeader><CardBody>
            <div className="space-y-2">
              {(occData.data || []).slice(0, 20).map((d: Record<string, string | number>, i: number) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-20">{d.label}</span>
                  <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full", (d.occupancy_rate as number) > 80 ? "bg-green-500" : (d.occupancy_rate as number) > 50 ? "bg-yellow-500" : "bg-red-400")} style={{ width: `${d.occupancy_rate}%` }} />
                  </div>
                  <span className="text-xs font-medium w-12 text-right">{d.occupancy_rate}%</span>
                </div>
              ))}
            </div>
          </CardBody></Card>
        </div>
      ))}

      {/* Customers Tab */}
      {tab === "customers" && (custLoading ? <LoadingSpinner /> : custData && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <Card><CardBody><p className="text-xs text-gray-500">Total Customers</p><p className="text-2xl font-bold">{custData.total_customers?.toLocaleString()}</p></CardBody></Card>
            <Card><CardBody><p className="text-xs text-gray-500">New This Period</p><p className="text-2xl font-bold text-green-600">{custData.new_customers_period}</p></CardBody></Card>
            <Card><CardBody><p className="text-xs text-gray-500">Top Customers</p><p className="text-2xl font-bold">{(custData.top_customers || []).length}</p></CardBody></Card>
          </div>
          <Card><CardHeader><h3 className="font-semibold">Top Customers by Revenue</h3></CardHeader><CardBody>
            {(custData.top_customers || []).map((c: Record<string, string | number>, i: number) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div><span className="text-sm font-medium">{c.name}</span><span className="text-xs text-gray-400 ml-2">{c.bookings} bookings</span></div>
                <span className="text-sm font-bold">{formatCurrency(c.revenue as number)}</span>
              </div>
            ))}
          </CardBody></Card>
        </div>
      ))}

      {/* Satisfaction Tab */}
      {tab === "satisfaction" && (satLoading ? <LoadingSpinner /> : satData && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Card><CardBody>
              <p className="text-xs text-gray-500">Average Rating</p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-3xl font-bold">{satData.avg_overall_rating}</p>
                <div className="flex">{[1,2,3,4,5].map(s => <Star key={s} className={cn("h-5 w-5", s <= Math.round(satData.avg_overall_rating) ? "text-amber-400 fill-amber-400" : "text-gray-300")} />)}</div>
              </div>
              <p className="text-xs text-gray-400 mt-1">{satData.total_reviews} reviews</p>
            </CardBody></Card>
            <Card><CardHeader><h3 className="font-semibold">Rating Distribution</h3></CardHeader><CardBody>
              {(satData.rating_distribution || []).map((d: Record<string, number>) => (
                <div key={d.stars} className="flex items-center gap-2 mb-1">
                  <span className="text-xs w-8">{d.stars}★</span>
                  <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-amber-400 rounded-full" style={{ width: `${satData.total_reviews ? (d.count / satData.total_reviews * 100) : 0}%` }} /></div>
                  <span className="text-xs w-8 text-right">{d.count}</span>
                </div>
              ))}
            </CardBody></Card>
          </div>
        </div>
      ))}

      {/* Drivers Tab */}
      {tab === "drivers" && (driverLoading ? <LoadingSpinner /> : driverData && (
        <Card><CardHeader><h3 className="font-semibold">Driver Performance</h3></CardHeader><CardBody>
          <table className="w-full text-sm">
            <thead><tr className="border-b">
              <th className="text-left py-2 font-semibold text-gray-500">Driver</th>
              <th className="text-left py-2 font-semibold text-gray-500">Trips</th>
              <th className="text-left py-2 font-semibold text-gray-500">On-Time %</th>
              <th className="text-left py-2 font-semibold text-gray-500">Rating</th>
              <th className="text-left py-2 font-semibold text-gray-500">Reviews</th>
              <th className="text-left py-2 font-semibold text-gray-500">Incidents</th>
              <th className="text-left py-2 font-semibold text-gray-500">Score</th>
            </tr></thead>
            <tbody>
              {(driverData.drivers || []).map((d: Record<string, string | number>, i: number) => (
                <tr key={i} className="border-b border-gray-50">
                  <td className="py-2 font-medium">{d.driver_name}</td>
                  <td className="py-2">{d.total_trips}</td>
                  <td className="py-2"><span className={cn("font-medium", (d.on_time_rate as number) > 90 ? "text-green-600" : (d.on_time_rate as number) > 75 ? "text-yellow-600" : "text-red-600")}>{d.on_time_rate}%</span></td>
                  <td className="py-2">{d.avg_rating} ★</td>
                  <td className="py-2">{d.total_reviews}</td>
                  <td className="py-2">{d.incidents}</td>
                  <td className="py-2"><span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", (d.performance_score as number) >= 80 ? "bg-green-100 text-green-700" : (d.performance_score as number) >= 60 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700")}>{d.performance_score}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody></Card>
      ))}

      {/* Profitability Tab */}
      {tab === "profitability" && (profitLoading ? <LoadingSpinner /> : profitData && (
        <Card><CardHeader><h3 className="font-semibold">Route Profitability</h3></CardHeader><CardBody>
          <table className="w-full text-sm">
            <thead><tr className="border-b">
              <th className="text-left py-2 font-semibold text-gray-500">Route</th>
              <th className="text-left py-2 font-semibold text-gray-500">Trips</th>
              <th className="text-left py-2 font-semibold text-gray-500">Revenue</th>
              <th className="text-left py-2 font-semibold text-gray-500">Occupancy</th>
              <th className="text-left py-2 font-semibold text-gray-500">Est. Cost</th>
              <th className="text-left py-2 font-semibold text-gray-500">Profit</th>
              <th className="text-left py-2 font-semibold text-gray-500">Margin</th>
            </tr></thead>
            <tbody>
              {(profitData.routes || []).map((r: Record<string, string | number>, i: number) => (
                <tr key={i} className="border-b border-gray-50">
                  <td className="py-2 font-medium">{r.route_name}</td>
                  <td className="py-2">{r.total_trips}</td>
                  <td className="py-2">{formatCurrency(r.total_revenue as number)}</td>
                  <td className="py-2">{r.avg_occupancy}%</td>
                  <td className="py-2">{formatCurrency(r.estimated_cost as number)}</td>
                  <td className="py-2 font-medium">{formatCurrency(r.estimated_profit as number)}</td>
                  <td className="py-2"><span className={cn("font-medium", (r.profit_margin as number) > 20 ? "text-green-600" : (r.profit_margin as number) > 0 ? "text-yellow-600" : "text-red-600")}>{r.profit_margin}%</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody></Card>
      ))}
    </div>
  );
}
