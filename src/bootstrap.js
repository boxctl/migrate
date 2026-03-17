// src/bootstrap.js
import getDb from "./db.js";

export async function bootstrap() {
    const db = await getDb();
    try {
        await db.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name      VARCHAR(255) NOT NULL UNIQUE,
      checksum  VARCHAR(64),
      dirty     BOOLEAN DEFAULT FALSE,
      ran_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
    } catch (err) {
        console.error("Failed to initialize migrations table:");
        console.error(err.message);
        process.exit(1);
    }
}
