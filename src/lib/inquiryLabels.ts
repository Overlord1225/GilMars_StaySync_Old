import type { InquiryCategory, InquiryStatus } from "@/lib/types";

export const categoryLabels: Record<InquiryCategory, string> = {
  booking_request: "Booking request",
  availability_inquiry: "Availability",
  general_question: "General question",
  complaint: "Concern",
};

export const statusLabels: Record<InquiryStatus, string> = {
  new: "New",
  in_progress: "In progress",
  resolved: "Resolved",
};
