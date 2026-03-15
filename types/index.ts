// ─── Auth ────────────────────────────────────────────
export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  role: "CUSTOMER" | "SERVICE_PROVIDER";
}

export interface AuthResponse {
  token: string;
}

export interface EmailVerifyRequest {
  email: string;
  code: string;
}

export interface ResetPasswordRequest {
  email: string;
  otp: string;
  newPassword: string;
}

export type UserRole = "CUSTOMER" | "SERVICE_PROVIDER" | "ADMIN";

export interface DecodedToken {
  sub: string; // email
  role: UserRole;
  exp: number;
  iat: number;
}

export interface UserMe {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

// ─── Services ────────────────────────────────────────
export interface PublicServiceCard {
  providerServiceId: number;
  providerId: number;
  providerName: string;
  providerProfileImage: string | null;
  serviceId: number;
  serviceTitle: string;
  categoryName: string;
  hourlyRate: number | null;
  fixedPrice: number | null;
  fixedPriceAvailable: boolean;
  description: string;
  location: string;
  city: string;
  district: string;
  rating: number | null;
  reviewCount: number;
  isAvailable: boolean;
}

export interface ServiceCategory {
  serviceId: number;
  title: string;
}

// ─── Provider ────────────────────────────────────────
export interface ProviderProfile {
  id: number;
  fullName: string;
  skill: string;
  location: string;
  description: string;
  experience: string;
  rating: number | null;
  profileImageUrl: string | null;
  isAvailable: boolean;
  services: ProviderServiceItem[];
}

export interface ProviderServiceItem {
  providerServiceId: number;
  serviceTitle: string;
  hourlyRate: number | null;
  fixedPrice: number | null;
  fixedPriceAvailable: boolean;
  isActive: boolean;
}

export interface ProviderDashboardSummary {
  totalBookings: number;
  pendingBookings: number;
  completedBookings: number;
  totalEarnings: number;
  activeServices: number;
}

export interface EarningSummary {
  totalEarnings: number;
  monthlyEarnings: number;
  weeklyEarnings: number;
}

// ─── Booking ─────────────────────────────────────────
export type BookingStatus =
  | "PENDING"
  | "ACCEPTED"
  | "IN_PROGRESS"
  | "PAYMENT_PENDING"
  | "COMPLETED"
  | "CANCELLED"
  | "REJECTED";

export interface BookingRequest {
  providerServiceId: number;
  scheduledAt: string;
  pricingType: "HOURLY" | "FIXED";
  description?: string;
  addressLine1?: string;
  city?: string;
  province?: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
}

export interface CustomerBooking {
  bookingId: number;
  serviceName: string;
  providerName: string;
  customerName: string;
  phone: string;
  providerPhone: string;
  address: string;
  city: string;
  status: BookingStatus;
  amount: number | null;
  scheduledAt: string;
  pricingType: string;
  description: string;
  rejectionReason: string | null;
  rejectedAt: string | null;
}

export interface ProviderBooking {
  bookingId: number;
  status: BookingStatus;
  providerServiceId: number;
  customerName: string;
  customerPhone: string;
  serviceTitle: string;
  description: string;
  scheduledAt: string;
  startedAt: string | null;
  paymentAmount: number | null;
  paymentType: string;
  hourlyRate: number | null;
  bookingAddress: string;
  bookingPhone: string;
  latitude: number | null;
  longitude: number | null;
  paymentStatus: string | null;
}

// ─── Wanted ──────────────────────────────────────────
export interface WantedPost {
  id: number;
  profession: string;
  description: string;
  requiredCount: number;
  location: string;
  currentJoined: number;
  status: string;
  applied: boolean;
  createdAt: string;
  customerName: string;
}

export interface WantedPostRequest {
  profession: string;
  description: string;
  requiredCount: number;
  location: string;
}

// ─── Reviews ─────────────────────────────────────────
export interface Review {
  id: number;
  rating: number;
  comment: string;
  customerName: string;
  createdAt: string;
}

export interface ReviewCreateRequest {
  bookingId: number;
  providerServiceId: number;
  rating: number;
  comment: string;
}

// ─── Customer Profile ────────────────────────────────
export interface CustomerProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  profileImageUrl: string | null;
}

export interface CustomerDashboardSummary {
  totalBookings: number;
  activeBookings: number;
  completedBookings: number;
}

// ─── Address ─────────────────────────────────────────
export interface Address {
  addressLine1: string;
  city: string;
  province: string;
  district: string;
}

export interface District {
  id: number;
  name: string;
}
