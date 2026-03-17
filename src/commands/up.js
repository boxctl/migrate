// src/commands/up.js
import { readdirSync, readFileSync, existsSync } from "fs";
import { join } from "path";
import db from "../db.js";
import { bootstrap } from "../bootstrap.js";

const MIGRATIONS_DIR = "./migrations";

function isSqlEmpty(sql) {
    const lines = sql.split("\n");
    return lines.every((line) => {
        const trimmed = line.trim();
        return trimmed === "" || trimmed.startsWith("--");
    });
}

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
    const [rows] = await db.query("SELECT name FROM migrations");
    const applied = new Set(rows.map((r) => r.name));

    const pending = files
        .map((f) => ({ file: f, name: f.replace(".up.sql", "") }))
        .filter((m) => !applied.has(m.name));

    if (pending.length === 0) {
        console.log("Nothing to run. All migrations are up to date.");
        return;
    }

    console.log(`Running ${pending.length} migration(s)...`);

    for (const migration of pending) {
        const downFile = join(MIGRATIONS_DIR, `${migration.name}.down.sql`);

        if (!existsSync(downFile)) {
            console.error(`Missing down file for migration: ${migration.name}`);
            console.error(`Expected: ${downFile}`);
            process.exit(1);
        }

        const sql = readFileSync(
            join(MIGRATIONS_DIR, migration.file),
            "utf8",
        ).trim();

        if (isSqlEmpty(sql)) {
            console.error(
                `Migration ${migration.name} contains no SQL (only comments/whitespace).`,
            );
            console.error(`Add SQL or delete the migration files.`);
            process.exit(1);
        }

        console.log(`  Applying: ${migration.name}`);
        try {
            await db.query(sql);
            await db.query("INSERT INTO migrations (name) VALUES (?)", [
                migration.name,
            ]);
        } catch (err) {
            console.error(`Migration failed: ${migration.name}`);
            console.error(err.message);
            process.exit(1);
        }
    }

    console.log("Done.");
}
