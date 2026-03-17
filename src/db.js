// src/db.js
import mysql from "mysql2/promise";
import { env } from "./env.js";

const connection = await mysql.createConnection({
    socketPath: env.DB_SOCK,
    database: env.DB_NAME,
    user: env.DB_USER,
    password: env.DB_PASS,
    multipleStatements: true,
});

export default connection;
