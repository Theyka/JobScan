do $$
begin
  if to_regclass('public.vacancy_visit_unique_daily') is not null and to_regclass('public.vacancy_visits') is null then
    alter table public.vacancy_visit_unique_daily rename to vacancy_visits;
  end if;
end
$$;

create table if not exists public.vacancy_visits (
  source text not null,
  vacancy_id bigint not null,
  visit_day date not null,
  visitor_hash text not null,
  slug text not null default '',
  created_at timestamp with time zone not null default now(),
  constraint vacancy_visits_pkey primary key (source, vacancy_id, visit_day, visitor_hash),
  constraint vacancy_visits_source_check check (source in ('jobsearch', 'glorri'))
) TABLESPACE pg_default;

create index if not exists vacancy_visits_visit_day_idx on public.vacancy_visits (visit_day desc);
create index if not exists vacancy_visits_vacancy_idx on public.vacancy_visits (source, vacancy_id, visit_day desc);

drop table if exists public.vacancy_visit_stats;

drop function if exists public.increment_vacancy_visit(text, bigint, text);
drop function if exists public.increment_vacancy_visit(text, bigint, text, text);

create or replace function public.increment_vacancy_visit(
  p_source text,
  p_vacancy_id bigint,
  p_slug text default '',
  p_visitor_ip text default ''
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_source text := lower(btrim(coalesce(p_source, '')));
  normalized_slug text := btrim(coalesce(p_slug, ''));
  normalized_ip text := btrim(coalesce(p_visitor_ip, ''));
  normalized_visit_day date := (now() at time zone 'utc')::date;
  hashed_visitor text;
begin
  if normalized_source not in ('jobsearch', 'glorri') then
    raise exception 'Invalid source: %', p_source;
  end if;

  if p_vacancy_id is null or p_vacancy_id <= 0 then
    raise exception 'Invalid vacancy id: %', p_vacancy_id;
  end if;

  if normalized_ip = '' then
    return;
  end if;

  hashed_visitor := md5(normalized_ip);

  insert into public.vacancy_visits (
    source,
    vacancy_id,
    visit_day,
    visitor_hash,
    slug,
    created_at
  )
  values (
    normalized_source,
    p_vacancy_id,
    normalized_visit_day,
    hashed_visitor,
    normalized_slug,
    now()
  )
  on conflict (source, vacancy_id, visit_day, visitor_hash)
  do nothing;
end;
$$;

revoke all on function public.increment_vacancy_visit(text, bigint, text, text) from public;
grant execute on function public.increment_vacancy_visit(text, bigint, text, text) to service_role;

alter table public.vacancy_visits enable row level security;
