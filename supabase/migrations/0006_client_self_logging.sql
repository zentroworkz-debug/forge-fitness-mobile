-- FORGE FITNESS — member self-logging of food and workouts (past, present and future dates).
-- Additive only: creates two new tables; does not touch any existing table, policy or website code.
-- Run in the Supabase SQL editor (or your scripts/run-migrations.cjs) AFTER 0005.

create table if not exists public.client_food_entries (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  entry_date date not null default public.gym_today(),
  meal_type text not null check (meal_type in ('breakfast','morning_snack','lunch','evening_snack','dinner','pre_workout','post_workout')),
  food_item_id uuid references public.food_items(id) on delete set null,
  food_name text not null check (char_length(btrim(food_name)) between 1 and 120),
  quantity_g numeric(8,2) not null check (quantity_g > 0 and quantity_g <= 5000),
  kcal numeric(8,2) not null default 0 check (kcal >= 0),
  protein_g numeric(7,2) not null default 0 check (protein_g >= 0),
  carbs_g numeric(7,2) not null default 0 check (carbs_g >= 0),
  fat_g numeric(7,2) not null default 0 check (fat_g >= 0),
  fibre_g numeric(7,2) not null default 0 check (fibre_g >= 0),
  nutrition_source text not null default 'manual' check (nutrition_source in ('database','manual')),
  is_verified boolean not null default false,
  status text not null default 'eaten' check (status in ('planned','eaten','skipped')),
  notes text check (notes is null or char_length(notes) <= 500),
  created_at timestamptz not null default now()
);
create index if not exists client_food_entries_client_date on public.client_food_entries (client_id, entry_date);

create table if not exists public.client_workout_entries (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  entry_date date not null default public.gym_today(),
  exercise_id uuid references public.exercises(id) on delete set null,
  exercise_name text not null check (char_length(btrim(exercise_name)) between 1 and 120),
  sets integer check (sets between 1 and 50),
  reps integer check (reps between 1 and 1000),
  weight_kg numeric(6,2) check (weight_kg >= 0 and weight_kg <= 1000),
  duration_min integer check (duration_min between 1 and 600),
  notes text check (notes is null or char_length(notes) <= 500),
  status text not null default 'planned' check (status in ('planned','done','skipped')),
  created_at timestamptz not null default now()
);
create index if not exists client_workout_entries_client_date on public.client_workout_entries (client_id, entry_date);

-- Server-side rules: the client's numbers are not trusted.
--  * dates limited to one year back / one year ahead
--  * a FUTURE entry can only be 'planned' (cannot be marked eaten/done in advance)
--  * a food picked from the food database gets its nutrition computed here (per-100g value x grams / 100),
--    so the app cannot store made-up values for database foods. Manual foods are flagged nutrition_source='manual'.
create or replace function public.client_food_entries_guard() returns trigger language plpgsql security definer set search_path = public as $$
declare f public.food_items%rowtype;
begin
  if new.entry_date < public.gym_today() - 365 or new.entry_date > public.gym_today() + 365 then
    raise exception 'entry_date_out_of_range'; end if;
  if new.entry_date > public.gym_today() and new.status <> 'planned' then
    raise exception 'future_entry_must_be_planned'; end if;
  if new.food_item_id is not null then
    select * into f from public.food_items where id = new.food_item_id;
    if not found then raise exception 'unknown_food'; end if;
    new.food_name := f.name;
    new.kcal := round(f.kcal_per_100g * new.quantity_g / 100, 2);
    new.protein_g := round(f.protein_g * new.quantity_g / 100, 2);
    new.carbs_g := round(f.carbs_g * new.quantity_g / 100, 2);
    new.fat_g := round(f.fat_g * new.quantity_g / 100, 2);
    new.fibre_g := round(f.fibre_g * new.quantity_g / 100, 2);
    new.nutrition_source := 'database'; new.is_verified := f.is_verified;
  else
    new.nutrition_source := 'manual'; new.is_verified := false;
  end if;
  return new;
end $$;
drop trigger if exists trg_client_food_entries_guard on public.client_food_entries;
create trigger trg_client_food_entries_guard before insert or update on public.client_food_entries
  for each row execute function public.client_food_entries_guard();

create or replace function public.client_workout_entries_guard() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.entry_date < public.gym_today() - 365 or new.entry_date > public.gym_today() + 365 then
    raise exception 'entry_date_out_of_range'; end if;
  if new.entry_date > public.gym_today() and new.status <> 'planned' then
    raise exception 'future_entry_must_be_planned'; end if;
  if new.exercise_id is not null then
    select name into new.exercise_name from public.exercises where id = new.exercise_id;
    if new.exercise_name is null then raise exception 'unknown_exercise'; end if;
  end if;
  return new;
end $$;
drop trigger if exists trg_client_workout_entries_guard on public.client_workout_entries;
create trigger trg_client_workout_entries_guard before insert or update on public.client_workout_entries
  for each row execute function public.client_workout_entries_guard();

-- RLS: a member has full access to their OWN rows only (and only while approved);
-- their current trainer and admins can read them; nobody else can see anything.
alter table public.client_food_entries enable row level security;
alter table public.client_workout_entries enable row level security;

drop policy if exists cfe_own on public.client_food_entries;
create policy cfe_own on public.client_food_entries for all
  using (client_id = auth.uid() and public.is_approved()) with check (client_id = auth.uid() and public.is_approved());
drop policy if exists cfe_staff_read on public.client_food_entries;
create policy cfe_staff_read on public.client_food_entries for select using (public.is_admin() or public.is_my_client(client_id));

drop policy if exists cwe_own on public.client_workout_entries;
create policy cwe_own on public.client_workout_entries for all
  using (client_id = auth.uid() and public.is_approved()) with check (client_id = auth.uid() and public.is_approved());
drop policy if exists cwe_staff_read on public.client_workout_entries;
create policy cwe_staff_read on public.client_workout_entries for select using (public.is_admin() or public.is_my_client(client_id));

grant select, insert, update, delete on public.client_food_entries, public.client_workout_entries to authenticated;
