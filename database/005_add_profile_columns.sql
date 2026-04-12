-- Add tech_stack column to profiles table
alter table public.profiles
  add column if not exists tech_stack jsonb not null default '[]'::jsonb;
