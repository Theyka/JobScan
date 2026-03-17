create table if not exists public.telegram_user_settings (
    chat_id bigint primary key,
    username text,
    first_name text,
    language_code text not null default 'az',
    selected_technologies jsonb not null default '[]'::jsonb,
    onboarding_step text not null default 'language',
    active boolean not null default true,
    last_digest_for date,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.set_telegram_user_settings_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = timezone('utc', now());
    return new;
end;
$$;

drop trigger if exists telegram_user_settings_set_updated_at on public.telegram_user_settings;
create trigger telegram_user_settings_set_updated_at
before update on public.telegram_user_settings
for each row
execute function public.set_telegram_user_settings_updated_at();
