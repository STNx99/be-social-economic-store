import { $ } from "bun";

async function runSeeds() {
  console.info("🚀 Starting database seeding process...");

  try {
    console.info("\n--- Seeding Admin ---");
    await $`bun run scripts/seedAdmin.ts`;

    console.info("\n--- Seeding Categories ---");
    await $`bun run scripts/seedCategories.ts`;

    console.info("\n--- Seeding Products ---");
    await $`bun run scripts/seedProducts.ts`;

    console.info("\n--- Seeding Inventory ---");
    await $`bun run scripts/seedInventory.ts`;

    console.info("\n--- Seeding Reviews ---");
    await $`bun run scripts/seedReviews.ts`;

    console.info("\n✅ All seeds completed successfully!");
  } catch (error) {
    console.error("\n❌ Seeding failed:", error);
    process.exit(1);
  }
}

runSeeds();