import "dotenv/config";
import { importAssignmentData } from "../lib/backend/services/import.service";

async function main() {
  console.log("Starting data import...");
  const result = await importAssignmentData();
  console.log("Import complete:", JSON.stringify(result, null, 2));
}

main()
  .catch((error) => {
    console.error("Error during import:", error);
    process.exit(1);
  })
  .finally(async () => {
    console.log("Disconnecting from database...");
    const { prisma } = await import("../lib/backend/db");
    await prisma.$disconnect();
    console.log("Disconnected.");
  });
