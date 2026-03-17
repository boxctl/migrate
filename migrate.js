// migrate.js
const [, , command, ...args] = process.argv;

if (command === "--help" || command === "-h" || !command) {
    console.log("");
    console.log("  Usage: migrate <command> [options]");
    console.log("");
    console.log("  Commands:");
    console.log("    create <name>   Create a new migration file pair");
    console.log("    up              Run all pending migrations");
    console.log("    down [n]        Cleanup last n migrations (default: 1)");
    console.log("    status          Show applied and pending migrations");
    console.log("");
    console.log("  Options:");
    console.log("    --env=<file>    Specify env file (default: .env)");
    console.log("    --help          Show this help message");
    console.log("");
    process.exit(command ? 0 : 1);
}

import { create } from "./src/commands/create.js";
import { up } from "./src/commands/up.js";
import { down } from "./src/commands/down.js";
import { status } from "./src/commands/status.js";
import getDb from "./src/db.js";

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
        default:
            throw new Error(`Unknown command: ${command}`);
    }
}

main()
    .catch((err) => {
        console.error(err.message);
        process.exit(1);
    })
    .finally(async () => {
        try {
            const db = await getDb();
            await db.end();
        } catch {
            // connection may already be closed or never opened
        }
    });
