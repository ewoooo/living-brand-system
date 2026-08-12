import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Do/Don't 위젯이 쓰던 enum 3개를 레거시 do-dont 블록에서 떼어내 위젯 이름으로 옮긴다.
 *
 * 두 세대가 같은 enum 타입을 물리적으로 공유하고 있었다(ddw·_ddw_v·ddw_examples ↔
 * guideline_docs_blocks_do_dont·_groups). 레거시 블록을 먼저 지우면 살아 있는 위젯 컬럼의
 * 타입이 함께 사라지므로, 이 개명이 스키마 DROP보다 반드시 먼저 적용돼야 한다.
 *
 * ALTER TYPE RENAME은 타입 oid를 유지하므로 두 세대의 기존 컬럼이 모두 그대로 따라온다.
 */
const RENAMES: [string, string][] = [
	['enum_guideline_docs_blocks_do_dont_image_ratio', 'enum_ddw_image_ratio'],
	['enum_guideline_docs_blocks_do_dont_example_columns', 'enum_ddw_example_columns'],
	['enum_guideline_docs_blocks_do_dont_groups_kind', 'enum_ddw_examples_kind'],
]

export async function up({ db }: MigrateUpArgs): Promise<void> {
	for (const [from, to] of RENAMES) {
		await db.execute(
			sql.raw(`ALTER TYPE "public"."${from}" RENAME TO "${to}";`),
		)
	}
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
	for (const [from, to] of RENAMES) {
		await db.execute(
			sql.raw(`ALTER TYPE "public"."${to}" RENAME TO "${from}";`),
		)
	}
}
