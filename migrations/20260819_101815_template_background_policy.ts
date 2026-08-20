import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// 🔴 손으로 편집한 마이그레이션이다 — `migrate:create`가 낡은 스냅샷 기준으로 diff해
// 이 변경과 무관한 `cil`·`_cil_v`(CI 락업 위젯) 테이블 생성/삭제 구문을 함께 냈다.
// 원인: `20260818_024535_generated_image_source_image`의 스냅샷이 `cil`을 잃었다
// (그 마이그레이션의 실제 SQL은 cil을 건드리지 않는다 — 스냅샷 JSON만 회귀했다).
// 이 파일이 생성한 새 스냅샷(.json)은 cil을 다시 담고 있으므로 다음 `migrate:create`부터는
// 정상 diff된다. 과거 스냅샷은 고치지 않았다 — 더 이상 diff 기준으로 쓰이지 않는다.
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "templates" ADD COLUMN "background_policy" jsonb;
  ALTER TABLE "_templates_v" ADD COLUMN "version_background_policy" jsonb;
  ALTER TABLE "templates" DROP COLUMN "controller_restrictions";
  ALTER TABLE "templates" DROP COLUMN "controller_presentation";
  ALTER TABLE "_templates_v" DROP COLUMN "version_controller_restrictions";
  ALTER TABLE "_templates_v" DROP COLUMN "version_controller_presentation";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "templates" ADD COLUMN "controller_restrictions" jsonb;
  ALTER TABLE "templates" ADD COLUMN "controller_presentation" jsonb;
  ALTER TABLE "_templates_v" ADD COLUMN "version_controller_restrictions" jsonb;
  ALTER TABLE "_templates_v" ADD COLUMN "version_controller_presentation" jsonb;
  ALTER TABLE "templates" DROP COLUMN "background_policy";
  ALTER TABLE "_templates_v" DROP COLUMN "version_background_policy";`)
}
