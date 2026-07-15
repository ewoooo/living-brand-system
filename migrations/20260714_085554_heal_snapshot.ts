import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'

// Snapshot-healing migration (no-op). See docs/NEXT.md §GAP.
// The bidirectional stage<->figma merge left the latest drizzle snapshot
// (20260714_061204_add_template_overrides.json) holding the *pre-refactor*
// guideline schema, so the sidecar .json emitted here re-establishes the
// current config as the diff baseline for future `migrate:create` runs.
// The schema this diff describes was already created by the committed
// migration chain (023146~061204, all applied), so up/down execute nothing.
// ponytail: intentional no-op body; the value is the .json snapshot, not the SQL.
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {}
