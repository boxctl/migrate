// src/commands/down.js
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { createInterface } from "readline";
import db from "../db.js";
import { bootstrap } from "../bootstrap.js";
import { env } from "../env.js";

const MIGRATIONS_DIR = "./migrations";

function prompt(question) {
    return new Promise((resolve) => {
        const rl = createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        const onSigint = () => {
            rl.close();
            console.log("\nAborted.");
            process.exit(0);
        };

        process.on("SIGINT", onSigint);

        rl.question(question, (answer) => {
            process.removeListener("SIGINT", onSigint);
            rl.close();
            resolve(answer.trim().toLowerCase());
        });
    });
}

export async function down(n = 1) {
    const count = parseInt(n, 10);

    if (isNaN(count) || count < 1) {
        console.error(
            "Usage: migrate down [n]  — n must be a positive integer",
        );
        process.exit(1);
    }

    await bootstrap();

    // get applied migrations, most recent first
    const [rows] = await db.query(
        "SELECT name FROM migrations ORDER BY ran_at DESC, id DESC LIMIT ?",
        [count],
    );

    if (rows.length === 0) {
        console.log("Nothing to revert. No migrations have been applied.");
        return;
    }

    const toRevert = rows.map((r) => r.name);

    console.log(`About to revert ${toRevert.length} migration(s):`);
    toRevert.forEach((name) => console.log(`  - ${name}`));

    if (env.isProd) {
        console.warn("\n  Warning: you are on production.\n");
    }

    const answer = await prompt("Are you sure? [y/N]: ");

    if (answer !== "y") {
        console.log("Aborted.");
        return;
    }

    for (const name of toRevert) {
        const downFile = join(MIGRATIONS_DIR, `${name}.down.sql`);

        if (!existsSync(downFile)) {
            console.error(`Down file not found for migration: ${name}`);
            console.error(`Expected: ${downFile}`);
            process.exit(1);
        }

        const sql = readFileSync(downFile, "utf8").trim();

        if (!sql || sql.startsWith("--")) {
            console.error(`Down file is empty for migration: ${name}`);
            process.exit(1);
        }

        console.log(`  Reverting: ${name}`);
        try {
            await db.query(sql);
            await db.query("DELETE FROM migrations WHERE name = ?", [name]);
        } catch (err) {
            console.error(`Revert failed: ${name}`);
            console.error(err.message);
            process.exit(1);
        }
    }

    console.log("Done.");
}
