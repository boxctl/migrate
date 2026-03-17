# @boxctl/migrate

Minimal roll-forward SQL migration tool for MySQL/MariaDB over Unix socket.

> **Note:** This tool was created for very specific needs. If it doesn't fit yours, don't use it.

## Usage

```bash
npx @boxctl/migrate <command>
```

### Commands

- `create <name>` — Create a new migration file
- `up` — Run pending migrations
- `status` — Show migration status

### Options

- `--env=<file>` — Specify env file (default: .env)
- `--help` — Show help message

## Setup

Create a `.env` file in your project root:

```
DB_SOCK=/var/run/mysqld/mysqld.sock
DB_NAME=your_database
DB_USER=username
DB_PASS=********
```

Use a different env file:

```bash
npx @boxctl/migrate up --env=.env.staging
```

## Migrations

Migrations are stored in `./migrations/` as single `.sql` files:

- `YYYYMMDDHHmmssSSS_name.sql` — Migration to apply

Each file is created with a header:

```sql
-- 20260317120000000_create_users.sql
-- refs:
```

Use `refs:` to document any other migration files this one depends on or modifies.

> **Important:** This is a roll-forward only system. There is no down command. Write migrations accordingly.

## How it works

For each pending migration `up` will:

1. Insert a record with `dirty = true`
2. Execute the SQL
3. On success — update to `dirty = false`
4. On failure — leave as `dirty = true` and stop

A dirty migration means something went wrong. Fix the issue manually then resolve the dirty flag in the database before running `up` again.

## Requirements

- Node.js >= 24
- MySQL/MariaDB with Unix socket access
