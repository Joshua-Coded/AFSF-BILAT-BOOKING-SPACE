import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { neon } from "@neondatabase/serverless";

const __dirname = dirname(fileURLToPath(import.meta.url));

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.");
  process.exit(1);
}

const sql = neon(databaseUrl);
const schema = readFileSync(join(__dirname, "schema.sql"), "utf8");

const statements = schema
  .split(";")
  .map((s) => s.trim())
  .filter(Boolean);

for (const statement of statements) {
  await sql(statement);
}

console.log("Migration complete: bookings table is ready.");
