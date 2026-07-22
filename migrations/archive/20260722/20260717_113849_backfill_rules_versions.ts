import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
	// 094613(extract_rules_collection)이 임베디드 Check를 rules 메인 테이블로만 이관하고
	// _rules_v 버전 행을 만들지 않았다. drafts가 켜진 컬렉션의 Admin 목록과 draft 조회는
	// _rules_v의 latest=true 행을 읽으므로, 버전 행이 없는 rule은 목록에서 보이지 않는다.
	// 여기서 각 rule의 현재 상태를 latest published 버전으로 백필한다.
	// snapshot/published_locale은 일반 발행(전체 locale)과 동일하게 NULL로 둔다.
	await db.execute(sql`
		INSERT INTO "_rules_v" (
			"parent_id", "version_title", "version_title_ko", "version_key", "version_tier",
			"version_executor", "version_checker_id", "version_options", "version_heuristic_prompt",
			"version_messages_pass", "version_messages_ok", "version_messages_needs_review",
			"version_messages_fail", "version_updated_at", "version_created_at", "version__status",
			"created_at", "updated_at", "latest"
		)
		SELECT
			r."id", r."title", r."title_ko", r."key",
			r."tier"::text::"public"."enum__rules_v_version_tier",
			r."executor"::text::"public"."enum__rules_v_version_executor",
			r."checker_id", r."options", r."heuristic_prompt",
			r."messages_pass", r."messages_ok", r."messages_needs_review",
			r."messages_fail", r."updated_at", r."created_at",
			r."_status"::text::"public"."enum__rules_v_version_status",
			r."updated_at", r."updated_at", true
		FROM "rules" r
		WHERE NOT EXISTS (SELECT 1 FROM "_rules_v" v WHERE v."parent_id" = r."id")
	`)

	// criteria 배열도 버전 행으로 복사한다. _uuid에 메인 테이블의 varchar id를 보존해
	// 재발행 시 CheckSession.rulesetSnapshot이 참조하는 criteria id가 유지되게 한다.
	await db.execute(sql`
		INSERT INTO "_rules_v_version_criteria" (
			"_order", "_parent_id", "question", "kind", "expected", "operator",
			"expected_value", "max", "unit", "_uuid"
		)
		SELECT
			c."_order", v."id", c."question", c."kind", c."expected", c."operator",
			c."expected_value", c."max", c."unit", c."id"
		FROM "rules_criteria" c
		JOIN "_rules_v" v ON v."parent_id" = c."_parent_id" AND v."latest" = true
		WHERE NOT EXISTS (
			SELECT 1 FROM "_rules_v_version_criteria" x WHERE x."_parent_id" = v."id"
		)
	`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
	// 데이터 백필 전용 마이그레이션. 백필된 행과 이후 편집으로 생긴 버전 행을 구분할 수
	// 없으므로 down에서는 아무것도 복원하지 않는다.
}
