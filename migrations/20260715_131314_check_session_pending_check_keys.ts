import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Snapshot-healing + single column migration.
// The two image_ratio snapshots (20260715_120000_image_ratio_contract.json,
// 20260715_120500_image_ratio_blocks.json) lost the check_scenarios tables and
// the criteria kind/operator/expected_value/max/unit columns during a parallel
// branch merge, so `migrate:create` diffed against a stale baseline. The
// sidecar .json emitted here re-establishes the full current schema as the
// diff baseline (same precedent as 20260714_085554_heal_snapshot). Everything
// stale was already applied by committed migrations (20260715_090505,
// 20260715_120000_add_check_scenarios), so the SQL below runs only the one
// genuinely new change: check_sessions.pending_check_keys.
// ponytail: hand-trimmed generated SQL; the .json snapshot carries the healing.
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
	await db.execute(sql`
   ALTER TABLE "check_sessions" ADD COLUMN "pending_check_keys" jsonb;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
	await db.execute(sql`
   ALTER TABLE "check_sessions" DROP COLUMN "pending_check_keys";`)
}
