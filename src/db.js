// src/db.js
import mysql from "mysql2/promise";
import { env } from "./env.js";

let connection;

try {
    connection = await mysql.createConnection({
        socketPath: env.DB_SOCK,
        database: env.DB_NAME,
        user: env.DB_USER,
        password: env.DB_PASS,
        multipleStatements: true,
    });
} catch (err) {
    console.error(`Failed to connect to database:`);
    console.error(`  Socket: ${env.DB_SOCK}`);
    console.error(`  Database: ${env.DB_NAME}`);
    console.error(`  User: ${env.DB_USER}`);
    console.error(`  Error: ${err.message}`);
    process.exit(1);
}

export default connection;
