// src/commands/up.js
import { readdirSync, readFileSync, existsSync } from "fs";
import { createHash } from "crypto";
import { join } from "path";
import getDb from "../db.js";
import { bootstrap } from "../bootstrap.js";

const MIGRATIONS_DIR = "./migrations";

function checksum(sql) {
    return createHash("sha256").update(sql, "utf8").digest("hex");
}

function isSqlEmpty(sql) {
    const lines = sql.split("\n");
    return lines.every((line) => {
        const trimmed = line.trim();
        return trimmed === "" || trimmed.startsWith("--");
    });
}

export async function up() {
    const db = await getDb();
    await bootstrap();

    const [dirtyRows] = await db.query("SELECT name FROM migrations WHERE dirty = true");
    if (dirtyRows.length > 0) {
        throw new Error(
            "Database is in dirty state. Fix the issue manually, then clear the dirty flag in the database.",
        );
    }

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
    const [rows] = await db.query("SELECT name, checksum FROM migrations WHERE dirty = false");
    const applied = new Map(rows.map((r) => [r.name, r.checksum]));

    const pending = files
        .map((f) => ({ file: f, name: f.replace(".up.sql", "") }))
        .filter((m) => !applied.has(m.name));

    const checksumMismatch = [];
    for (const f of files) {
        const name = f.replace(".up.sql", "");
        if (applied.has(name)) {
            const sql = readFileSync(join(MIGRATIONS_DIR, f), "utf8").trim();
            const fileChecksum = checksum(sql);
            if (fileChecksum !== applied.get(name)) {
                checksumMismatch.push(name);
            }
        }
    }

    if (checksumMismatch.length > 0) {
        console.error("Migration file(s) modified after being applied:");
        checksumMismatch.forEach((name) => console.error(`  - ${name}`));
        throw new Error("Restore the original file(s) or manually fix the database.");
    }

    if (pending.length === 0) {
        console.log("Nothing to run. All migrations are up to date.");
        return;
    }

    console.log(`Running ${pending.length} migration(s)...`);

    for (const migration of pending) {
        const downFile = join(MIGRATIONS_DIR, `${migration.name}.down.sql`);

        if (!existsSync(downFile)) {
            throw new Error(
                `Missing down file for migration: ${migration.name}\nExpected: ${downFile}`,
            );
        }

        const sql = readFileSync(
            join(MIGRATIONS_DIR, migration.file),
            "utf8",
        ).trim();

        if (isSqlEmpty(sql)) {
            throw new Error(
                `Migration ${migration.name} contains no SQL (only comments/whitespace). Add SQL or delete the migration files.`,
            );
        }

        console.log(`  Applying: ${migration.name}`);
        try {
            await db.query(sql);
            const fileChecksum = checksum(sql);
            await db.query("INSERT INTO migrations (name, checksum) VALUES (?, ?)", [
                migration.name,
                fileChecksum,
            ]);
        } catch (err) {
            const fileChecksum = checksum(sql);
            try {
                await db.query(
                    "INSERT INTO migrations (name, checksum, dirty) VALUES (?, ?, true)",
                    [migration.name, fileChecksum],
                );
            } catch (insertErr) {
                console.error("Warning: failed to record migration failure:", insertErr.message);
            }
            throw new Error(`Migration failed: ${migration.name}\n${err.message}`);
        }
    }

    console.log("Done.");
}
