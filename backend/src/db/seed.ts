import { createDb } from "./index";
import { categories, dishes } from "./schema";

const seedCategories = [
  { name: "Супы", description: "Горячие блюда" },
  { name: "Салаты", description: "Легкие закуски" },
  { name: "Напитки", description: "Освежающие напитки" }
];

const seedDishes = [
  {
    name: "Борщ",
    description: "Классический борщ со сметаной",
    price: "250.00",
    imageUrl: "https://placehold.co/600x400",
    categoryIndex: 0
  },
  {
    name: "Цезарь",
    description: "Салат с курицей и соусом цезарь",
    price: "320.00",
    imageUrl: "https://placehold.co/600x400",
    categoryIndex: 1
  },
  {
    name: "Морс клюквенный",
    description: "Освежающий морс",
    price: "150.00",
    imageUrl: "https://placehold.co/600x400",
    categoryIndex: 2
  }
];

async function seed() {
  const db = await createDb();
  await db.delete(dishes).execute();
  await db.delete(categories).execute();

  const categoryResult = await db.insert(categories).values(seedCategories).execute();

  const startId = Number(categoryResult.insertId ?? 1);
  const categoryIds = seedCategories.map((_, index) => startId + index);

  await db
    .insert(dishes)
    .values(
      seedDishes.map((dish) => ({
        name: dish.name,
        description: dish.description,
        price: dish.price,
        imageUrl: dish.imageUrl,
        categoryId: categoryIds[dish.categoryIndex]
      }))
    )
    .execute();

  console.log("Database seeded");
  process.exit(0);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
