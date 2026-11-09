-- Database-side limits for admin-editable numbers. The UI clamps some of these,
-- but the database is the source of truth.
ALTER TABLE public.booking_rules
  ADD CONSTRAINT booking_rules_min_advance_days_positive CHECK (min_advance_days >= 1),
  ADD CONSTRAINT booking_rules_deposit_amount_nonnegative CHECK (deposit_amount >= 0);

ALTER TABLE public.units
  ADD CONSTRAINT units_price_per_night_positive CHECK (price_per_night > 0),
  ADD CONSTRAINT units_capacity_positive CHECK (capacity > 0);

ALTER TABLE public.inquiry_keywords
  ADD CONSTRAINT inquiry_keywords_weight_positive CHECK (weight > 0);
