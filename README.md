# @boxctl/migrate

Minimal SQL migration tool for MySQL/MariaDB over Unix socket.

> **Note:** This tool was created for very specific needs. If it doesn't fit yours, don't use it.

## Usage

```bash
npx @boxctl/migrate <command>
```

### Commands

- `create <name>` — Create a new migration file pair
- `up` — Run pending migrations
- `down [n]` — Cleanup last n migrations (default: 1)
- `status` — Show migration status

### Options

- `--env=<file>` — Specify env file (default: .env)
- `--help` — Show help message

## Setup

Create a `.env` file in your project root:

```
DB_SOCKET=/var/run/mysqld/mysqld.sock
DB_NAME=your_database
DB_USER=username
DB_PASS=********
```

Use a different env file:

```bash
npx @boxctl/migrate up --env=.env.staging
```

## Migrations

Migrations are stored in `./migrations/` directory with two files per migration:

- `*.up.sql` — Migration to apply
- `*.down.sql` — Cleanup script (manual inverse, not automatic rollback)

> **Important:** `.down.sql` is manual cleanup, not automatic database rollback. Since MySQL DDL cannot be rolled back, you must write the inverse operation yourself.

## Requirements

- Node.js >= 24
- MySQL/MariaDB with Unix socket access
