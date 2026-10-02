import type { Ingredient, Recipe } from "@/lib/domain/types";

// Pack sizes approximate typical Thai supermarket packs; households can override.
export const STARTER_INGREDIENTS: Ingredient[] = [
  { id: "pork_minced", name: "หมูสับ", category: "meat", foodGroup: "protein", unit: "g", pack: { size: 300, label: "แพ็ค" }, allergens: [], proteinGroup: "pork" },
  { id: "pork_tenderloin", name: "สันในหมู", category: "meat", foodGroup: "protein", unit: "g", pack: { size: 300, label: "แพ็ค" }, allergens: [], proteinGroup: "pork" },
  { id: "chicken_breast", name: "อกไก่", category: "meat", foodGroup: "protein", unit: "g", pack: { size: 500, label: "แพ็ค" }, allergens: [], proteinGroup: "chicken" },
  { id: "chicken_thigh", name: "สะโพกไก่ไม่มีหนัง", category: "meat", foodGroup: "protein", unit: "g", pack: { size: 500, label: "แพ็ค" }, allergens: [], proteinGroup: "chicken" },
  { id: "chicken_minced", name: "ไก่สับ", category: "meat", foodGroup: "protein", unit: "g", pack: { size: 300, label: "แพ็ค" }, allergens: [], proteinGroup: "chicken" },
  { id: "beef_minced", name: "เนื้อวัวบด", category: "meat", foodGroup: "protein", unit: "g", pack: { size: 250, label: "แพ็ค" }, allergens: [], proteinGroup: "beef", ironRich: true },
  { id: "pork_liver", name: "ตับหมู", category: "meat", foodGroup: "protein", unit: "g", pack: { size: 200, label: "แพ็ค" }, allergens: [], proteinGroup: "liver", ironRich: true },
  { id: "chicken_liver", name: "ตับไก่", category: "meat", foodGroup: "protein", unit: "g", pack: { size: 250, label: "แพ็ค" }, allergens: [], proteinGroup: "liver", ironRich: true },

  { id: "basa", name: "ปลาดอลลี่", category: "seafood", foodGroup: "protein", unit: "g", pack: { size: 500, label: "แพ็ค" }, allergens: ["fish"], proteinGroup: "fish" },
  { id: "sea_bass", name: "ปลากะพงแล่", category: "seafood", foodGroup: "protein", unit: "g", pack: { size: 300, label: "แพ็ค" }, allergens: ["fish"], proteinGroup: "fish" },
  { id: "salmon", name: "ปลาแซลมอน", category: "seafood", foodGroup: "protein", unit: "g", pack: { size: 250, label: "แพ็ค" }, allergens: ["fish"], proteinGroup: "fish" },
  { id: "shrimp", name: "กุ้งแกะเปลือก", category: "seafood", foodGroup: "protein", unit: "g", pack: { size: 300, label: "แพ็ค" }, allergens: ["shellfish"], proteinGroup: "shrimp" },

  { id: "egg", name: "ไข่ไก่", category: "egg_dairy", foodGroup: "protein", unit: "piece", pack: { size: 10, label: "แพ็ค 10 ฟอง" }, allergens: ["egg"], proteinGroup: "egg", ironRich: true },
  { id: "tofu_firm", name: "เต้าหู้แข็ง", category: "egg_dairy", foodGroup: "protein", unit: "g", pack: { size: 300, label: "ก้อน" }, allergens: ["soy"], proteinGroup: "tofu", calciumRich: true },
  { id: "tofu_soft", name: "เต้าหู้หลอดขาว", category: "egg_dairy", foodGroup: "protein", unit: "g", pack: { size: 300, label: "หลอด" }, allergens: ["soy"], proteinGroup: "tofu" },

  { id: "pumpkin", name: "ฟักทอง", category: "vegetable", foodGroup: "vegetable", unit: "g", pack: { size: 1000, label: "ลูกเล็ก" }, allergens: [], color: "orange" },
  { id: "carrot", name: "แครอท", category: "vegetable", foodGroup: "vegetable", unit: "g", pack: { size: 500, label: "ถุง" }, allergens: [], color: "orange" },
  { id: "broccoli", name: "บรอกโคลี", category: "vegetable", foodGroup: "vegetable", unit: "g", pack: { size: 300, label: "หัว" }, allergens: [], color: "green", calciumRich: true },
  { id: "spinach", name: "ผักโขม", category: "vegetable", foodGroup: "vegetable", unit: "g", pack: { size: 250, label: "แพ็ค" }, allergens: [], color: "green", ironRich: true, calciumRich: true },
  { id: "chinese_kale", name: "คะน้า", category: "vegetable", foodGroup: "vegetable", unit: "g", pack: { size: 250, label: "แพ็ค" }, allergens: [], color: "green", calciumRich: true },
  { id: "bok_choy", name: "กวางตุ้ง", category: "vegetable", foodGroup: "vegetable", unit: "g", pack: { size: 250, label: "แพ็ค" }, allergens: [], color: "green" },
  { id: "cabbage", name: "กะหล่ำปลี", category: "vegetable", foodGroup: "vegetable", unit: "g", pack: { size: 800, label: "หัว" }, allergens: [], color: "white" },
  { id: "purple_cabbage", name: "กะหล่ำปลีม่วง", category: "vegetable", foodGroup: "vegetable", unit: "g", pack: { size: 500, label: "หัว" }, allergens: [], color: "purple" },
  { id: "tomato", name: "มะเขือเทศ", category: "vegetable", foodGroup: "vegetable", unit: "g", pack: { size: 500, label: "แพ็ค" }, allergens: [], color: "red" },
  { id: "sweet_corn", name: "ข้าวโพดหวาน", category: "vegetable", foodGroup: "vegetable", unit: "g", pack: { size: 400, label: "แพ็ค 2 ฝัก" }, allergens: [], color: "yellow" },
  { id: "winter_melon", name: "ฟัก", category: "vegetable", foodGroup: "vegetable", unit: "g", pack: { size: 1000, label: "ชิ้น" }, allergens: [], color: "white" },
  { id: "onion", name: "หอมใหญ่", category: "vegetable", foodGroup: "vegetable", unit: "g", pack: { size: 500, label: "ถุง" }, allergens: [], color: "white" },

  { id: "banana", name: "กล้วยน้ำว้า", category: "fruit", foodGroup: "fruit", unit: "piece", pack: { size: 12, label: "หวี" }, allergens: [], color: "yellow" },
  { id: "papaya", name: "มะละกอสุก", category: "fruit", foodGroup: "fruit", unit: "g", pack: { size: 1000, label: "ลูก" }, allergens: [], color: "orange" },
  { id: "avocado", name: "อะโวคาโด", category: "fruit", foodGroup: "fruit", unit: "piece", allergens: [], color: "green" },
  { id: "apple", name: "แอปเปิล", category: "fruit", foodGroup: "fruit", unit: "piece", allergens: [], color: "red" },
  { id: "guava", name: "ฝรั่ง", category: "fruit", foodGroup: "fruit", unit: "piece", allergens: [], color: "green" },

  { id: "jasmine_rice", name: "ข้าวหอมมะลิ", category: "grain", foodGroup: "carb", unit: "g", pack: { size: 5000, label: "ถุง 5 กก." }, allergens: [] },
  { id: "brown_rice", name: "ข้าวกล้อง", category: "grain", foodGroup: "carb", unit: "g", pack: { size: 1000, label: "ถุง" }, allergens: [] },
  { id: "riceberry", name: "ข้าวไรซ์เบอร์รี่", category: "grain", foodGroup: "carb", unit: "g", pack: { size: 1000, label: "ถุง" }, allergens: [], ironRich: true },
  { id: "sweet_potato", name: "มันเทศ", category: "vegetable", foodGroup: "carb", unit: "g", pack: { size: 500, label: "ถุง" }, allergens: [], color: "orange" },
  { id: "potato", name: "มันฝรั่ง", category: "vegetable", foodGroup: "carb", unit: "g", pack: { size: 1000, label: "ถุง" }, allergens: [] },
  { id: "rice_vermicelli", name: "เส้นหมี่ขาว", category: "grain", foodGroup: "carb", unit: "g", pack: { size: 200, label: "ห่อ" }, allergens: [] },
  { id: "rice_flour", name: "แป้งข้าวเจ้า", category: "grain", foodGroup: "carb", unit: "g", pack: { size: 500, label: "ถุง" }, allergens: [] },
  { id: "tapioca_flour", name: "แป้งมันสำปะหลัง", category: "grain", foodGroup: "carb", unit: "g", pack: { size: 500, label: "ถุง" }, allergens: [] },

  { id: "fish_sauce", name: "น้ำปลา", category: "pantry", foodGroup: "seasoning", unit: "ml", allergens: ["fish"], minAgeMonths: 12 },
  { id: "soy_sauce_gf", name: "ซีอิ๊วขาวสูตรไม่มีกลูเตน", category: "pantry", foodGroup: "seasoning", unit: "ml", allergens: ["soy"], minAgeMonths: 12 },
  { id: "salt", name: "เกลือ", category: "pantry", foodGroup: "seasoning", unit: "g", allergens: [], minAgeMonths: 12 },
  { id: "sugar", name: "น้ำตาล", category: "pantry", foodGroup: "seasoning", unit: "g", allergens: [], minAgeMonths: 12 },
  { id: "honey", name: "น้ำผึ้ง", category: "pantry", foodGroup: "seasoning", unit: "ml", allergens: [], minAgeMonths: 12 },
  { id: "garlic", name: "กระเทียม", category: "pantry", foodGroup: "seasoning", unit: "g", allergens: [] },
  { id: "cooking_oil", name: "น้ำมันรำข้าว", category: "pantry", foodGroup: "fat", unit: "ml", allergens: [] },
];

