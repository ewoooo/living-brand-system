import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
	await db.execute(sql`
		ALTER TYPE "public"."enum_guideline_docs_blocks_do_dont_image_ratio" ADD VALUE IF NOT EXISTS '3:2';
		ALTER TYPE "public"."enum_guideline_docs_blocks_do_dont_image_ratio" ADD VALUE IF NOT EXISTS '2:3';
		ALTER TYPE "public"."enum_guideline_docs_blocks_do_dont_image_ratio" ADD VALUE IF NOT EXISTS '4:5';
		ALTER TYPE "public"."enum_guideline_docs_blocks_do_dont_image_ratio" ADD VALUE IF NOT EXISTS '5:4';
		ALTER TYPE "public"."enum_guideline_docs_blocks_do_dont_image_ratio" ADD VALUE IF NOT EXISTS '9:16';
		ALTER TYPE "public"."enum__guideline_docs_v_blocks_do_dont_image_ratio" ADD VALUE IF NOT EXISTS '3:2';
		ALTER TYPE "public"."enum__guideline_docs_v_blocks_do_dont_image_ratio" ADD VALUE IF NOT EXISTS '2:3';
		ALTER TYPE "public"."enum__guideline_docs_v_blocks_do_dont_image_ratio" ADD VALUE IF NOT EXISTS '4:5';
		ALTER TYPE "public"."enum__guideline_docs_v_blocks_do_dont_image_ratio" ADD VALUE IF NOT EXISTS '5:4';
		ALTER TYPE "public"."enum__guideline_docs_v_blocks_do_dont_image_ratio" ADD VALUE IF NOT EXISTS '9:16';
	`)
}

// PostgreSQL enum 값 제거는 컬럼 타입 재생성과 데이터 변환이 필요해 down에서는 유지한다.
export async function down(_args: MigrateDownArgs): Promise<void> {}
