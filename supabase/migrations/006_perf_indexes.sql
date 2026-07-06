-- ═══════════════════════════════════════════════════════════════
-- Migration 006 — Performance indexes
-- ═══════════════════════════════════════════════════════════════

-- Index on bookings.status — used by conflict checks (.neq("status","cancelled"))
-- and any filtered list views
create index if not exists idx_bookings_status
  on bookings(status);

-- Composite index optimises the most common query: fetch all bookings
-- for a given date that are not cancelled
create index if not exists idx_bookings_date_status
  on bookings(date, status)
  where status <> 'cancelled';

-- Index on booking_services.staff_id is already created in migration 001,
-- but add it defensively here in case the table was recreated without it
create index if not exists idx_booking_services_staff_safe
  on booking_services(staff_id);
