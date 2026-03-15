import { cn, STATUS_COLORS } from "@/lib/utils";

interface BadgeProps {
  status: string;
  className?: string;
}

export default function Badge({ status, className }: BadgeProps) {
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
