-- supabase/migrations/005_status_cleanup.sql
-- Run in Supabase SQL editor

-- 1. Migrate tentative → confirmed before constraint change
UPDATE bookings SET status = 'confirmed' WHERE status = 'tentative';

-- 2. Drop old constraint
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;

-- 3. New 4-value constraint
ALTER TABLE bookings
  ADD CONSTRAINT bookings_status_check
  CHECK (status IN ('confirmed', 'ongoing', 'done', 'cancelled'));

-- 4. Default confirmed on new rows
ALTER TABLE bookings ALTER COLUMN status SET DEFAULT 'confirmed';

-- 5. Slot time columns for cron automation
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS slot_start_time timetz,
  ADD COLUMN IF NOT EXISTS slot_end_time   timetz;

-- 6. Backfill slot times for existing rows
UPDATE bookings SET
  slot_start_time = CASE booked_slot
    WHEN '11AM-12NN' THEN '11:00:00+08'::timetz
    WHEN '12NN-1PM'  THEN '12:00:00+08'::timetz
    WHEN '1PM-2PM'   THEN '13:00:00+08'::timetz
    WHEN '2PM-3PM'   THEN '14:00:00+08'::timetz
    WHEN '3PM-4PM'   THEN '15:00:00+08'::timetz
    WHEN '4PM-5PM'   THEN '16:00:00+08'::timetz
    WHEN '5PM-6PM'   THEN '17:00:00+08'::timetz
    WHEN '6PM-7PM'   THEN '18:00:00+08'::timetz
    WHEN '7PM-8PM'   THEN '19:00:00+08'::timetz
    WHEN '8PM-9PM'   THEN '20:00:00+08'::timetz
    WHEN '9PM-10PM'  THEN '21:00:00+08'::timetz
    WHEN '10PM-11PM' THEN '22:00:00+08'::timetz
  END,
  slot_end_time = CASE booked_slot
    WHEN '11AM-12NN' THEN '12:00:00+08'::timetz
    WHEN '12NN-1PM'  THEN '13:00:00+08'::timetz
    WHEN '1PM-2PM'   THEN '14:00:00+08'::timetz
    WHEN '2PM-3PM'   THEN '15:00:00+08'::timetz
    WHEN '3PM-4PM'   THEN '16:00:00+08'::timetz
    WHEN '4PM-5PM'   THEN '17:00:00+08'::timetz
    WHEN '5PM-6PM'   THEN '18:00:00+08'::timetz
    WHEN '6PM-7PM'   THEN '19:00:00+08'::timetz
    WHEN '7PM-8PM'   THEN '20:00:00+08'::timetz
    WHEN '8PM-9PM'   THEN '21:00:00+08'::timetz
    WHEN '9PM-10PM'  THEN '22:00:00+08'::timetz
    WHEN '10PM-11PM' THEN '23:00:00+08'::timetz
  END;

-- 7. Reschedule traceability (no UI yet)
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS rescheduled_from uuid REFERENCES bookings(id);

-- ============================================================
-- CRON JOBS
-- Enable pg_cron first: Database → Extensions → pg_cron
-- ============================================================

-- Auto-cancel: confirmed bookings 30 min past slot start (no-show)
SELECT cron.schedule(
  'auto-cancel-no-show',
  '*/15 * * * *',
  $$
    UPDATE bookings
    SET status = 'cancelled', updated_at = now()
    WHERE status = 'confirmed'
      AND date = (now() AT TIME ZONE 'Asia/Manila')::date
      AND slot_start_time IS NOT NULL
      AND slot_start_time < ((now() AT TIME ZONE 'Asia/Manila')::time - interval '30 minutes');
  $$
);

-- Auto-done: ongoing bookings 15 min past slot end
SELECT cron.schedule(
  'auto-done-completed',
  '*/15 * * * *',
  $$
    UPDATE bookings
    SET status = 'done', updated_at = now()
    WHERE status = 'ongoing'
      AND date = (now() AT TIME ZONE 'Asia/Manila')::date
      AND slot_end_time IS NOT NULL
      AND slot_end_time < ((now() AT TIME ZONE 'Asia/Manila')::time - interval '15 minutes');
  $$
);