// Shared starter recipes (household_id = null, source = 'seed'). Amounts are per portion.
// Toddler mains assume gluten-free soy sauce and tapioca/rice flour in place of wheat flour.
// Baby purees are single-food and unseasoned, so the planner can track new-food introductions.
const puree = (id: string, title: string, ingredientId: string, amount: number, cookMethod: Recipe["cookMethod"], steps: string[], proteinGroup?: Recipe["proteinGroup"]): Recipe => ({
  id: `seed_puree_${id}`, title, role: "puree", minAgeMonths: 6, proteinGroup, cookMethod,
  ingredients: [{ ingredientId, amountPerPortion: amount }], instructions: steps,
});

export const STARTER_RECIPES: Recipe[] = [
  {
    id: "seed_main_pork_soy_stirfry", title: "หมูบดผัดซีอิ๊ว", role: "main", minAgeMonths: 12, proteinGroup: "pork", cookMethod: "stir_fry",
    ingredients: [
      { ingredientId: "pork_minced", amountPerPortion: 40 }, { ingredientId: "onion", amountPerPortion: 15 },
      { ingredientId: "garlic", amountPerPortion: 2 }, { ingredientId: "soy_sauce_gf", amountPerPortion: 5 },
      { ingredientId: "sugar", amountPerPortion: 1 }, { ingredientId: "cooking_oil", amountPerPortion: 3 },
    ],
    instructions: ["สับกระเทียม หั่นหอมใหญ่เป็นชิ้นเล็ก", "ตั้งกระทะ ใส่น้ำมัน ผัดกระเทียมและหอมใหญ่ให้หอม", "ใส่หมูบดผัดจนสุก ปรุงด้วยซีอิ๊วขาวสูตรไม่มีกลูเตนและน้ำตาล", "ผัดจนเข้ากัน พักให้เย็นก่อนแบ่งใส่กล่อง"],
  },
  {
    id: "seed_main_pork_winter_melon_soup", title: "แกงจืดฟักหมูสับ", role: "main", minAgeMonths: 12, proteinGroup: "pork", cookMethod: "boil",
    ingredients: [
      { ingredientId: "winter_melon", amountPerPortion: 50 }, { ingredientId: "pork_minced", amountPerPortion: 30 },
      { ingredientId: "garlic", amountPerPortion: 1 }, { ingredientId: "salt", amountPerPortion: 0.5 },
    ],
    instructions: ["ต้มน้ำให้เดือด ปั้นหมูสับเป็นก้อนเล็กลงต้มจนสุก", "ใส่ฟักหั่นชิ้นพอดีคำ ต้มจนนุ่ม", "ปรุงเกลือเล็กน้อย ใส่กระเทียม", "พักให้เย็น แยกเนื้อกับน้ำแกงใส่กล่อง"],
  },
  {
    id: "seed_main_pork_pumpkin_steamed", title: "หมูสับนึ่งฟักทอง", role: "main", minAgeMonths: 12, proteinGroup: "pork", cookMethod: "steam",
    ingredients: [
      { ingredientId: "pumpkin", amountPerPortion: 40 }, { ingredientId: "pork_minced", amountPerPortion: 30 },
      { ingredientId: "garlic", amountPerPortion: 1 }, { ingredientId: "soy_sauce_gf", amountPerPortion: 3 },
    ],
    instructions: ["หั่นฟักทองเป็นชิ้นบาง เรียงในจาน", "คลุกหมูสับกับกระเทียมสับและซีอิ๊วขาวสูตรไม่มีกลูเตน วางบนฟักทอง", "นึ่งไฟแรงประมาณ 15 นาทีจนสุก", "พักให้เย็นก่อนแบ่งใส่กล่อง"],
  },
  {
    id: "seed_main_pork_veg_balls_baked", title: "ลูกชิ้นหมูผักอบ", role: "main", minAgeMonths: 12, proteinGroup: "pork", cookMethod: "bake",
    ingredients: [
      { ingredientId: "pork_minced", amountPerPortion: 40 }, { ingredientId: "carrot", amountPerPortion: 15 },
      { ingredientId: "tapioca_flour", amountPerPortion: 5 }, { ingredientId: "garlic", amountPerPortion: 1 },
      { ingredientId: "soy_sauce_gf", amountPerPortion: 2 }, { ingredientId: "cooking_oil", amountPerPortion: 2 },
    ],
    instructions: ["ขูดแครอทฝอย สับกระเทียม", "นวดหมูสับ แครอท กระเทียม ซีอิ๊วขาวสูตรไม่มีกลูเตน และแป้งมันสำปะหลังให้เหนียว (ใช้แป้งมันแทนแป้งสาลี)", "ปั้นเป็นก้อนเล็ก ทาน้ำมันบางๆ", "อบ 180°C ประมาณ 20 นาทีจนสุก พักให้เย็นก่อนแช่แข็ง"],
  },
  {
    id: "seed_main_pork_kale_stirfry", title: "ผัดคะน้าหมูสับ", role: "main", minAgeMonths: 12, proteinGroup: "pork", cookMethod: "stir_fry",
    ingredients: [
      { ingredientId: "chinese_kale", amountPerPortion: 40 }, { ingredientId: "pork_minced", amountPerPortion: 30 },
      { ingredientId: "garlic", amountPerPortion: 2 }, { ingredientId: "soy_sauce_gf", amountPerPortion: 4 },
      { ingredientId: "cooking_oil", amountPerPortion: 3 },
    ],
    instructions: ["หั่นคะน้าเป็นชิ้นสั้นพอดีคำ สับกระเทียม", "ผัดกระเทียมกับหมูสับจนสุก", "ใส่คะน้า ปรุงด้วยซีอิ๊วขาวสูตรไม่มีกลูเตน ผัดจนนุ่ม", "พักให้เย็นก่อนแบ่งใส่กล่อง"],
  },

  puree("pork", "หมูบดละเอียด", "pork_minced", 20, "boil", ["ต้มหมูบดกับน้ำจนสุกนุ่ม", "ปั่นกับน้ำต้มจนละเอียด", "เทใส่ถาดน้ำแข็ง แช่แข็งเป็นก้อน"], "pork"),
  puree("rice", "ข้าวบด", "jasmine_rice", 30, "boil", ["ต้มข้าวกับน้ำมากๆ จนเละ", "ปั่นให้ละเอียด", "เทใส่ถาดน้ำแข็ง แช่แข็งเป็นก้อน"]),
  puree("sweet_potato", "มันเทศบด", "sweet_potato", 30, "steam", ["ปอกเปลือก หั่นชิ้น นึ่งจนนุ่ม", "บดหรือปั่นให้ละเอียด", "เทใส่ถาดน้ำแข็ง แช่แข็งเป็นก้อน"]),
  puree("riceberry", "ข้าวไรซ์เบอร์รี่บด", "riceberry", 30, "boil", ["ต้มข้าวไรซ์เบอร์รี่กับน้ำมากๆ จนเละ", "ปั่นให้ละเอียด", "เทใส่ถาดน้ำแข็ง แช่แข็งเป็นก้อน"]),
  puree("pumpkin", "ฟักทองบด", "pumpkin", 30, "steam", ["ปอกเปลือก หั่นชิ้น นึ่งจนนุ่ม", "ปั่นหรือบดให้ละเอียด", "เทใส่ถาดน้ำแข็ง แช่แข็งเป็นก้อน"]),
  puree("carrot", "แครอทบด", "carrot", 30, "steam", ["ปอกเปลือก หั่นชิ้น นึ่งจนนุ่ม", "ปั่นให้ละเอียด", "เทใส่ถาดน้ำแข็ง แช่แข็งเป็นก้อน"]),
  puree("broccoli", "บรอกโคลีบด", "broccoli", 30, "steam", ["แยกเป็นดอกเล็ก นึ่งจนนุ่ม", "ปั่นให้ละเอียด", "เทใส่ถาดน้ำแข็ง แช่แข็งเป็นก้อน"]),
  puree("winter_melon", "ฟักบด", "winter_melon", 30, "steam", ["ปอกเปลือก หั่นชิ้น นึ่งจนนุ่ม", "ปั่นให้ละเอียด", "เทใส่ถาดน้ำแข็ง แช่แข็งเป็นก้อน"]),
  puree("banana", "กล้วยบด", "banana", 0.5, "blend", ["ปอกกล้วยสุก บดให้ละเอียด", "เทใส่ถาดน้ำแข็ง แช่แข็งเป็นก้อน (สีอาจคล้ำลงได้)"]),
  puree("papaya", "มะละกอบด", "papaya", 30, "blend", ["ปอกมะละกอสุก ปั่นหรือบดให้ละเอียด", "เทใส่ถาดน้ำแข็ง แช่แข็งเป็นก้อน"]),
  puree("apple", "แอปเปิลต้มบด", "apple", 0.25, "boil", ["ปอกเปลือก หั่นชิ้น ต้มหรือนึ่งจนนุ่ม", "ปั่นให้ละเอียด", "เทใส่ถาดน้ำแข็ง แช่แข็งเป็นก้อน"]),
];
