-- Add sort_order column to staff table
ALTER TABLE staff ADD COLUMN IF NOT EXISTS sort_order int NOT NULL DEFAULT 0;

-- Set initial order based on current insertion order
UPDATE staff SET sort_order = sub.rn
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) AS rn FROM staff
) sub
WHERE staff.id = sub.id;

-- Index for fast ordered fetches
CREATE INDEX IF NOT EXISTS idx_staff_sort_order ON staff(sort_order);
