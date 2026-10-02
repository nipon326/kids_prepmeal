-- Every household owns its ingredients and recipes. The shared starter set moves into template tables and
-- is copied into a household when it is created, so each household can edit or delete anything freely.
-- Existing data keeps its ids: the oldest household adopts the shared rows in place (plans and ratings
-- reference them); any other household gets a fresh copy.

begin;

-- 1. Templates, taken from the shared rows already in the database.
create table starter_ingredients as
  select id, name, category, food_group, unit, pack_size, pack_label, allergens, protein_group,
         iron_rich, calcium_rich, color, min_age_months
  from ingredients where household_id is null;
alter table starter_ingredients add primary key (id);

create table starter_recipes as
  select id, title, role, min_age_months, max_age_months, protein_group, cook_method, ingredients, instructions
  from recipes where household_id is null;
alter table starter_recipes add primary key (id);

alter table starter_ingredients enable row level security;
alter table starter_recipes enable row level security;
create policy "read starter" on starter_ingredients for select to authenticated using (true);
create policy "read starter" on starter_recipes for select to authenticated using (true);

-- 2. Copy the templates into a household. Not callable by app users, only by the trigger and this script.
create function seed_household(hid uuid) returns void
language sql security definer set search_path = public as $$
  insert into ingredients (household_id, id, name, category, food_group, unit, pack_size, pack_label,
                           allergens, protein_group, iron_rich, calcium_rich, color, min_age_months)
  select hid, id, name, category, food_group, unit, pack_size, pack_label,
         allergens, protein_group, iron_rich, calcium_rich, color, min_age_months
  from starter_ingredients;

  insert into recipes (household_id, title, role, min_age_months, max_age_months, protein_group,
                       cook_method, ingredients, instructions, source)
  select hid, title, role, min_age_months, max_age_months, protein_group,
         cook_method, ingredients, instructions, 'seed'
  from starter_recipes;
$$;
revoke all on function seed_household(uuid) from public, anon, authenticated;

-- 3. Ingredient ids are now unique per household, so starter slugs (e.g. 'pork_minced') can repeat across them.
alter table ingredients drop constraint ingredients_pkey;

do $$
declare h record;
declare is_first boolean := true;
begin
  for h in select id from households order by created_at, id loop
    if is_first then
      update ingredients set household_id = h.id where household_id is null;
      update recipes set household_id = h.id where household_id is null;
      is_first := false;
    else
      perform seed_household(h.id);
    end if;
  end loop;
end $$;

delete from ingredients where household_id is null;
delete from recipes where household_id is null;

alter table ingredients alter column household_id set not null;
alter table recipes alter column household_id set not null;
alter table ingredients add primary key (household_id, id);

-- 4. Policies: members read and write their own rows only.
drop policy "read shared or own" on ingredients;
drop policy "write own" on ingredients;
drop policy "read shared or own" on recipes;
drop policy "write own" on recipes;
create policy "members all" on ingredients for all using (is_member(household_id)) with check (is_member(household_id));
create policy "members all" on recipes for all using (is_member(household_id)) with check (is_member(household_id));

-- 5. New households get the starter set.
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare hid uuid;
begin
  insert into households default values returning id into hid;
  insert into household_members (household_id, user_id) values (hid, new.id);
  perform seed_household(hid);
  return new;
end;
$$;

commit;
