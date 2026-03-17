# @boxctl/migrate

Minimal SQL migration tool for MySQL/MariaDB over Unix socket.

> **Note:** This tool was created for very specific needs. If it doesn't fit yours, don't use it.

## Usage

```bash
npx @boxctl/migrate <command>
```

### Commands

- `create <name>` — Create a new migration
- `up` — Run pending migrations
- `down` — Rollback the last migration
- `status` — Show migration status

## Setup

Create a `.env` file in your project root:

```
DB_SOCKET=/var/run/mysqld/mysqld.sock
DB_NAME=your_database
DB_USER=username
DB_PASS=********
```

## Requirements

- Node.js >= 24
- MySQL/MariaDB with Unix socket access
