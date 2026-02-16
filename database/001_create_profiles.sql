create table public.profiles (
  id uuid not null,
  username text not null,
  first_name text not null,
  last_name text not null,
  created_at timestamp with time zone not null default now(),
  is_admin boolean not null default false,
  constraint profiles_pkey primary key (id),
  constraint profiles_id_fkey foreign KEY (id) references auth.users (id) on update CASCADE on delete CASCADE
) TABLESPACE pg_default;
