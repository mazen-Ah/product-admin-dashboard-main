import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { DEMO_PASSWORD, seedDemoData } from "../src/lib/seed-demo";

async function main() {
  await seedDemoData(prisma);
  console.log("Seed complete (~1 year demo data). Password:", DEMO_PASSWORD);
  console.log("accounts@example.com | managing@example.com | partner@example.com");
  console.log("accountant@example.com | supervisor@example.com");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
