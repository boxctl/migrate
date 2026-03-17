#!/usr/bin/env node
// migrate.js
import { create } from "./src/commands/create.js";
import { up } from "./src/commands/up.js";
import { down } from "./src/commands/down.js";
import { status } from "./src/commands/status.js";
import db from "./src/db.js";

const [, , command, ...args] = process.argv;

async function main() {
    switch (command) {
        case "create": {
            await create(args.join(" "));
            break;
        }
        case "up": {
            await up();
            break;
        }
        case "down": {
            await down(args[0] ?? 1);
            break;
        }
        case "status": {
            await status();
            break;
        }
        default: {
            console.log("");
            console.log("  Usage: migrate <command> [options]");
            console.log("");
            console.log("  Commands:");
            console.log("    create <name>   Create a new migration file pair");
            console.log("    up              Run all pending migrations");
            console.log(
                "    down [n]        Revert last n migrations (default: 1)",
            );
            console.log(
                "    status          Show applied and pending migrations",
            );
            console.log("");
            process.exit(command ? 1 : 0);
        }
    }
}

main()
    .catch((err) => {
        console.error("Unexpected error:", err.message);
        process.exit(1);
    })
    .finally(async () => {
        await db.end();
    });
