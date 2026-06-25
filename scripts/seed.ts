import "dotenv/config";
import { importAssignmentData } from "../lib/backend/services/import.service";

async function main() {
  const result = await importAssignmentData();
  console.log("Import complete:", JSON.stringify(result, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    const { prisma } = await import("../lib/backend/db");
    await prisma.$disconnect();
  });
