import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { DEMO_PASSWORD, seedDemoData } from "../src/lib/seed-demo";

async function main() {
  await seedDemoData(prisma);
  console.log("Seed complete. Demo password:", DEMO_PASSWORD);
  console.log("Accounts Manager: accounts@example.com");
  console.log("Supervisor (project-scoped): supervisor@example.com");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
