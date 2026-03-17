// migrate.js
const [, , command, ...args] = process.argv;

if (command === "--help" || command === "-h" || !command) {
    console.log("");
    console.log("  Usage: migrate <command> [options]");
    console.log("");
    console.log("  Commands:");
    console.log("    create <name>   Create a new migration file");
    console.log("    up              Run all pending migrations");
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
import { status } from "./src/commands/status.js";
import { closeDb } from "./src/db.js";

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
        await closeDb();
    });
