// src/commands/status.js
import { readdirSync, existsSync } from "fs";
import { join } from "path";
import db from "../db.js";
import { bootstrap } from "../bootstrap.js";

const MIGRATIONS_DIR = "./migrations";

export async function status() {
    await bootstrap();

    const [rows] = await db.execute(
        "SELECT name, ran_at FROM migrations ORDER BY ran_at ASC, id ASC",
    );

    const applied = new Map(rows.map((r) => [r.name, r.ran_at]));

    const files = existsSync(MIGRATIONS_DIR)
        ? readdirSync(MIGRATIONS_DIR)
              .filter((f) => f.endsWith(".up.sql"))
              .sort()
              .map((f) => f.replace(".up.sql", ""))
        : [];

    // migrations on disk but not in db
    const pending = files.filter((name) => !applied.has(name));

    // migrations in db but no file on disk (deleted/lost)
    const missing = [...applied.keys()].filter((name) => !files.includes(name));

    if (applied.size === 0 && pending.length === 0) {
        console.log("No migrations found.");
        return;
    }

    const PAD = 42;

    console.log("");
    console.log(`  ${"Migration".padEnd(PAD)} ${"Status".padEnd(12)} Ran At`);
    console.log(`  ${"─".repeat(PAD)} ${"─".repeat(12)} ${"─".repeat(20)}`);

    for (const name of files) {
        if (applied.has(name)) {
            const ranAt = new Date(applied.get(name))
                .toISOString()
                .replace("T", " ")
                .slice(0, 19);
            console.log(
                `  ${name.padEnd(PAD)} ${"applied".padEnd(12)} ${ranAt}`,
            );
        } else {
            console.log(`  ${name.padEnd(PAD)} ${"pending".padEnd(12)}`);
        }
    }

    for (const name of missing) {
        const ranAt = new Date(applied.get(name))
            .toISOString()
            .replace("T", " ")
            .slice(0, 19);
        console.log(`  ${name.padEnd(PAD)} ${"! missing".padEnd(12)} ${ranAt}`);
    }

    console.log("");
    console.log(
        `  ${applied.size} applied, ${pending.length} pending${missing.length > 0 ? `, ${missing.length} missing file(s)` : ""}`,
    );
    console.log("");
}
