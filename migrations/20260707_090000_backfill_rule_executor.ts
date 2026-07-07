import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * executor NULL 룰 백필. 053900 시드가 executor를 쓰지 않아 일부 룰이 NULL로 남았고,
 * 조회층의 `executor ?? 'deterministic'` 폴백 때문에 checker 없는 룰이 검수에서 조용히
 * 빠졌다. tier에서 유도해 채운다 (A=deterministic, B=heuristic, C=advisory).
 * NULL만 채우므로 관리자가 수동 지정한 값은 건드리지 않는다.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
	await db.execute(sql`
		UPDATE rules
		SET executor = (CASE tier
			WHEN 'A' THEN 'deterministic'
			WHEN 'B' THEN 'heuristic'
			ELSE 'advisory'
		END)::enum_rules_executor
		WHERE executor IS NULL
	`)
}

export async function down(_args: MigrateDownArgs): Promise<void> {
	// 백필 전의 NULL 집합을 복원할 수 없고, NULL로 되돌리면 검수 누락 결함이 재발한다. no-op.
}
