// src/env.js
import { readFileSync, existsSync } from "fs";
import { parse } from "dotenv";

function loadEnv() {
    let envFile;
    let isProd;

    if (existsSync(".env.development")) {
        envFile = ".env.development";
        isProd = false;
    } else if (existsSync(".env")) {
        envFile = ".env";
        isProd = true;
    } else {
        console.error("No .env.development or .env file found.");
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
        isProd,
        envFile,
    };
}

export const env = loadEnv();
