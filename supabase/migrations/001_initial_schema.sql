-- ═══════════════════════════════════════════════════════════════
-- S'thetic Systems — Database Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════════

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ── Rooms ────────────────────────────────────────────────────────
create table rooms (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

-- Seed rooms from Excel
insert into rooms (name) values
  ('VALENTINO'),
  ('PRADA'),
  ('FENDI'),
  ('HERMES'),
  ('BURBERRY'),
  ('DOLCE & GABBANA'),
  ('LV'),
  ('CHANEL'),
  ('VIP'),
  ('COUPLES ROOM'),
  ('NAILS AREA');

-- ── Staff ────────────────────────────────────────────────────────
create table staff (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  color_hex  text not null default '#D4AF37',
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

-- Seed staff from Excel (colors assigned per person)
insert into staff (name, color_hex) values
  ('MITCH',     '#BE6B7A'),
  ('LEONA',     '#7A9E85'),
  ('MHAE',      '#6B8EB8'),
  ('JENNY JEN', '#B8866B'),
  ('STEPH',     '#9B7AB8'),
  ('SARAH',     '#B8A76B'),
  ('KISSES',    '#7AB8A7'),
  ('BELLE',     '#B86B8E'),
  ('JEN',       '#8EB86B');

-- ── Users (maps to Supabase auth.users) ─────────────────────────
create table users (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text not null,
  role         text not null default 'staff' check (role in ('admin','staff')),
  display_name text not null default '',
  created_at   timestamptz not null default now()
);

-- Auto-create user profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ── Bookings ─────────────────────────────────────────────────────
create table bookings (
  id             uuid primary key default gen_random_uuid(),
  date           date not null,
  booked_slot    text not null,  -- e.g. '1PM-2PM'
  time_started   time,
  time_finished  time,
  client_name    text not null,
  room_id        uuid not null references rooms(id) on delete restrict,
  status         text not null default 'confirmed'
                 check (status in ('tentative','confirmed','ongoing','done','cancelled')),
  notes          text,
  created_by     uuid references auth.users(id),
  updated_by     uuid references auth.users(id),
  updated_at     timestamptz not null default now(),
  created_at     timestamptz not null default now()
);

-- ── Booking Services ─────────────────────────────────────────────
-- One booking can have multiple therapist+service assignments
create table booking_services (
  id           uuid primary key default gen_random_uuid(),
  booking_id   uuid not null references bookings(id) on delete cascade,
  staff_id     uuid not null references staff(id) on delete restrict,
  service_name text not null,  -- free text: 'FACIAL/WARTS', 'FSPA/MASSAGE/MANI'
  created_at   timestamptz not null default now()
);

-- ── Indexes ──────────────────────────────────────────────────────
create index idx_bookings_date         on bookings(date);
create index idx_bookings_date_slot    on bookings(date, booked_slot);
create index idx_bookings_room_date    on bookings(room_id, date);
create index idx_booking_services_booking on booking_services(booking_id);
create index idx_booking_services_staff   on booking_services(staff_id);

-- ── Auto-update updated_at ────────────────────────────────────────
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger bookings_updated_at
  before update on bookings
  for each row execute function update_updated_at();

-- ── Row Level Security ────────────────────────────────────────────
alter table rooms            enable row level security;
alter table staff            enable row level security;
alter table users            enable row level security;
alter table bookings         enable row level security;
alter table booking_services enable row level security;

-- Authenticated users can read everything
create policy "auth_read_rooms"     on rooms            for select to authenticated using (true);
create policy "auth_read_staff"     on staff            for select to authenticated using (true);
create policy "auth_read_users"     on users            for select to authenticated using (true);
create policy "auth_read_bookings"  on bookings         for select to authenticated using (true);
create policy "auth_read_services"  on booking_services for select to authenticated using (true);

-- Authenticated users can insert/update/delete bookings and services
create policy "auth_write_bookings" on bookings
  for all to authenticated using (true) with check (true);
create policy "auth_write_services" on booking_services
  for all to authenticated using (true) with check (true);

-- Only admin can modify rooms and staff
create policy "admin_write_rooms" on rooms
  for all to authenticated
  using  ((select role from users where id = auth.uid()) = 'admin')
  with check ((select role from users where id = auth.uid()) = 'admin');

create policy "admin_write_staff" on staff
  for all to authenticated
  using  ((select role from users where id = auth.uid()) = 'admin')
  with check ((select role from users where id = auth.uid()) = 'admin');

-- ── Realtime ─────────────────────────────────────────────────────
-- Enable realtime on bookings table in Supabase dashboard:
-- Database → Replication → Tables → enable bookings

-- ═══════════════════════════════════════════════════════════════
-- AFTER RUNNING THIS MIGRATION:
-- 1. Go to Authentication → Users → Add User
--    Email: admin@sthetic.com  Password: (set a strong one)
-- 2. Go to SQL Editor and run:
--    UPDATE users SET role = 'admin' WHERE email = 'admin@sthetic.com';
-- 3. Add a shared staff account the same way (role stays 'staff')
-- ═══════════════════════════════════════════════════════════════
