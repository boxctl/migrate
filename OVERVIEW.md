# @boxctl/migrate — Overview

## What this is

A minimal, roll-forward only SQL migration tool for MySQL/MariaDB accessed over a Unix socket. Built for a specific production setup — a rootless Podman-based server stack where direct socket access is available and simplicity is more valuable than features.

If you need rollbacks, multi-database support, or a general-purpose migration framework, use something else. This tool does one thing.

---

## Philosophy

Roll-forward only. Migrations are append-only history. If something goes wrong, you write a new migration that fixes it — you do not rewind. This is not a limitation, it is a deliberate constraint that keeps the mental model simple and the tool small.

The loose baseline is golang-migrate. Not in implementation, but in behavior and honesty about what it does. The dirty flag mechanism is taken directly from golang-migrate's approach: record intent before acting, not outcome after.

---

## How migrations work

Each migration is a single `.sql` file. The filename is a millisecond-precision UTC timestamp followed by a sanitized name. Lexicographic sort on the filename is the execution order — no separate ordering metadata, no manifest file.

When `up` runs a migration it does three things in order:

1. Insert a record into the `migrations` table with `dirty = true`
2. Execute the SQL
3. On success, update the record to `dirty = false`

This order matters. If the process is killed mid-migration, or the SQL fails, the record exists and is dirty. Nothing is silently lost. The dirty flag is evidence that something went wrong, not an absence of evidence that something succeeded.

---

## The dirty flag

A dirty migration means the schema is in an unknown state. `up` will refuse to run while any dirty records exist. This is intentional — running further migrations on top of an unknown state compounds the problem.

Resolution is manual. The developer inspects what happened, fixes the schema directly if needed, then clears or removes the dirty record. The tool does not try to be clever about recovery because recovery from a failed DDL migration in MySQL is inherently a human problem.

---

## Why no down command

MySQL and MariaDB do not support transactional DDL. `CREATE TABLE`, `ALTER TABLE`, `DROP TABLE` and similar statements are auto-committed the moment they execute. A rollback command gives a false sense of safety — you can run a `.down.sql` file but you are not rolling back, you are applying a new forward change that happens to be the inverse. That is just another migration.

Rolling forward with a corrective migration is honest about what is actually happening. The down command was removed to eliminate the illusion.

---

## Why no checksums

Checksums on applied migration files detect modifications after the fact, but in a roll-forward only system there is nothing actionable to do with that information. You cannot re-apply or roll back. A modified applied migration is a developer problem to reason about — the tool blocking `up` on a comment edit adds friction with no safety benefit.

---

## The migrations table

Five columns. `id` for ordering within the same second. `name` as the unique identifier matching the filename without extension. `dirty` as the state flag. `applied_at` as the timestamp. Nothing else.

The table is created automatically on first run of `up` or `status`. No separate setup step required.

---

## Environment and connectivity

Connection details are read from an env file. The default is `.env` in the working directory. A different file can be specified with `--env=<file>`, which makes it practical to use the same tool across development, staging, and production without changing anything except which env file is loaded.

Required variables are `DB_SOCK`, `DB_NAME`, `DB_USER`, and `DB_PASS`. Connection is over Unix socket only — no TCP, no host, no port. This matches the production setup this tool was built for.

---

## What the create command does and does not do

`create` is filesystem only. It does not touch the database or read the env file. It creates a single `.sql` file with a millisecond-precision timestamp prefix and a two-line comment header. The `refs:` line in the header is a convention for documenting dependencies between migrations — which other migration files this one relates to or builds on. It is not enforced by the tool.

---

## Scope

Three commands. One direction. One database driver. One connection method. The tool is not intended to grow beyond this.
