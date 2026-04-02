-- ═══════════════════════════════════════════════════════════════
-- S'thetic Systems — Database Schema v2
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

-- ── Rooms ────────────────────────────────────────────────────────
create table rooms (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  capacity   int  not null default 1,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

insert into rooms (name, capacity) values
  ('VALENTINO',        3),
  ('PRADA',            1),
  ('FENDI',            1),
  ('HERMES',           1),
  ('BURBERRY',         1),
  ('DOLCE & GABBANA',  2),
  ('LV',               1),
  ('CHANEL',           1),
  ('VIP',              1),
  ('COUPLES ROOM',     1),
  ('NAILS AREA',       5);

-- ── Staff ────────────────────────────────────────────────────────
create table staff (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  color_hex  text not null default '#D4AF37',
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

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

-- ── Users ────────────────────────────────────────────────────────
create table users (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text not null,
  role         text not null default 'staff' check (role in ('admin','staff')),
  display_name text not null default '',
  created_at   timestamptz not null default now()
);

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
  booked_slot    text not null,
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
create table booking_services (
  id           uuid primary key default gen_random_uuid(),
  booking_id   uuid not null references bookings(id) on delete cascade,
  staff_id     uuid not null references staff(id) on delete restrict,
  service_name text not null,
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

create policy "auth_read_rooms"     on rooms            for select to authenticated using (true);
create policy "auth_read_staff"     on staff            for select to authenticated using (true);
create policy "auth_read_users"     on users            for select to authenticated using (true);
create policy "auth_read_bookings"  on bookings         for select to authenticated using (true);
create policy "auth_read_services"  on booking_services for select to authenticated using (true);

create policy "auth_write_bookings" on bookings
  for all to authenticated using (true) with check (true);
create policy "auth_write_services" on booking_services
  for all to authenticated using (true) with check (true);

create policy "admin_write_rooms" on rooms
  for all to authenticated
  using  ((select role from users where id = auth.uid()) = 'admin')
  with check ((select role from users where id = auth.uid()) = 'admin');

create policy "admin_write_staff" on staff
  for all to authenticated
  using  ((select role from users where id = auth.uid()) = 'admin')
  with check ((select role from users where id = auth.uid()) = 'admin');

-- ── Realtime ─────────────────────────────────────────────────────
-- Database → Replication → supabase_realtime → toggle ON: bookings

-- ═══════════════════════════════════════════════════════════════
-- POST-MIGRATION:
-- 1. Auth → Users → Add User → admin@sthetic.com
-- 2. UPDATE users SET role='admin' WHERE email='admin@sthetic.com';
-- ═══════════════════════════════════════════════════════════════
