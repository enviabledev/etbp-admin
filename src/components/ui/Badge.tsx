import { cn, STATUS_COLORS } from "@/lib/utils";

interface BadgeProps {
  status: string | null | undefined;
  className?: string;
}

export default function Badge({ status, className }: BadgeProps) {
  if (!status) {
    return (
      <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600", className)}>
        —
      </span>
    );
  }
  const colorClass = STATUS_COLORS[status] || "bg-gray-100 text-gray-700";
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize",
        colorClass,
        className
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
