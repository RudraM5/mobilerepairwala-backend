import fs from "fs";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const runMigration = async () => {
  try {
    // connect to Railway MySQL using your .env
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT,
      multipleStatements: true, // ✅ allow multiple statements
    });

    // read schema.sql file
    const schema = fs.readFileSync("schema.sql", "utf8");

    // split by semicolon and filter out empty queries
    const statements = schema
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length);

    for (const stmt of statements) {
      console.log(`⚡ Running: ${stmt.slice(0, 50)}...`);
      await connection.query(stmt);
    }

    console.log("✅ Schema imported successfully!");

    await connection.end();
  } catch (err) {
    console.error("❌ Migration failed:", err.message);
  }
};

runMigration();
