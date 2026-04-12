create table if not exists public.notifications (
  id bigint generated always as identity not null,
  user_id uuid not null,
  type text not null,
  title text not null,
  body text,
  metadata jsonb not null default '{}'::jsonb,
  is_read boolean not null default false,
  created_at timestamp with time zone not null default now(),
  constraint notifications_pkey primary key (id),
  constraint notifications_user_fkey foreign key (user_id) references auth.users (id) on update cascade on delete cascade,
  constraint notifications_type_check check (type in ('vacancy_expired', 'new_company_vacancy'))
) tablespace pg_default;

create index if not exists notifications_user_unread_idx
  on public.notifications (user_id, is_read, created_at desc);

create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

create policy "Users can view own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users can update own notifications"
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Service role full access on notifications"
  on public.notifications for all
  using (auth.role() = 'service_role');

-- Enable Supabase Realtime for live push notifications
alter publication supabase_realtime add table public.notifications;
