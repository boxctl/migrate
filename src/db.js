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
        console.error(`Failed to connect to database: ${err.message}`);
        process.exit(1);
    }

    return connection;
}

export async function closeDb() {
    if (!connection) return;
    try {
        await connection.end();
    } catch {
        // connection may already be closed
    }
}
