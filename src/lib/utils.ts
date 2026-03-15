import { format, parseISO, formatDistanceToNow } from "date-fns";

export function formatCurrency(amount: number, currency = "NGN"): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  return format(parseISO(dateStr), "dd MMM yyyy");
}

export function formatDateTime(dateStr: string): string {
  return format(parseISO(dateStr), "dd MMM yyyy, HH:mm");
}

export function formatTime(timeStr: string): string {
  // Handle "HH:mm:ss" or "HH:mm" format
  const parts = timeStr.split(":");
  const h = parseInt(parts[0]);
  const m = parts[1];
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

export function timeAgo(dateStr: string): string {
  return formatDistanceToNow(parseISO(dateStr), { addSuffix: true });
}

export function cn(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  cancelled: "bg-red-100 text-red-800",
  expired: "bg-gray-100 text-gray-600",
  checked_in: "bg-blue-100 text-blue-800",
  completed: "bg-purple-100 text-purple-800",
  no_show: "bg-orange-100 text-orange-800",
  scheduled: "bg-blue-100 text-blue-800",
  boarding: "bg-teal-100 text-teal-800",
  departed: "bg-indigo-100 text-indigo-800",
  en_route: "bg-cyan-100 text-cyan-800",
  arrived: "bg-green-100 text-green-800",
  delayed: "bg-amber-100 text-amber-800",
  active: "bg-green-100 text-green-800",
  maintenance: "bg-yellow-100 text-yellow-800",
  retired: "bg-gray-100 text-gray-600",
};
