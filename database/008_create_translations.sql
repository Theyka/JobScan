-- Vacancy translations (EN/AZ/RU)
create table if not exists public.vacancy_translations (
  source text not null,
  vacancy_id bigint not null,
  lang text not null,
  title text,
  text text,
  translated_at timestamp with time zone not null default now(),
  constraint vacancy_translations_pkey primary key (source, vacancy_id, lang),
  constraint vacancy_translations_source_check check (source in ('jobsearch', 'glorri')),
  constraint vacancy_translations_lang_check check (lang in ('en', 'az', 'ru'))
) tablespace pg_default;

create index if not exists vacancy_translations_lookup_idx
  on public.vacancy_translations (source, vacancy_id);

alter table public.vacancy_translations enable row level security;

create policy "Public can read vacancy translations"
  on public.vacancy_translations for select
  using (true);

create policy "Service role can write vacancy translations"
  on public.vacancy_translations for all
  using (auth.role() = 'service_role');

-- Company translations (EN/AZ/RU)
create table if not exists public.company_translations (
  source text not null,
  company_id bigint not null,
  lang text not null,
  name text,
  description text,
  translated_at timestamp with time zone not null default now(),
  constraint company_translations_pkey primary key (source, company_id, lang),
  constraint company_translations_source_check check (source in ('jobsearch', 'glorri')),
  constraint company_translations_lang_check check (lang in ('en', 'az', 'ru'))
) tablespace pg_default;

create index if not exists company_translations_lookup_idx
  on public.company_translations (source, company_id);

alter table public.company_translations enable row level security;

create policy "Public can read company translations"
  on public.company_translations for select
  using (true);

create policy "Service role can write company translations"
  on public.company_translations for all
  using (auth.role() = 'service_role');
