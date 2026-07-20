import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

const enumNames = [
	'enum_guideline_docs_blocks_content_columns_image_ratio',
	'enum_guideline_docs_blocks_carousel_image_ratio',
	'enum_guideline_docs_blocks_media_showcase_image_ratio',
	'enum_guideline_docs_blocks_do_dont_image_ratio',
	'enum__guideline_docs_v_blocks_content_columns_image_ratio',
	'enum__guideline_docs_v_blocks_carousel_image_ratio',
	'enum__guideline_docs_v_blocks_media_showcase_image_ratio',
	'enum__guideline_docs_v_blocks_do_dont_image_ratio',
] as const

export async function up({ db }: MigrateUpArgs): Promise<void> {
	for (const enumName of enumNames) {
		await db.execute(sql.raw(`
			ALTER TYPE "public"."${enumName}" ADD VALUE IF NOT EXISTS 'original';
			ALTER TYPE "public"."${enumName}" ADD VALUE IF NOT EXISTS '2:1';
			ALTER TYPE "public"."${enumName}" ADD VALUE IF NOT EXISTS '7:3';
			ALTER TYPE "public"."${enumName}" ADD VALUE IF NOT EXISTS '3:4';
		`))
	}
}

// PostgreSQL enum 값 제거는 기존 문서 데이터를 무효화할 수 있어 down에서는 유지한다.
export async function down(_args: MigrateDownArgs): Promise<void> {}
