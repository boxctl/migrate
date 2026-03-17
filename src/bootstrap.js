// src/bootstrap.js
import db from "./db.js";

export async function bootstrap() {
    try {
        await db.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name        VARCHAR(255) NOT NULL UNIQUE,
      ran_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
    } catch (err) {
        console.error("Failed to initialize migrations table:");
        console.error(err.message);
        process.exit(1);
    }
}
