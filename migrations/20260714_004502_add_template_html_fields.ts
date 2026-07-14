import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// 주: migrate:create가 code_css/code_js도 재추가하려 했으나(머지 스냅샷 갭) 이미 20260710_075515에서 추가됨 → 제거.
// html/width/height만 신규 추가한다. 이 마이그레이션의 .json 스냅샷은 code 필드를 포함해 갭을 정정한다.
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "templates" ADD COLUMN "html" varchar;
  ALTER TABLE "templates" ADD COLUMN "width" numeric;
  ALTER TABLE "templates" ADD COLUMN "height" numeric;
  ALTER TABLE "_templates_v" ADD COLUMN "version_html" varchar;
  ALTER TABLE "_templates_v" ADD COLUMN "version_width" numeric;
  ALTER TABLE "_templates_v" ADD COLUMN "version_height" numeric;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "templates" DROP COLUMN "html";
  ALTER TABLE "templates" DROP COLUMN "width";
  ALTER TABLE "templates" DROP COLUMN "height";
  ALTER TABLE "_templates_v" DROP COLUMN "version_html";
  ALTER TABLE "_templates_v" DROP COLUMN "version_width";
  ALTER TABLE "_templates_v" DROP COLUMN "version_height";`)
}
