import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "templates" ADD COLUMN "generate_slug" boolean DEFAULT true;
  ALTER TABLE "templates" ADD COLUMN "slug" varchar;
  ALTER TABLE "_templates_v" ADD COLUMN "version_generate_slug" boolean DEFAULT true;
  ALTER TABLE "_templates_v" ADD COLUMN "version_slug" varchar;`)

  // 🔴 UNIQUE 인덱스를 만들기 전에 채운다. 기존 템플릿 이름은 한글이라 Payload slugify가
  // 전부 버려('환영 카드' → '-') 이름에서 뽑을 수 없다. id로 결정적·유일한 값을 넣고
  // generate_slug를 끈다 — 끄지 않으면 다음 저장에서 이름으로 다시 파생해 '-'로 덮인다.
  // 의미 있는 slug는 어드민이 나중에 교체한다(그때부터 그것이 URL이다).
  await db.execute(sql`
   UPDATE "templates" SET "slug" = 'template-' || "id", "generate_slug" = false WHERE "slug" IS NULL;
  UPDATE "_templates_v" SET "version_slug" = 'template-' || "parent_id", "version_generate_slug" = false WHERE "version_slug" IS NULL;`)

  await db.execute(sql`
   CREATE UNIQUE INDEX "templates_slug_idx" ON "templates" USING btree ("slug");
  CREATE INDEX "_templates_v_version_version_slug_idx" ON "_templates_v" USING btree ("version_slug");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "templates_slug_idx";
  DROP INDEX "_templates_v_version_version_slug_idx";
  ALTER TABLE "templates" DROP COLUMN "generate_slug";
  ALTER TABLE "templates" DROP COLUMN "slug";
  ALTER TABLE "_templates_v" DROP COLUMN "version_generate_slug";
  ALTER TABLE "_templates_v" DROP COLUMN "version_slug";`)
}
