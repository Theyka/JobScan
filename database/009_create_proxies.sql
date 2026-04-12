create table if not exists public.proxies (
  id bigint generated always as identity not null,
  url text not null,
  is_active boolean not null default true,
  last_used_at timestamp with time zone,
  fail_count integer not null default 0,
  created_at timestamp with time zone not null default now(),
  constraint proxies_pkey primary key (id),
  constraint proxies_url_unique unique (url)
) tablespace pg_default;

alter table public.proxies enable row level security;

create policy "Service role full access on proxies"
  on public.proxies for all
  using (auth.role() = 'service_role');
