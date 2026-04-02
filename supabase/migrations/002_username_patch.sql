-- ═══════════════════════════════════════════════════════════════
-- Patch: ensure display_name is set for existing users
-- Run in Supabase SQL Editor if you already ran migration 001
-- ═══════════════════════════════════════════════════════════════

-- Update any users whose display_name is blank
UPDATE users
SET display_name = split_part(email, '@', 1)
WHERE display_name = '' OR display_name IS NULL;

-- Example: set a friendly username for your admin account
-- UPDATE users SET display_name = 'admin' WHERE email = 'admin@sthetic.com';
-- UPDATE users SET display_name = 'staff' WHERE email = 'staff@sthetic.com';

-- After running, staff can log in with just "admin" or "staff" instead of full email.
-- The username lookup is case-insensitive (uses ILIKE).
