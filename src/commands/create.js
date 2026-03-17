// src/commands/create.js
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";

const MIGRATIONS_DIR = "./migrations";

export async function create(name) {
    if (!name || name.trim() === "") {
        throw new Error("Usage: migrate create <name>");
    }

    const safeName = name
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, "");

    if (safeName === "") {
        throw new Error("Migration name is invalid after sanitization.");
    }

    const now = new Date();
    const pad = (n, l = 2) => String(n).padStart(l, "0");
    const timestamp =
        now.getUTCFullYear() +
        pad(now.getUTCMonth() + 1) +
        pad(now.getUTCDate()) +
        pad(now.getUTCHours()) +
        pad(now.getUTCMinutes()) +
        pad(now.getUTCSeconds()) +
        pad(now.getUTCMilliseconds(), 3);

    const baseName = `${timestamp}_${safeName}`;

    if (!existsSync(MIGRATIONS_DIR)) {
        mkdirSync(MIGRATIONS_DIR, { recursive: true });
    }

    const file = join(MIGRATIONS_DIR, `${baseName}.sql`);

    if (existsSync(file)) {
        throw new Error(`Migration file "${baseName}.sql" already exists.`);
    }

    writeFileSync(file, `-- ${baseName}.sql\n-- refs:\n`);

    console.log(`Created: ${file}`);
}
