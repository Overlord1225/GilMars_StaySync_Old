-- seed-dev.sql
-- WARNING: DEVELOPMENT / SAMPLE DATA ONLY. Must NOT run on production.
-- Contains sample units and labeled test inquiries for the Accuracy Test page.

INSERT INTO public.units (
  id, name, description, capacity, price_per_night, amenities, image_urls, is_active
)
VALUES
  ('10000000-0000-4000-8000-000000000001', 'Sample Unit - Amihan', 'Sample one-bedroom stay.', 2, 1800, ARRAY['Wi-Fi', 'Air conditioning'], ARRAY[]::text[], true),
  ('10000000-0000-4000-8000-000000000002', 'Sample Unit - Habagat', 'Sample family room.', 4, 2600, ARRAY['Wi-Fi', 'Kitchen'], ARRAY[]::text[], true),
  ('10000000-0000-4000-8000-000000000003', 'Sample Unit - Liwayway', 'Sample garden room.', 2, 2000, ARRAY['Wi-Fi', 'Garden'], ARRAY[]::text[], true),
  ('10000000-0000-4000-8000-000000000004', 'Sample Unit - Dapithapon', 'Sample group suite.', 6, 3800, ARRAY['Wi-Fi', 'Kitchen', 'Air conditioning'], ARRAY[]::text[], true),
  ('10000000-0000-4000-8000-000000000005', 'Sample Unit - Tala', 'Sample compact room.', 2, 1600, ARRAY['Wi-Fi'], ARRAY[]::text[], true)
ON CONFLICT (id) DO NOTHING;


WITH sample_test_inquiries (message, expected_category, language) AS (
  VALUES
    ('I want to book a stay for next month.', 'booking_request'::public.inquiry_category, 'en'),
    ('Can I make a reservation for two guests?', 'booking_request'::public.inquiry_category, 'en'),
    ('Please book the family unit for us.', 'booking_request'::public.inquiry_category, 'en'),
    ('We need a reservation for a weekend.', 'booking_request'::public.inquiry_category, 'en'),
    ('Can you help me book a room?', 'booking_request'::public.inquiry_category, 'en'),
    ('I would like a reservation next week.', 'booking_request'::public.inquiry_category, 'en'),
    ('Mag book po kami ng stay sa December.', 'booking_request'::public.inquiry_category, 'fil'),
    ('Pa reserve po ng room para sa pamilya.', 'booking_request'::public.inquiry_category, 'fil'),
    ('Pwede magpa-book ng unit sa weekend?', 'booking_request'::public.inquiry_category, 'fil'),
    ('Gusto ko pong mag book para sa dalawang tao.', 'booking_request'::public.inquiry_category, 'fil'),
    ('Can we pa reserve for next Friday?', 'booking_request'::public.inquiry_category, 'mixed'),
    ('Please help us magpa-book for three nights.', 'booking_request'::public.inquiry_category, 'mixed'),
    ('Reservation po sana for our family trip.', 'booking_request'::public.inquiry_category, 'mixed'),

    ('Is this unit available next weekend?', 'availability_inquiry'::public.inquiry_category, 'en'),
    ('Do you have availability in December?', 'availability_inquiry'::public.inquiry_category, 'en'),
    ('Are any stays available for two nights?', 'availability_inquiry'::public.inquiry_category, 'en'),
    ('Please check availability for these dates.', 'availability_inquiry'::public.inquiry_category, 'en'),
    ('Is the family unit available on Friday?', 'availability_inquiry'::public.inquiry_category, 'en'),
    ('Are there open dates next month?', 'availability_inquiry'::public.inquiry_category, 'en'),
    ('May bakante po ba sa susunod na linggo?', 'availability_inquiry'::public.inquiry_category, 'fil'),
    ('Available ba ang unit sa December?', 'availability_inquiry'::public.inquiry_category, 'fil'),
    ('May bakante po ba for two nights?', 'availability_inquiry'::public.inquiry_category, 'fil'),
    ('Bakante ba kayo this Friday?', 'availability_inquiry'::public.inquiry_category, 'fil'),
    ('Available po ba next weekend?', 'availability_inquiry'::public.inquiry_category, 'mixed'),
    ('May open dates po ba sa January?', 'availability_inquiry'::public.inquiry_category, 'mixed'),
    ('Can you confirm if may bakante next week?', 'availability_inquiry'::public.inquiry_category, 'mixed'),

    ('I have a question about the check-in time.', 'general_question'::public.inquiry_category, 'en'),
    ('Can you share more information about the location?', 'general_question'::public.inquiry_category, 'en'),
    ('I have a question about your amenities.', 'general_question'::public.inquiry_category, 'en'),
    ('Please send information about parking.', 'general_question'::public.inquiry_category, 'en'),
    ('How much is the extra guest fee?', 'general_question'::public.inquiry_category, 'en'),
    ('I have a general question about the property.', 'general_question'::public.inquiry_category, 'en'),
    ('Paano po ang check-in process?', 'general_question'::public.inquiry_category, 'fil'),
    ('Paano po pumunta sa inyong location?', 'general_question'::public.inquiry_category, 'fil'),
    ('Magkano po ang additional guest fee?', 'general_question'::public.inquiry_category, 'fil'),
    ('May question po ako tungkol sa parking.', 'general_question'::public.inquiry_category, 'mixed'),
    ('How much po ang extra bed?', 'general_question'::public.inquiry_category, 'mixed'),
    ('Can you share info po about the kitchen?', 'general_question'::public.inquiry_category, 'mixed'),
    ('Paano po gamitin ang Wi-Fi?', 'general_question'::public.inquiry_category, 'fil'),

    ('I have a complaint about the noisy room.', 'complaint'::public.inquiry_category, 'en'),
    ('There is a problem with the shower.', 'complaint'::public.inquiry_category, 'en'),
    ('I need to report an issue with the air conditioner.', 'complaint'::public.inquiry_category, 'en'),
    ('This is a complaint about the cleanliness.', 'complaint'::public.inquiry_category, 'en'),
    ('There is a problem with the door lock.', 'complaint'::public.inquiry_category, 'en'),
    ('I have an issue with the water supply.', 'complaint'::public.inquiry_category, 'en'),
    ('May reklamo po ako tungkol sa ingay.', 'complaint'::public.inquiry_category, 'fil'),
    ('Sira po ang aircon sa room.', 'complaint'::public.inquiry_category, 'fil'),
    ('Hindi gumagana ang shower.', 'complaint'::public.inquiry_category, 'fil'),
    ('May issue po sa lock ng pinto.', 'complaint'::public.inquiry_category, 'mixed'),
    ('Complaint po, marumi ang banyo.', 'complaint'::public.inquiry_category, 'mixed'),
    ('May problem po sa tubig sa unit.', 'complaint'::public.inquiry_category, 'mixed'),
    ('Reklamo po tungkol sa sirang ilaw.', 'complaint'::public.inquiry_category, 'fil')
)
INSERT INTO public.test_inquiries (message, expected_category, language)
SELECT sample.message, sample.expected_category, sample.language
FROM sample_test_inquiries AS sample
WHERE NOT EXISTS (
  SELECT 1 FROM public.test_inquiries AS existing
  WHERE existing.message = sample.message
    AND existing.expected_category = sample.expected_category
);
