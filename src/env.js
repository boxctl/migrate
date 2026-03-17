// src/env.js
import { readFileSync, existsSync } from "fs";
import { parse } from "dotenv";

function parseArgs() {
    const args = process.argv.slice(2);
    let envFile = null;

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === "--env" && i + 1 < args.length) {
            envFile = args[i + 1];
            break;
        }
        if (arg.startsWith("--env=")) {
            envFile = arg.replace("--env=", "");
            break;
        }
    }

    return envFile;
}

function loadEnv() {
    const envArg = parseArgs();

    let envFile;

    if (envArg) {
        envFile = envArg;
    } else if (existsSync(".env")) {
        envFile = ".env";
    } else {
        console.error("No .env file found. Use --env to specify a different file.");
        process.exit(1);
    }

    if (!existsSync(envFile)) {
        console.error(`Env file not found: ${envFile}`);
        process.exit(1);
    }

    const raw = readFileSync(envFile, "utf8");
    const parsed = parse(raw);

    const required = ["DB_SOCK", "DB_NAME", "DB_USER", "DB_PASS"];
    const missing = required.filter((k) => !parsed[k]);

    if (missing.length > 0) {
        console.error(
            `Missing required variables in ${envFile}: ${missing.join(", ")}`,
        );
        process.exit(1);
    }

    return {
        DB_SOCK: parsed.DB_SOCK,
        DB_NAME: parsed.DB_NAME,
        DB_USER: parsed.DB_USER,
        DB_PASS: parsed.DB_PASS,
        envFile,
    };
}

export const env = loadEnv();
