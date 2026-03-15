export interface User {
  id: string;
  email: string | null;
  phone: string | null;
  first_name: string | null;
  last_name: string | null;
  role: UserRole;
  avatar_url: string | null;
  date_of_birth: string | null;
  gender: string | null;
  email_verified: boolean;
  phone_verified: boolean;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
}

export type UserRole = "passenger" | "agent" | "driver" | "fleet_manager" | "admin" | "super_admin";

export interface Terminal {
  id: string;
  name: string;
  code: string;
  city: string;
  state: string;
  country: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  is_active: boolean;
  amenities: Record<string, unknown> | null;
  opening_time: string | null;
  closing_time: string | null;
}

export interface Route {
  id: string;
  name: string;
  code: string;
  origin_terminal: Terminal;
  destination_terminal: Terminal;
  origin_terminal_id?: string;
  destination_terminal_id?: string;
  distance_km: number | null;
  estimated_duration_minutes: number | null;
  base_price: number;
  currency: string;
  luggage_policy: string | null;
  is_active: boolean;
}

export interface RouteStop {
  id: string;
  terminal: Terminal;
  stop_order: number;
  duration_from_origin_minutes: number | null;
  price_from_origin: number | null;
  is_pickup_point: boolean;
  is_dropoff_point: boolean;
}

export interface RouteDetail extends Route {
  stops: RouteStop[];
}

export interface VehicleType {
  id: string;
  name: string;
  description: string | null;
  seat_capacity: number;
  seat_layout: Record<string, unknown> | null;
  amenities: Record<string, unknown> | null;
}

export interface Vehicle {
  id: string;
  vehicle_type: VehicleType;
  vehicle_type_id?: string;
  plate_number: string;
  make: string | null;
  model: string | null;
  year: number | null;
  color: string | null;
  status: "active" | "maintenance" | "retired";
  current_mileage: number | null;
  insurance_expiry: string | null;
}

export interface Schedule {
  id: string;
  route_id: string;
  vehicle_type_id: string;
  departure_time: string;
  recurrence: string | null;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  price_override: number | null;
  route?: Route;
  vehicle_type?: VehicleType;
}

export interface Trip {
  id: string;
  route_id: string;
  vehicle_id: string | null;
  driver_id: string | null;
  departure_date: string;
  departure_time: string;
  status: string;
  price: number;
  available_seats: number;
  total_seats: number;
  route?: Route;
  vehicle?: Vehicle;
}

export interface Booking {
  id: string;
  reference: string;
  user_id: string;
  trip_id: string;
  status: string;
  total_amount: number;
  currency: string;
  passenger_count: number;
  contact_email: string | null;
  contact_phone: string | null;
  special_requests: string | null;
  created_at: string;
  passengers?: BookingPassenger[];
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  cancellation_reason?: string | null;
  cancelled_at?: string | null;
  checked_in_at?: string | null;
}

export interface BookingPassenger {
  id: string;
  seat_id: string;
  first_name: string;
  last_name: string;
  gender: string | null;
  phone: string | null;
  is_primary: boolean;
  checked_in: boolean;
  qr_code_data: string | null;
}

export interface PromoCode {
  id: string;
  code: string;
  description: string | null;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  max_discount: number | null;
  min_booking_amount: number | null;
  usage_limit: number | null;
  used_count: number;
  per_user_limit: number | null;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
}

export interface DashboardStats {
  users: { total: number; new_last_30_days: number };
  bookings: { total: number; today: number; this_month: number; cancelled_last_30_days: number };
  revenue: { total: number; today: number; this_month: number };
  trips: { active: number; occupancy_rate_today: number };
  passengers_today: number;
}

export interface RevenueData {
  period: string;
  amount: number;
  count: number;
}

export interface BookingTrend {
  period: string;
  total: number;
  confirmed: number;
  cancelled: number;
  pending: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}
