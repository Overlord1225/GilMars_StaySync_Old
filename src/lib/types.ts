export type UserRole = 'guest' | 'admin' | 'super_admin';
export type ReservationStatus = 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'completed';
export type ReservationSource = 'staysync' | 'airbnb';
export type InquiryCategory = 'booking_request' | 'availability_inquiry' | 'general_question' | 'complaint';
export type InquiryStatus = 'new' | 'in_progress' | 'resolved';
export type CategorySource = 'auto' | 'admin';

export interface Profile {
  id: string;
  full_name: string | null;
  email: string;
  contact_number: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Unit {
  id: string;
  name: string;
  description: string | null;
  capacity: number;
  price_per_night: number;
  amenities: string[];
  image_urls: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Reservation {
  id: string;
  unit_id: string;
  guest_id: string | null;
  manual_guest_name: string | null;
  source: ReservationSource;
  check_in: string;
  check_out: string;
  num_guests: number;
  status: ReservationStatus;
  notes: string | null;
  deposit_amount: number | null;
  payment_method: string | null;
  payment_reference: string | null;
  paid_at: string | null;
  rescheduled_at: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Inquiry {
  id: string;
  guest_id: string;
  unit_id: string | null;
  subject: string | null;
  message: string;
  category: InquiryCategory | null;
  original_category: InquiryCategory | null;
  category_source: CategorySource;
  matched_keywords: string[];
  corrected_by: string | null;
  corrected_at: string | null;
  status: InquiryStatus;
  created_at: string;
  updated_at: string;
}

export interface InquiryKeyword {
  id: string;
  category: InquiryCategory;
  keyword: string;
  language: string;
  weight: number;
  is_active: boolean;
  created_at: string;
}

export interface TestInquiry {
  id: string;
  message: string;
  expected_category: InquiryCategory;
  language: string;
  created_at: string;
}

export interface BookingRule {
  id: boolean;
  min_advance_days: number;
  deposit_amount: number;
  updated_at: string;
}

export interface AuthUser {
  id: string;
  email: string | null;
  role: UserRole | null;
  is_active: boolean;
}