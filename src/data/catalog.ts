import type { Ingredient } from "@/lib/domain/types";

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
