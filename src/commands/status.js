// src/commands/status.js
import { readdirSync, existsSync } from "fs";
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

function formatDate(d) {
    return new Date(d).toISOString().replace("T", " ").slice(0, 19);
}

export async function status() {
    const db = await getDb();
    await bootstrap(db);

    const [dbRows] = await db.query(
        "SELECT name, dirty, applied_at FROM migrations ORDER BY applied_at ASC, id ASC",
    );

    const dbMap = new Map(dbRows.map((r) => [r.name, r]));

    const files = existsSync(MIGRATIONS_DIR)
        ? readdirSync(MIGRATIONS_DIR)
              .filter((f) => f.endsWith(".sql"))
              .sort()
              .map((f) => f.replace(".sql", ""))
        : [];

    const fileSet = new Set(files);
    const allNames = [...new Set([...files, ...dbMap.keys()])];

    if (allNames.length === 0) {
        console.log("No migrations found.");
        return;
    }

    const dirty = dbRows.filter((r) => r.dirty);

    if (dirty.length > 0) {
        console.log("\n  ! DIRTY MIGRATIONS\n");
        console.table(dirty.map((r) => ({ Migration: r.name, "Applied At": formatDate(r.applied_at) })));
    }

    const rows = allNames.map((name) => {
        const rec = dbMap.get(name);
        if (!rec) return { Migration: name, Status: "pending", "Applied At": "" };
        if (rec.dirty) return { Migration: name, Status: "dirty", "Applied At": formatDate(rec.applied_at) };
        if (!fileSet.has(name)) return { Migration: name, Status: "missing", "Applied At": formatDate(rec.applied_at) };
        return { Migration: name, Status: "applied", "Applied At": formatDate(rec.applied_at) };
    });

    console.log("");
    console.table(rows);

    const counts = {
        applied: rows.filter((r) => r.Status === "applied").length,
        pending: rows.filter((r) => r.Status === "pending").length,
        dirty: dirty.length,
        missing: rows.filter((r) => r.Status === "missing").length,
    };

    const summary = [
        `${counts.applied} applied`,
        `${counts.pending} pending`,
        ...(counts.dirty > 0 ? [`${counts.dirty} dirty`] : []),
        ...(counts.missing > 0 ? [`${counts.missing} missing`] : []),
    ].join(", ");

    console.log(`  ${summary}\n`);
}
