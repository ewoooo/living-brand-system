import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "rules" ADD COLUMN "messages_pass" varchar;
  ALTER TABLE "rules" ADD COLUMN "messages_ok" varchar;
  ALTER TABLE "rules" ADD COLUMN "messages_needs_review" varchar;
  ALTER TABLE "rules" ADD COLUMN "messages_fail" varchar;
  UPDATE "rules"
  SET
    "messages_pass" = '{facts.closestFormat} 규격 비율에 맞습니다.',
    "messages_fail" = '캔버스가 스테이셔너리 규격과 다릅니다. {facts.allowedFormats} 중 선택한 산출물 규격에 맞춰 조정하세요.'
  WHERE "key" = 'application.stationery.format';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "rules" DROP COLUMN "messages_pass";
  ALTER TABLE "rules" DROP COLUMN "messages_ok";
  ALTER TABLE "rules" DROP COLUMN "messages_needs_review";
  ALTER TABLE "rules" DROP COLUMN "messages_fail";`)
}
