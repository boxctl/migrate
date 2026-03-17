// src/bootstrap.js
import db from "./db.js";

export async function bootstrap() {
    await db.execute(`
    CREATE TABLE IF NOT EXISTS migrations (
      id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name        VARCHAR(255) NOT NULL UNIQUE,
      ran_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
}
