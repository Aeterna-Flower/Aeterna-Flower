-- Aeterna · v2 (favoritos, fechas, pedidos, chat privado, admin)
-- Ejecuta DESPUÉS de aeterna_comunidad.sql. Se puede correr más de una vez.

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;
create or replace function public.my_role() returns text
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

-- Perfiles: lectura pública (nombre/foto para el feed). El teléfono va en tabla privada.
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists bio text;
alter table public.profiles enable row level security;
drop policy if exists "profiles_read_all" on public.profiles;
create policy "profiles_read_all" on public.profiles for select using (true);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid() and role is not distinct from public.my_role());

-- Contacto privado (solo el dueño y el admin)
create table if not exists public.customer_contacts (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  phone text,
  updated_at timestamptz default now()
);
alter table public.customer_contacts enable row level security;
drop policy if exists "contacts_own" on public.customer_contacts;
create policy "contacts_own" on public.customer_contacts for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "contacts_admin_read" on public.customer_contacts;
create policy "contacts_admin_read" on public.customer_contacts for select to authenticated using (public.is_admin());

-- Favoritos
create table if not exists public.favorites (
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id text not null,
  created_at timestamptz default now(),
  primary key (user_id, product_id)
);
alter table public.favorites enable row level security;
drop policy if exists "fav_own" on public.favorites;
create policy "fav_own" on public.favorites for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Fechas especiales
create table if not exists public.special_dates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 80),
  occasion text not null default 'otro',
  event_date date not null,
  repeat_yearly boolean not null default true,
  remind_days int not null default 3 check (remind_days between 0 and 30),
  channel text not null default 'whatsapp' check (channel in ('whatsapp','correo','ambos')),
  notes text,
  created_at timestamptz default now()
);
alter table public.special_dates enable row level security;
drop policy if exists "dates_own" on public.special_dates;
create policy "dates_own" on public.special_dates for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "dates_admin_read" on public.special_dates;
create policy "dates_admin_read" on public.special_dates for select to authenticated using (public.is_admin());

-- Pedidos
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id text,
  product_name text not null,
  product_image text,
  unit_price numeric not null default 0,
  qty int not null default 1 check (qty between 1 and 20),
  zone text,
  zone_label text,
  delivery_fee numeric,
  delivery_date date,
  address text,
  notes text,
  status text not null default 'recibido' check (status in ('recibido','preparacion','diseno','camino','entregado','cancelado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.orders enable row level security;
drop policy if exists "orders_read" on public.orders;
create policy "orders_read" on public.orders for select to authenticated using (user_id = auth.uid() or public.is_admin());
drop policy if exists "orders_insert" on public.orders;
create policy "orders_insert" on public.orders for insert to authenticated with check (user_id = auth.uid() and status = 'recibido');
drop policy if exists "orders_admin_update" on public.orders;
create policy "orders_admin_update" on public.orders for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "orders_user_cancel" on public.orders;
create policy "orders_user_cancel" on public.orders for update to authenticated
  using (user_id = auth.uid() and status = 'recibido') with check (user_id = auth.uid() and status = 'cancelado');

-- Chat privado cliente <-> admin (tablas conversations y messages ya existentes)
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
drop policy if exists "conv_select" on public.conversations;
create policy "conv_select" on public.conversations for select to authenticated using (customer_id = auth.uid() or public.is_admin());
drop policy if exists "conv_insert" on public.conversations;
create policy "conv_insert" on public.conversations for insert to authenticated with check (customer_id = auth.uid() or public.is_admin());
drop policy if exists "conv_update" on public.conversations;
create policy "conv_update" on public.conversations for update to authenticated using (customer_id = auth.uid() or public.is_admin());
drop policy if exists "msg_select" on public.messages;
create policy "msg_select" on public.messages for select to authenticated using (
  public.is_admin() or exists (select 1 from public.conversations c where c.id = conversation_id and c.customer_id = auth.uid()));
drop policy if exists "msg_insert" on public.messages;
create policy "msg_insert" on public.messages for insert to authenticated with check (
  sender_id = auth.uid() and (
    (sender_role = 'admin' and public.is_admin()) or
    (sender_role = 'customer' and exists (select 1 from public.conversations c where c.id = conversation_id and c.customer_id = auth.uid()))));

-- Admin puede moderar publicaciones y comentarios (ya definido en aeterna_comunidad.sql con is_admin)

-- Realtime
do $$ begin
  begin alter publication supabase_realtime add table public.orders; exception when others then null; end;
  begin alter publication supabase_realtime add table public.messages; exception when others then null; end;
  begin alter publication supabase_realtime add table public.conversations; exception when others then null; end;
  begin alter publication supabase_realtime add table public.special_dates; exception when others then null; end;
end $$;
