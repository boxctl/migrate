// src/commands/up.js
import { readdirSync, readFileSync, existsSync } from "fs";
import { join } from "path";
import db from "../db.js";
import { bootstrap } from "../bootstrap.js";

const MIGRATIONS_DIR = "./migrations";

export async function up() {
    await bootstrap();

    if (!existsSync(MIGRATIONS_DIR)) {
        console.log("No migrations directory found. Nothing to run.");
        return;
    }

    // get all .up.sql files, sorted ascending by filename (timestamp prefix ensures order)
    const files = readdirSync(MIGRATIONS_DIR)
        .filter((f) => f.endsWith(".up.sql"))
        .sort();

    if (files.length === 0) {
        console.log("No migration files found. Nothing to run.");
        return;
    }

    // get already applied migrations from db
    const [rows] = await db.execute("SELECT name FROM migrations");
    const applied = new Set(rows.map((r) => r.name));

    const pending = files
        .map((f) => ({ file: f, name: f.replace(".up.sql", "") }))
        .filter((m) => !applied.has(m.name));

    if (pending.length === 0) {
        console.log("Nothing to run. All migrations are up to date.");
        return;
    }

    console.log(`Running ${pending.length} migration(s)...`);

    await db.beginTransaction();

    try {
        for (const migration of pending) {
            const sql = readFileSync(
                join(MIGRATIONS_DIR, migration.file),
                "utf8",
            ).trim();

            if (!sql || sql.startsWith("--")) {
                console.warn(`  Skipping empty migration: ${migration.name}`);
                continue;
            }

            console.log(`  Applying: ${migration.name}`);
            await db.query(sql);
            await db.execute("INSERT INTO migrations (name) VALUES (?)", [
                migration.name,
            ]);
        }

        await db.commit();
        console.log("Done.");
    } catch (err) {
        await db.rollback();
        console.error(`Migration failed. All changes have been rolled back.`);
        console.error(err.message);
        process.exit(1);
    }
}
