// src/commands/create.js
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";

const MIGRATIONS_DIR = "./migrations";

export async function create(name) {
    if (!name || name.trim() === "") {
        throw new Error("Usage: migrate create <name>");
    }

    // sanitize name: lowercase, spaces to underscores, strip special chars
    const safeName = name
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, "");

    if (safeName === "") {
        throw new Error("Migration name is invalid after sanitization.");
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
        throw new Error(`Migration files for "${baseName}" already exist.`);
    }

    writeFileSync(upFile, `-- migrate up: ${safeName}\n`);
    writeFileSync(downFile, `-- migrate down: ${safeName}\n`);

    console.log(`Created:`);
    console.log(`  ${upFile}`);
    console.log(`  ${downFile}`);
}
