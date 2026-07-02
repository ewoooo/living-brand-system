import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

// Baseline for databases that were already created by Payload dev push.
export async function up(_args: MigrateUpArgs): Promise<void> {
	// No-op: this migration only records the current schema snapshot.
}

export async function down(_args: MigrateDownArgs): Promise<void> {
	// No-op: baseline snapshots are not reversible.
}
