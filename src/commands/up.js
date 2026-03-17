// src/commands/up.js
import { readdirSync, readFileSync, existsSync } from "fs";
import { join } from "path";
import getDb from "../db.js";

const MIGRATIONS_DIR = "./migrations";

async function bootstrap(db) {
    await db.query(`
        CREATE TABLE IF NOT EXISTS migrations (
            id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            name       VARCHAR(255) NOT NULL UNIQUE,
            dirty      BOOLEAN DEFAULT FALSE,
            applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    `);
}

export async function up() {
    const db = await getDb();
    await bootstrap(db);

    const [dirtyRows] = await db.query("SELECT name FROM migrations WHERE dirty = TRUE");
    if (dirtyRows.length > 0) {
        const names = dirtyRows.map((r) => `  - ${r.name}`).join("\n");
        throw new Error(`Dirty migrations detected, resolve before running up:\n${names}`);
    }

    if (!existsSync(MIGRATIONS_DIR)) {
        console.log("No migrations directory found. Nothing to run.");
        return;
    }

    const files = readdirSync(MIGRATIONS_DIR)
        .filter((f) => f.endsWith(".sql"))
        .sort();

    if (files.length === 0) {
        console.log("No migration files found. Nothing to run.");
        return;
    }

    const [rows] = await db.query("SELECT name FROM migrations WHERE dirty = FALSE");
    const applied = new Set(rows.map((r) => r.name));

    const pending = files
        .map((f) => ({ file: f, name: f.replace(".sql", "") }))
        .filter((m) => !applied.has(m.name));

    if (pending.length === 0) {
        console.log("Nothing to run. All migrations are up to date.");
        return;
    }

    console.log(`Running ${pending.length} migration(s)...`);

    for (const migration of pending) {
        const sql = readFileSync(join(MIGRATIONS_DIR, migration.file), "utf8").trim();

        console.log(`  Applying: ${migration.name}`);

        await db.query("INSERT INTO migrations (name, dirty) VALUES (?, TRUE)", [migration.name]);

        try {
            await db.query(sql);
            await db.query("UPDATE migrations SET dirty = FALSE WHERE name = ?", [migration.name]);
        } catch (err) {
            throw new Error(`Migration failed: ${migration.name}\n${err.message}`);
        }
    }

    console.log("Done.");
}
