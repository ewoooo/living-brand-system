import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
	await db.execute(sql`
   CREATE TABLE "template_categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"display_order" numeric DEFAULT 0 NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "template_categories_locales" (
  	"title" varchar NOT NULL,
  	"generate_slug" boolean DEFAULT true,
  	"slug" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "templates" ADD COLUMN "category_id" integer;
  ALTER TABLE "_templates_v" ADD COLUMN "version_category_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "template_categories_id" integer;
  ALTER TABLE "template_categories_locales" ADD CONSTRAINT "template_categories_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."template_categories"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "template_categories_updated_at_idx" ON "template_categories" USING btree ("updated_at");
  CREATE INDEX "template_categories_created_at_idx" ON "template_categories" USING btree ("created_at");
  CREATE UNIQUE INDEX "template_categories_slug_idx" ON "template_categories_locales" USING btree ("slug","_locale");
  CREATE UNIQUE INDEX "template_categories_locales_locale_parent_id_unique" ON "template_categories_locales" USING btree ("_locale","_parent_id");
  ALTER TABLE "templates" ADD CONSTRAINT "templates_category_id_template_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."template_categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_templates_v" ADD CONSTRAINT "_templates_v_version_category_id_template_categories_id_fk" FOREIGN KEY ("version_category_id") REFERENCES "public"."template_categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_template_categories_fk" FOREIGN KEY ("template_categories_id") REFERENCES "public"."template_categories"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "templates_category_idx" ON "templates" USING btree ("category_id");
  CREATE INDEX "_templates_v_version_version_category_idx" ON "_templates_v" USING btree ("version_category_id");
  CREATE INDEX "payload_locked_documents_rels_template_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("template_categories_id");
  -- 백필: category는 앱 레벨에서 required라 기존 템플릿이 NULL이면 이후 저장이 전부 막힌다.
  -- 기존 템플릿이 있을 때만 기본 카테고리를 만들어 연결한다.
  DO $$
  DECLARE default_category_id integer;
  BEGIN
    IF EXISTS (SELECT 1 FROM "templates") THEN
      INSERT INTO "template_categories" ("display_order") VALUES (0) RETURNING "id" INTO default_category_id;
      INSERT INTO "template_categories_locales" ("title", "generate_slug", "slug", "_locale", "_parent_id")
        SELECT '기본', true, 'general', locale, default_category_id
        FROM unnest(enum_range(NULL::"_locales")) AS locale;
      UPDATE "templates" SET "category_id" = default_category_id WHERE "category_id" IS NULL;
      UPDATE "_templates_v" SET "version_category_id" = default_category_id WHERE "version_category_id" IS NULL;
    END IF;
  END $$;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
	await db.execute(sql`
   ALTER TABLE "template_categories" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "template_categories_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "template_categories" CASCADE;
  DROP TABLE "template_categories_locales" CASCADE;
  -- 위의 DROP TABLE ... CASCADE가 이 FK들을 이미 제거하므로 IF EXISTS가 없으면 롤백이 중단된다.
  ALTER TABLE "templates" DROP CONSTRAINT IF EXISTS "templates_category_id_template_categories_id_fk";

  ALTER TABLE "_templates_v" DROP CONSTRAINT IF EXISTS "_templates_v_version_category_id_template_categories_id_fk";

  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_template_categories_fk";
  
  DROP INDEX "templates_category_idx";
  DROP INDEX "_templates_v_version_version_category_idx";
  DROP INDEX "payload_locked_documents_rels_template_categories_id_idx";
  ALTER TABLE "templates" DROP COLUMN "category_id";
  ALTER TABLE "_templates_v" DROP COLUMN "version_category_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "template_categories_id";`)
}
