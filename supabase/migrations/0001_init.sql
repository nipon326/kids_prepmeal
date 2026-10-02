-- Rows with household_id = null are the shared starter library (readable by everyone signed in).

create table households (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'บ้านของฉัน',
  created_at timestamptz not null default now()
);

create table household_members (
  household_id uuid not null references households on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'member')),
  primary key (household_id, user_id)
);

create table children (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households on delete cascade,
  name text not null,
  birth_date date not null,
  allergens text[] not null default '{}',
  portion_scale numeric not null default 1 check (portion_scale > 0),
  introduced_ingredient_ids text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table ingredients (
  id text primary key default gen_random_uuid()::text,
  household_id uuid references households on delete cascade,
  name text not null,
  category text not null check (category in ('meat','seafood','egg_dairy','vegetable','fruit','grain','pantry')),
  food_group text not null check (food_group in ('carb','protein','vegetable','fruit','fat','seasoning')),
  unit text not null check (unit in ('g','ml','piece')),
  pack_size numeric,
  pack_label text,
  allergens text[] not null default '{}',
  protein_group text,
  iron_rich boolean not null default false,
  calcium_rich boolean not null default false,
  color text,
  min_age_months int
);

create table recipes (
  id text primary key default gen_random_uuid()::text,
  household_id uuid references households on delete cascade,
  title text not null,
  role text not null check (role in ('breakfast','main','puree')),
  min_age_months int not null,
  max_age_months int,
  protein_group text,
  cook_method text not null,
  ingredients jsonb not null,
  instructions jsonb not null default '[]',
  source text not null default 'user' check (source in ('seed','user','ai')),
  created_at timestamptz not null default now()
);

create table weekly_plans (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households on delete cascade,
  week_start date not null,
  protein_group text not null,
  items jsonb not null,
  new_foods jsonb not null default '[]',
  status text not null default 'draft' check (status in ('draft','confirmed')),
  updated_at timestamptz not null default now(),
  unique (household_id, week_start)
);

create table ratings (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households on delete cascade,
  child_id uuid not null references children on delete cascade,
  recipe_id text not null references recipes on delete cascade,
  rating text not null check (rating in ('loved','liked','neutral','disliked')),
  rated_on date not null default current_date
);

create index on children (household_id);
create index on recipes (household_id);
create index on ingredients (household_id);
create index on weekly_plans (household_id, week_start desc);
create index on ratings (household_id, child_id);

create function is_member(hid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from household_members where household_id = hid and user_id = auth.uid());
$$;

alter table households enable row level security;
alter table household_members enable row level security;
alter table children enable row level security;
alter table ingredients enable row level security;
alter table recipes enable row level security;
alter table weekly_plans enable row level security;
alter table ratings enable row level security;

create policy "members read household" on households for select using (is_member(id));
create policy "members update household" on households for update using (is_member(id));
create policy "read own memberships" on household_members for select using (user_id = auth.uid());

create policy "members all" on children for all using (is_member(household_id)) with check (is_member(household_id));
create policy "members all" on weekly_plans for all using (is_member(household_id)) with check (is_member(household_id));
create policy "members all" on ratings for all using (is_member(household_id)) with check (is_member(household_id));

create policy "read shared or own" on ingredients for select
  using (household_id is null or is_member(household_id));
create policy "write own" on ingredients for all
  using (is_member(household_id)) with check (is_member(household_id));

create policy "read shared or own" on recipes for select
  using (household_id is null or is_member(household_id));
create policy "write own" on recipes for all
  using (is_member(household_id)) with check (is_member(household_id));

create function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare hid uuid;
begin
  insert into households default values returning id into hid;
  insert into household_members (household_id, user_id) values (hid, new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users for each row execute function handle_new_user();
