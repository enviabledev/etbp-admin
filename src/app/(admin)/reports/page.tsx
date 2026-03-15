"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/Header";
import Card, { CardBody, CardHeader } from "@/components/ui/Card";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import RevenueChart from "@/components/dashboard/RevenueChart";
import BookingsTrendChart from "@/components/dashboard/BookingsTrendChart";
import OccupancyChart from "@/components/dashboard/OccupancyChart";
import { useRevenueData, useBookingTrends } from "@/hooks/queries/useDashboard";
import { formatCurrency } from "@/lib/utils";
import { Table, Thead, Tbody, Th, Tr, Td } from "@/components/ui/Table";
import { TrendingUp, BarChart3, PieChart, MapPin } from "lucide-react";
import api from "@/lib/api";

export default function ReportsPage() {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [groupBy, setGroupBy] = useState("day");

  const { data: revenueData, isLoading: revLoading } = useRevenueData(groupBy, fromDate || undefined, toDate || undefined);
  const { data: bookingTrends, isLoading: trendLoading } = useBookingTrends(groupBy, fromDate || undefined, toDate || undefined);

  const { data: revenueByRoute } = useQuery({
    queryKey: ["revenue-by-route", fromDate, toDate],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (fromDate) params.from_date = fromDate;
      if (toDate) params.to_date = toDate;
      const { data } = await api.get("/api/admin/reports/revenue-by-route", { params });
      return data as { route_name: string; route_code: string; revenue: number; booking_count: number }[];
    },
  });

  const { data: occupancyData } = useQuery({
    queryKey: ["occupancy", fromDate, toDate],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (fromDate) params.from_date = fromDate;
      if (toDate) params.to_date = toDate;
      const { data } = await api.get("/api/admin/reports/occupancy", { params });
      return data as { route_name: string; route_code: string; occupancy_percent: number; booked_seats: number; total_seats: number }[];
    },
  });

  const { data: paymentMethods } = useQuery({
    queryKey: ["payment-methods", fromDate, toDate],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (fromDate) params.from_date = fromDate;
      if (toDate) params.to_date = toDate;
      const { data } = await api.get("/api/admin/reports/payment-methods", { params });
      return data as { method: string; count: number; total_amount: number }[];
    },
  });

  return (
    <>
      <Header title="Reports" subtitle="Revenue, bookings, and occupancy analytics" />

      {/* Filters */}
      <Card className="mb-6">
        <div className="p-4 flex flex-wrap gap-4 items-end">
          <div><label className="block text-xs font-medium text-gray-500 mb-1">From</label>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1">To</label>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1">Group By</label>
            <select value={groupBy} onChange={(e) => setGroupBy(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white">
              <option value="day">Day</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Revenue + Booking Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary-500" /><h3 className="font-semibold">Revenue</h3></div>
          </CardHeader>
          <CardBody>
            {revLoading ? <LoadingSpinner /> : revenueData && revenueData.length > 0 ? (
              <RevenueChart data={revenueData} />
            ) : <p className="text-center text-gray-500 py-12">No data for this period</p>}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary-500" /><h3 className="font-semibold">Booking Trends</h3></div>
          </CardHeader>
          <CardBody>
            {trendLoading ? <LoadingSpinner /> : bookingTrends && bookingTrends.length > 0 ? (
              <BookingsTrendChart data={bookingTrends} />
            ) : <p className="text-center text-gray-500 py-12">No data for this period</p>}
          </CardBody>
        </Card>
      </div>

      {/* Occupancy */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2"><MapPin className="h-5 w-5 text-primary-500" /><h3 className="font-semibold">Seat Occupancy by Trip</h3></div>
          </CardHeader>
          <CardBody>
            {occupancyData && occupancyData.length > 0 ? (
              <OccupancyChart data={occupancyData} />
            ) : <p className="text-center text-gray-500 py-12">No occupancy data</p>}
          </CardBody>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2"><PieChart className="h-5 w-5 text-primary-500" /><h3 className="font-semibold">Payment Methods</h3></div>
          </CardHeader>
          <CardBody>
            {paymentMethods && paymentMethods.length > 0 ? (
              <div className="space-y-3">
                {paymentMethods.map((m) => {
                  const total = paymentMethods.reduce((s, x) => s + x.total_amount, 0);
                  const pct = total > 0 ? (m.total_amount / total * 100).toFixed(1) : "0";
                  return (
                    <div key={m.method} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{
                          backgroundColor: m.method === "card" ? "#0057FF" : m.method === "cash" ? "#16a34a" : m.method === "wallet" ? "#7c3aed" : "#d97706"
                        }} />
                        <span className="text-sm font-medium capitalize">{m.method.replace(/_/g, " ")}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{formatCurrency(m.total_amount)}</p>
                        <p className="text-xs text-gray-500">{m.count} transactions ({pct}%)</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : <p className="text-center text-gray-500 py-12">No payment data</p>}
          </CardBody>
        </Card>
      </div>

      {/* Revenue by Route Table */}
      <Card>
        <CardHeader><h3 className="font-semibold">Revenue by Route</h3></CardHeader>
        <Table>
          <Thead>
            <tr><Th>Route</Th><Th>Code</Th><Th>Revenue</Th><Th>Bookings</Th><Th>Avg per Booking</Th></tr>
          </Thead>
          <Tbody>
            {(!revenueByRoute || revenueByRoute.length === 0) ? (
              <Tr><Td colSpan={5} className="text-center py-8 text-gray-500">No data</Td></Tr>
            ) : revenueByRoute.map((r) => (
              <Tr key={r.route_code}>
                <Td className="font-medium">{r.route_name}</Td>
                <Td><span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{r.route_code}</span></Td>
                <Td className="font-medium">{formatCurrency(r.revenue)}</Td>
                <Td>{r.booking_count}</Td>
                <Td>{formatCurrency(r.booking_count > 0 ? r.revenue / r.booking_count : 0)}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Card>
    </>
  );
}
