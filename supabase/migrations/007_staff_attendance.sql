-- ─── Staff Attendance ────────────────────────────────────────────────────────
-- One row per staff member per working day.
-- Only today's date is attendance-aware in the UI; past/future dates use
-- the static sort_order from the staff table.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS staff_attendance (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  date          date        NOT NULL,
  staff_id      uuid        NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  status        text        NOT NULL DEFAULT 'present'
                            CHECK (status IN ('present', 'absent', 'leave')),
  arrived_at    timestamptz,               -- null when absent / on-leave
  arrival_order int,                       -- rank for that day (1 = first in)
  notes         text,                      -- optional e.g. "half day", "sick"
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT uq_staff_attendance_date_staff UNIQUE (date, staff_id)
);

-- Fast lookups by date (primary access pattern)
CREATE INDEX IF NOT EXISTS idx_staff_attendance_date
  ON staff_attendance(date);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_staff_attendance_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER staff_attendance_updated_at
  BEFORE UPDATE ON staff_attendance
  FOR EACH ROW EXECUTE FUNCTION update_staff_attendance_updated_at();

-- ── Row Level Security ────────────────────────────────────────────────────────
ALTER TABLE staff_attendance ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read attendance (needed to render the grid)
CREATE POLICY "auth_read_attendance" ON staff_attendance
  FOR SELECT TO authenticated USING (true);

-- Only admins can write attendance (check-in, mark leave, undo)
CREATE POLICY "admin_write_attendance" ON staff_attendance
  FOR ALL TO authenticated
  USING  ((SELECT role FROM users WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');
