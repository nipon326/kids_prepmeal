@AGENTS.md

# kids_prepmeal

Mobile-first PWA for planning a weekly batch-cook menu for young kids (Next.js 16 + Supabase).

- Planning unit is one batch per week, not a calendar. A toddler (12 months or older) gets 1 breakfast recipe (7 portions) and 4 mains (14 lunch and dinner portions) centred on the week's protein. The protein is a guideline: other proteins fill in when it is short, and swaps list every usable main. A baby (under 12 months) gets frozen puree cubes: 1 protein, 1 carb, 2 vegetables, 1 fruit, and at most 2 new foods per week. The stage is derived from the birth date.
- All planning, shopping and nutrition logic lives in `src/lib/domain/` as pure TypeScript with tests (`npm test`). Keep it free of I/O.
- Allergen filtering is deterministic (ingredient tags plus the keyword list in `allergens.ts`). Never rely on AI output for allergen safety.
- The data model is multi-household from day one (Supabase RLS via `is_member`). Every household owns its ingredients and recipes (ingredient ids are unique per household, not globally). The starter set lives in `starter_ingredients` / `starter_recipes` and is copied into a household by `seed_household()` when it is created, so households can edit or delete anything.
- The repo is public. Children's names, birth dates and allergies live only in Supabase, never in code, fixtures or seed files.
- `supabase/seed.sql` is generated from `src/data/catalog.ts` (`npm run seed`) and fills the starter templates only. Edit the catalog, not the SQL. Existing households keep their own copies.
