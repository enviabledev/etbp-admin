"use client";

import Header from "@/components/layout/Header";
import KPICard from "@/components/dashboard/KPICard";
import RevenueChart from "@/components/dashboard/RevenueChart";
import BookingsTrendChart from "@/components/dashboard/BookingsTrendChart";
import Card, { CardBody, CardHeader } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useDashboardStats, useRevenueData, useBookingTrends, useRecentBookings } from "@/hooks/queries/useDashboard";
import { formatCurrency, timeAgo } from "@/lib/utils";
import { Users, Ticket, DollarSign, Bus, TrendingUp, BarChart3 } from "lucide-react";
import type { Booking } from "@/types";

export default function DashboardPage() {
  const { data: stats, isLoading } = useDashboardStats();
  const { data: revenueData } = useRevenueData("day");
  const { data: bookingTrends } = useBookingTrends("day");
  const { data: recentBookings } = useRecentBookings();

  if (isLoading || !stats) return <LoadingSpinner text="Loading dashboard..." />;

  return (
    <>
      <Header title="Dashboard" subtitle="Overview of your transport operations" />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard
          title="Today's Revenue"
          value={formatCurrency(stats.revenue.today)}
          subtitle={`${formatCurrency(stats.revenue.this_month)} this month`}
          icon={DollarSign}
          color="green"
        />
        <KPICard
          title="Today's Bookings"
          value={stats.bookings.today}
          subtitle={`${stats.bookings.this_month} this month`}
          icon={Ticket}
          color="blue"
        />
        <KPICard
          title="Active Trips"
          value={stats.trips.active}
          subtitle={`${stats.trips.occupancy_rate_today}% occupancy today`}
          icon={Bus}
          color="purple"
        />
        <KPICard
          title="Total Users"
          value={stats.users.total.toLocaleString()}
          subtitle={`${stats.users.new_last_30_days} new in 30 days`}
          icon={Users}
          color="amber"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary-500" />
              <h3 className="font-semibold text-gray-900">Revenue Trend</h3>
            </div>
          </CardHeader>
          <CardBody>
            {revenueData && revenueData.length > 0 ? (
              <RevenueChart data={revenueData} />
            ) : (
              <p className="text-sm text-gray-500 text-center py-12">No revenue data yet</p>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary-500" />
              <h3 className="font-semibold text-gray-900">Booking Trends</h3>
            </div>
          </CardHeader>
          <CardBody>
            {bookingTrends && bookingTrends.length > 0 ? (
              <BookingsTrendChart data={bookingTrends} />
            ) : (
              <p className="text-sm text-gray-500 text-center py-12">No booking data yet</p>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Recent Bookings */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-gray-900">Recent Bookings</h3>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Reference</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Passengers</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentBookings?.items?.map((booking: Booking) => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-mono text-sm font-medium text-primary-600">{booking.reference}</td>
                  <td className="px-6 py-3"><Badge status={booking.status} /></td>
                  <td className="px-6 py-3">{booking.passenger_count}</td>
                  <td className="px-6 py-3 font-medium">{formatCurrency(booking.total_amount)}</td>
                  <td className="px-6 py-3 text-gray-500">{timeAgo(booking.created_at)}</td>
                </tr>
              )) || (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No recent bookings</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
