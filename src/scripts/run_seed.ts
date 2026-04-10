
import { seedCategories } from "../lib/seed-categories";
import * as dotenv from "dotenv";
import * as path from "path";

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function run() {
    console.log("Starting seed...");
    try {
        await seedCategories();
        console.log("Seed completed successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Seed failed:", error);
        process.exit(1);
    }
}

run();
