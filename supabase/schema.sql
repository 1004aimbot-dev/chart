-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Enum types
create type org_unit_type as enum ('root', 'committee', 'department', 'team', 'choir');
create type attendance_status as enum ('present', 'absent', 'late');
create type member_role as enum ('admin', 'leader', 'member');

-- Organization Units Table
create table public.org_units (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  parent_id uuid references public.org_units(id),
  type org_unit_type not null default 'department',
  leader_member_id uuid, -- Reference to members table (circular, handled carefully)
  sort_order int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Members Table
create table public.members (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  phone text,
  role member_role default 'member',
  role_title text, -- Display title like "Conductor", "Deacon"
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Memberships (Many-to-Many: Member <-> OrgUnit)
create table public.memberships (
  id uuid primary key default uuid_generate_v4(),
  member_id uuid references public.members(id) on delete cascade not null,
  org_unit_id uuid references public.org_units(id) on delete cascade not null,
  position text, -- "Soprano", "Alto", etc.
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(member_id, org_unit_id)
);

-- Attendance Table
create table public.attendance (
  id uuid primary key default uuid_generate_v4(),
  org_unit_id uuid references public.org_units(id) on delete cascade not null,
  member_id uuid references public.members(id) on delete cascade not null,
  date date not null,
  status attendance_status not null,
  note text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(org_unit_id, member_id, date)
);

-- Community Posts (Notices)
create table public.posts (
  id uuid primary key default uuid_generate_v4(),
  org_unit_id uuid references public.org_units(id) on delete cascade not null,
  author_id uuid references public.members(id) on delete set null,
  title text not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add foreign key for leader_member_id in org_units AFTER members table exists
alter table public.org_units 
  add constraint fk_org_leader 
  foreign key (leader_member_id) 
  references public.members(id) 
  on delete set null;

-- RLS Policies (Simplified for initial setup - assuming open for authenticated or public for now)
alter table public.org_units enable row level security;
alter table public.members enable row level security;
alter table public.memberships enable row level security;
alter table public.attendance enable row level security;
alter table public.posts enable row level security;

-- Allow all access for now (Development Mode)
create policy "Allow all access" on public.org_units for all using (true) with check (true);
create policy "Allow all access" on public.members for all using (true) with check (true);
create policy "Allow all access" on public.memberships for all using (true) with check (true);
create policy "Allow all access" on public.attendance for all using (true) with check (true);
create policy "Allow all access" on public.posts for all using (true) with check (true);
