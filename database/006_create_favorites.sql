-- User favorite vacancies
create table if not exists public.user_favorite_vacancies (
  user_id uuid not null,
  source text not null,
  vacancy_id bigint not null,
  created_at timestamp with time zone not null default now(),
  constraint user_favorite_vacancies_pkey primary key (user_id, source, vacancy_id),
  constraint user_favorite_vacancies_user_fkey foreign key (user_id) references auth.users (id) on update cascade on delete cascade,
  constraint user_favorite_vacancies_source_check check (source in ('jobsearch', 'glorri'))
) tablespace pg_default;

create index if not exists user_favorite_vacancies_user_idx on public.user_favorite_vacancies (user_id);

alter table public.user_favorite_vacancies enable row level security;

create policy "Users can view own favorite vacancies"
  on public.user_favorite_vacancies for select
  using (auth.uid() = user_id);

create policy "Users can add own favorite vacancies"
  on public.user_favorite_vacancies for insert
  with check (auth.uid() = user_id);

create policy "Users can remove own favorite vacancies"
  on public.user_favorite_vacancies for delete
  using (auth.uid() = user_id);

create policy "Service role full access on favorite vacancies"
  on public.user_favorite_vacancies for all
  using (auth.role() = 'service_role');

-- User favorite companies
create table if not exists public.user_favorite_companies (
  user_id uuid not null,
  source text not null,
  company_id bigint not null,
  created_at timestamp with time zone not null default now(),
  constraint user_favorite_companies_pkey primary key (user_id, source, company_id),
  constraint user_favorite_companies_user_fkey foreign key (user_id) references auth.users (id) on update cascade on delete cascade,
  constraint user_favorite_companies_source_check check (source in ('jobsearch', 'glorri'))
) tablespace pg_default;

create index if not exists user_favorite_companies_user_idx on public.user_favorite_companies (user_id);

alter table public.user_favorite_companies enable row level security;

create policy "Users can view own favorite companies"
  on public.user_favorite_companies for select
  using (auth.uid() = user_id);

create policy "Users can add own favorite companies"
  on public.user_favorite_companies for insert
  with check (auth.uid() = user_id);

create policy "Users can remove own favorite companies"
  on public.user_favorite_companies for delete
  using (auth.uid() = user_id);

create policy "Service role full access on favorite companies"
  on public.user_favorite_companies for all
  using (auth.role() = 'service_role');
