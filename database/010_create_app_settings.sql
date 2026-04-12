create table if not exists public.app_settings (
  key text not null,
  value text not null,
  updated_at timestamp with time zone not null default now(),
  constraint app_settings_pkey primary key (key)
) tablespace pg_default;

alter table public.app_settings enable row level security;

create policy "Service role full access on app_settings"
  on public.app_settings for all
  using (auth.role() = 'service_role');

-- Default: translation enabled
insert into public.app_settings (key, value)
values ('translation_enabled', 'true')
on conflict (key) do nothing;
