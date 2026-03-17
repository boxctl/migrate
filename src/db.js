// src/db.js
import mysql from "mysql2/promise";

let connection;

export default async function getDb() {
    if (connection) return connection;

    const { env } = await import("./env.js");

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

    return connection;
}
