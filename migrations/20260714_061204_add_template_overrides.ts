import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * templates에 오버라이드 레이어 컬럼 추가: base_html(Figma import 원본) + overrides(앱 편집 diff).
 * 렌더 html은 이 둘의 합성 결과다. 재import는 base_html만 갱신하고 overrides를 유지해 앱 편집을 보존한다.
 *
 * 주의: migrate:create가 stale 스냅샷 때문에 07-13 변경분까지 재생성했으나, 그 컬럼들은 이미 각자
 * 마이그레이션으로 DB에 적용돼 있어 재추가하면 실패한다. 그래서 up/down은 이 변경(base_html·overrides)만 담는다.
 * 함께 커밋하는 .json 스냅샷은 전체 스키마를 담아(= 스냅샷 갭 치유) 이후 migrate:create가 올바른 증분 diff를 내게 한다.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
	await db.execute(sql`
  ALTER TABLE "templates" ADD COLUMN IF NOT EXISTS "base_html" varchar;
  ALTER TABLE "templates" ADD COLUMN IF NOT EXISTS "overrides" jsonb;
  ALTER TABLE "_templates_v" ADD COLUMN IF NOT EXISTS "version_base_html" varchar;
  ALTER TABLE "_templates_v" ADD COLUMN IF NOT EXISTS "version_overrides" jsonb;
  UPDATE "templates" SET "base_html" = "html" WHERE "html" IS NOT NULL AND "base_html" IS NULL;
  UPDATE "_templates_v" SET "version_base_html" = "version_html" WHERE "version_html" IS NOT NULL AND "version_base_html" IS NULL;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
	await db.execute(sql`
  ALTER TABLE "templates" DROP COLUMN IF EXISTS "base_html";
  ALTER TABLE "templates" DROP COLUMN IF EXISTS "overrides";
  ALTER TABLE "_templates_v" DROP COLUMN IF EXISTS "version_base_html";
  ALTER TABLE "_templates_v" DROP COLUMN IF EXISTS "version_overrides";`)
}
