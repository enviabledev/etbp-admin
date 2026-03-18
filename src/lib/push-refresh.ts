import type { QueryClient } from "@tanstack/react-query";

export function handlePushRefresh(queryClient: QueryClient, dataType: string) {
  switch (dataType) {
    case "booking_confirmed":
    case "booking_cancelled":
      queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      break;
    case "trip_status_changed":
      queryClient.invalidateQueries({ queryKey: ["admin-trips"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      break;
    case "maintenance_overdue":
    case "document_expiring":
      queryClient.invalidateQueries({ queryKey: ["admin-maintenance"] });
      queryClient.invalidateQueries({ queryKey: ["admin-maintenance-stats"] });
      break;
    case "new_review":
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      break;
    default:
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      break;
  }
}
