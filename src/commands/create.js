// src/commands/create.js
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";

const MIGRATIONS_DIR = "./migrations";

export async function create(name) {
    if (!name || name.trim() === "") {
        console.error("Usage: migrate create <name>");
        process.exit(1);
    }

    // sanitize name: lowercase, spaces to underscores, strip special chars
    const safeName = name
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, "");

    if (safeName === "") {
        console.error("Migration name is invalid after sanitization.");
        process.exit(1);
    }

    const now = new Date();
    const timestamp = now
        .toISOString()
        .replace(/[-T:Z]/g, "")
        .replace(".", "")
        .slice(0, 17);
    const baseName = `${timestamp}_${safeName}`;

    if (!existsSync(MIGRATIONS_DIR)) {
        mkdirSync(MIGRATIONS_DIR, { recursive: true });
    }

    const upFile = join(MIGRATIONS_DIR, `${baseName}.up.sql`);
    const downFile = join(MIGRATIONS_DIR, `${baseName}.down.sql`);

    if (existsSync(upFile) || existsSync(downFile)) {
        console.error(`Migration files for "${baseName}" already exist.`);
        process.exit(1);
    }

    writeFileSync(upFile, `-- migrate up: ${safeName}\n`);
    writeFileSync(downFile, `-- migrate down: ${safeName}\n`);

    console.log(`Created:`);
    console.log(`  ${upFile}`);
    console.log(`  ${downFile}`);
}
