-- AutoShopATS Initial Schema
-- Run this in Supabase SQL Editor

-- profiles table (extends auth.users)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  role text default 'admin',
  created_at timestamptz default now()
);

-- applicants table
create table if not exists applicants (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  name text not null,
  phone text not null,
  email text not null,
  position text not null,
  experience_years integer default 0,
  certifications text[] default '{}',
  resume_url text,
  status text not null default 'NEW',
  source text,
  expected_pay text,
  notes text
);

-- applicant_notes table
create table if not exists applicant_notes (
  id uuid default gen_random_uuid() primary key,
  applicant_id uuid references applicants(id) on delete cascade not null,
  created_at timestamptz default now(),
  added_by text,
  added_by_id uuid references profiles(id),
  message text not null
);

-- indexes
create index if not exists idx_applicants_status on applicants(status);
create index if not exists idx_applicants_position on applicants(position);
create index if not exists idx_notes_applicant on applicant_notes(applicant_id);

-- updated_at trigger
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists applicants_updated_at on applicants;
create trigger applicants_updated_at
  before update on applicants
  for each row execute function update_updated_at();

-- Enable RLS
alter table applicants enable row level security;
alter table applicant_notes enable row level security;
alter table profiles enable row level security;

-- Applicants: public insert, authenticated read/update/delete
create policy "Anyone can submit application" on applicants
  for insert with check (true);

create policy "Authenticated users can view applicants" on applicants
  for select using (auth.role() = 'authenticated');

create policy "Authenticated users can update applicants" on applicants
  for update using (auth.role() = 'authenticated');

create policy "Authenticated users can delete applicants" on applicants
  for delete using (auth.role() = 'authenticated');

-- Notes: authenticated only
create policy "Authenticated users can manage notes" on applicant_notes
  for all using (auth.role() = 'authenticated');

-- Profiles: users can read all, update own
create policy "Users can view all profiles" on profiles
  for select using (auth.role() = 'authenticated');

create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);

-- Auto-create profile on user signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
