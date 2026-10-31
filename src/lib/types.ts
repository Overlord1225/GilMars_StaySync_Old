import type { Enums, Tables } from "./database.types";

export type UserRole = Enums<"user_role">;
export type ReservationStatus = Enums<"reservation_status">;
export type ReservationSource = Enums<"reservation_source">;
export type InquiryCategory = Enums<"inquiry_category">;
export type InquiryStatus = Enums<"inquiry_status">;
export type CategorySource = Enums<"category_source">;

export type Profile = Tables<"profiles">;
export type Unit = Tables<"units">;
export type Reservation = Tables<"reservations">;
export type Inquiry = Tables<"inquiries">;
export type InquiryKeyword = Tables<"inquiry_keywords">;
export type TestInquiry = Tables<"test_inquiries">;
export type BookingRule = Tables<"booking_rules">;

export type AuthUser = {
  id: string;
  email: string | null;
  role: UserRole | null;
  is_active: boolean;
};
