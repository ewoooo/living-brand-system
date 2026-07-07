import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Rule 스펙 정리 — 스키마 축소와 데이터 정합화를 한 번에 적용한다.
 * 1. value(기준값)를 evidence 앞부분에 병합하고 컬럼을 제거한다.
 * 2. title_ko를 title로 승격한다 (한글 표기가 단일 title이 된다).
 * 3. live 룰 key의 하이픈을 점 표기로 청산한다 (checker registry·시나리오와 동시 개정).
 * 4. archived messaging.tagline을 배치한 페이지를 후속 룰 messaging.visual.tagline로 교체한다.
 * 5. 사용처가 사라진 param_schema/scoring/input/notes/title_ko/value 컬럼을 제거한다.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
	// 1. 기준값 병합: value가 있으면 evidence 앞에 붙인다.
	await db.execute(sql`
		UPDATE rules
		SET evidence = CASE
			WHEN evidence IS NULL OR evidence = '' THEN value
			ELSE value || E'\n\n' || evidence
		END
		WHERE value IS NOT NULL AND value <> ''
	`)

	// 2. 한글 표기 승격.
	await db.execute(sql`
		UPDATE rules SET title = title_ko WHERE title_ko IS NOT NULL AND title_ko <> ''
	`)

	// 3. key 하이픈 → 점. archived는 개명 이력 보존을 위해 그대로 둔다 (unique 충돌 없음은 사전 검증).
	await db.execute(sql`
		UPDATE rules SET key = replace(key, '-', '.')
		WHERE status = 'live' AND key LIKE '%-%'
	`)

	// 4. archived 룰을 가리키는 배치 교정 (The Signature 페이지의 tagline 자리).
	await db.execute(sql`
		UPDATE guideline_pages_rules gpr
		SET rule_id = (SELECT id FROM rules WHERE key = 'messaging.visual.tagline')
		FROM rules archived_rule
		WHERE archived_rule.id = gpr.rule_id AND archived_rule.key = 'messaging.tagline'
	`)

	// 5. 스키마 축소.
	await db.execute(sql`
		ALTER TABLE rules
			DROP COLUMN IF EXISTS param_schema,
			DROP COLUMN IF EXISTS value,
			DROP COLUMN IF EXISTS scoring,
			DROP COLUMN IF EXISTS input,
			DROP COLUMN IF EXISTS notes,
			DROP COLUMN IF EXISTS title_ko
	`)
}

export async function down(_args: MigrateDownArgs): Promise<void> {
	// 병합·개명 전 원본을 복원할 수 없다. 되돌리려면 백업에서 복구한다. no-op.
}
