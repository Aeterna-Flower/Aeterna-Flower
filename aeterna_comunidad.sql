-- Aeterna · Comunidad y perfil. Ejecutar en Supabase > SQL Editor.

alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists bio text;

create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 800),
  image_url text,
  mood text,
  created_at timestamptz not null default now()
);

create table if not exists public.post_likes (
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 400),
  created_at timestamptz not null default now()
);

alter table public.community_posts enable row level security;
alter table public.post_likes enable row level security;
alter table public.post_comments enable row level security;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- Lectura pública (todos pueden ver la comunidad)
create policy "posts_read" on public.community_posts for select using (true);
create policy "likes_read" on public.post_likes for select using (true);
create policy "comments_read" on public.post_comments for select using (true);

-- Escritura solo con sesión y sobre lo propio
create policy "posts_insert" on public.community_posts for insert to authenticated with check (user_id = auth.uid());
create policy "posts_delete" on public.community_posts for delete to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "likes_insert" on public.post_likes for insert to authenticated with check (user_id = auth.uid());
create policy "likes_delete" on public.post_likes for delete to authenticated using (user_id = auth.uid());
create policy "comments_insert" on public.post_comments for insert to authenticated with check (user_id = auth.uid());
create policy "comments_delete" on public.post_comments for delete to authenticated using (user_id = auth.uid() or public.is_admin());

-- Los perfiles deben poder leerse para mostrar nombre y foto en el feed
-- (si ya tienes una política de lectura en profiles, omite esta)
-- create policy "profiles_read" on public.profiles for select using (true);

-- Cada usuario edita su propio perfil, pero NO su rol (si ya tienes política de update, revisa que proteja "role")
-- create policy "profiles_update_own" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Almacenamiento: buckets públicos para fotos
insert into storage.buckets (id, name, public) values ('avatars','avatars',true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('posts','posts',true) on conflict (id) do nothing;

create policy "avatars_read" on storage.objects for select using (bucket_id = 'avatars');
create policy "avatars_write" on storage.objects for insert to authenticated with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars_update" on storage.objects for update to authenticated using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "posts_img_read" on storage.objects for select using (bucket_id = 'posts');
create policy "posts_img_write" on storage.objects for insert to authenticated with check (bucket_id = 'posts' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "posts_img_delete" on storage.objects for delete to authenticated using (bucket_id = 'posts' and (storage.foldername(name))[1] = auth.uid()::text);

-- Realtime para el feed
alter publication supabase_realtime add table public.community_posts;
alter publication supabase_realtime add table public.post_likes;
alter publication supabase_realtime add table public.post_comments;
