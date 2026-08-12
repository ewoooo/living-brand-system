import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "tsw" ALTER COLUMN "panel_height" SET DEFAULT 480;
  ALTER TABLE "_tsw_v" ALTER COLUMN "panel_height" SET DEFAULT 480;`)

  // panel_height의 뜻이 '최소 높이'에서 '고정 높이'로 바뀐다. 버리는 padding_y를 높이에 접어 넣어야
  // 기존 인스턴스가 지금까지 차지하던 자리를 그대로 지킨다 — 안 하면 판이 갑자기 여백만큼 납작해진다.
  await db.execute(sql`
   UPDATE "tsw" SET "panel_height" = "panel_height" + COALESCE("padding_y", 0) * 2;
  UPDATE "_tsw_v" SET "panel_height" = "panel_height" + COALESCE("padding_y", 0) * 2;`)

  await db.execute(sql`
   ALTER TABLE "tsw" DROP COLUMN "padding_y";
  ALTER TABLE "_tsw_v" DROP COLUMN "padding_y";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "tsw" ALTER COLUMN "panel_height" SET DEFAULT 360;
  ALTER TABLE "_tsw_v" ALTER COLUMN "panel_height" SET DEFAULT 360;
  ALTER TABLE "tsw" ADD COLUMN "padding_y" numeric DEFAULT 96;
  ALTER TABLE "_tsw_v" ADD COLUMN "padding_y" numeric DEFAULT 96;`)
}
