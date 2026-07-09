#!/usr/bin/env bash
set -euo pipefail

require_env() {
	if [[ -z "${!1:-}" ]]; then
		echo "$1 is required." >&2
		exit 1
	fi
}

require_cmd() {
	if ! command -v "$1" >/dev/null 2>&1; then
		echo "$1 is required." >&2
		exit 1
	fi
}

require_env LOCAL_DATABASE_URL
require_env REMOTE_DATABASE_URL

if [[ "${CONFIRM_REMOTE_REPLACE:-}" != "replace-remote" ]]; then
	echo "Set CONFIRM_REMOTE_REPLACE=replace-remote to overwrite the remote DB." >&2
	exit 1
fi

if [[ "$LOCAL_DATABASE_URL" == "$REMOTE_DATABASE_URL" ]]; then
	echo "LOCAL_DATABASE_URL and REMOTE_DATABASE_URL must be different." >&2
	exit 1
fi

require_cmd pg_dump
require_cmd pg_restore
require_cmd pnpm

backup_dir=".db-backups"
mkdir -p "$backup_dir"
ts=$(date +%Y%m%d-%H%M%S)
remote_backup="$backup_dir/remote-before-$ts.dump"
local_dump="$backup_dir/local-$ts.dump"

echo "Backing up remote DB to $remote_backup"
pg_dump -Fc --no-owner --no-acl "$REMOTE_DATABASE_URL" > "$remote_backup"

echo "Checking local migrations"
DATABASE_URL="$LOCAL_DATABASE_URL" pnpm migrate
DATABASE_URL="$LOCAL_DATABASE_URL" pnpm migrate:status

echo "Dumping local DB to $local_dump"
pg_dump -Fc --no-owner --no-acl "$LOCAL_DATABASE_URL" > "$local_dump"

echo "Replacing remote DB from local dump"
pg_restore --clean --if-exists --no-owner --no-acl -d "$REMOTE_DATABASE_URL" "$local_dump"

echo "Checking remote migrations"
DATABASE_URL="$REMOTE_DATABASE_URL" pnpm migrate
DATABASE_URL="$REMOTE_DATABASE_URL" pnpm migrate:status

echo "Done. Keep this rollback backup until verification passes: $remote_backup"
