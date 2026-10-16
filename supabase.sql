-- AETERNA · seguridad, usuarios, chat y reseñas
-- Ejecutar en Supabase SQL Editor.
-- IMPORTANTE: nunca pongas service_role/secret keys en HTML, JS o Git.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text not null default 'customer' check (role in ('customer','admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users(id) on delete cascade,
  alias text,
  last_text text,
  last_at timestamptz not null default now(),
  last_sender_role text check (last_sender_role in ('customer','admin')),
  unread boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  sender_role text not null check (sender_role in ('customer','admin')),
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key references auth.users(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  alias text,
  body text check (char_length(body) <= 600),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists conversations_customer_id_idx on public.conversations(customer_id);
create index if not exists messages_conversation_id_created_at_idx on public.messages(conversation_id,created_at);

alter table public.profiles enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.reviews enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin');
$$;

-- Perfil: cada cliente ve el suyo; admin puede ver perfiles necesarios para operar.
drop policy if exists profiles_self_select on public.profiles;
create policy profiles_self_select on public.profiles for select to authenticated using (id=auth.uid() or public.is_admin());

drop policy if exists profiles_self_insert on public.profiles;
create policy profiles_self_insert on public.profiles for insert to authenticated with check (id=auth.uid() and role='customer');

drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles for update to authenticated using (id=auth.uid()) with check (id=auth.uid() and role='customer');

-- Conversaciones: cliente solo la suya; admin todas.
drop policy if exists conversations_select on public.conversations;
create policy conversations_select on public.conversations for select to authenticated using (customer_id=auth.uid() or public.is_admin());

drop policy if exists conversations_insert on public.conversations;
create policy conversations_insert on public.conversations for insert to authenticated with check (customer_id=auth.uid());

drop policy if exists conversations_update on public.conversations;
create policy conversations_update on public.conversations for update to authenticated using (customer_id=auth.uid() or public.is_admin()) with check (customer_id=auth.uid() or public.is_admin());

-- Mensajes: solo participantes o admin.
drop policy if exists messages_select on public.messages;
create policy messages_select on public.messages for select to authenticated using (
  public.is_admin() or exists(select 1 from public.conversations c where c.id=conversation_id and c.customer_id=auth.uid())
);

drop policy if exists messages_insert on public.messages;
create policy messages_insert on public.messages for insert to authenticated with check (
  sender_id=auth.uid() and (
    public.is_admin() or exists(select 1 from public.conversations c where c.id=conversation_id and c.customer_id=auth.uid())
  )
);

-- Reseñas: públicas de lectura, escritura solo propia, borrado administrativo.
drop policy if exists reviews_public_select on public.reviews;
create policy reviews_public_select on public.reviews for select using (true);

drop policy if exists reviews_self_insert on public.reviews;
create policy reviews_self_insert on public.reviews for insert to authenticated with check (id=auth.uid());

drop policy if exists reviews_self_update on public.reviews;
create policy reviews_self_update on public.reviews for update to authenticated using (id=auth.uid()) with check (id=auth.uid());

drop policy if exists reviews_self_delete on public.reviews;
create policy reviews_self_delete on public.reviews for delete to authenticated using (id=auth.uid() or public.is_admin());

-- Crear perfil automáticamente al registrarse.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles(id,display_name,role)
  values(new.id,coalesce(new.raw_user_meta_data->>'display_name',''), 'customer')
  on conflict(id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Supabase Realtime para chat.
alter publication supabase_realtime add table public.conversations;
alter publication supabase_realtime add table public.messages;

-- CREAR ADMINISTRADOR:
-- 1) Registra la cuenta desde la web.
-- 2) En el SQL Editor, reemplaza el correo y ejecuta SOLO esta consulta:
-- update public.profiles set role='admin' where id=(select id from auth.users where email='admin@tudominio.com');
-- Nunca pongas esa operación en el JavaScript público.

-- PRIVACIDAD:
-- No guardes contraseñas en tablas propias. Supabase Auth gestiona la credencial.
-- Para PII especialmente sensible que deba recuperarse en claro, cifra en backend con una clave almacenada en un Secret Manager; no pongas la clave de cifrado en el navegador.
