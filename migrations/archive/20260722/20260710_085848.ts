import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "templates_template_checks" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"check_key" varchar
  );
  
  CREATE TABLE "templates_template_checks_locales" (
  	"body" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "_templates_v_version_template_checks" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"check_key" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_templates_v_version_template_checks_locales" (
  	"body" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "payload_mcp_api_keys" RENAME COLUMN "payload_mcp_tool_find_rules" TO "payload_mcp_tool_find_checks";
  ALTER TABLE "agent_settings" ALTER COLUMN "product_information" SET DEFAULT 'This product turns published brand guidelines, resources, templates, and checks into operational standards creators can use during production work.';
  ALTER TABLE "agent_settings" ALTER COLUMN "available_tools" SET DEFAULT 'Guideline tools can list, search, and read published guideline context. Template tools can find published templates with template checks and prepare downloadable template image attachments from open slot values. Check tools can list supported check scenarios and inspect attached images using these scenarios: quick (빠른 기본 검수), image-mood (이미지 무드 검수), sns (SNS 콘텐츠 검수), web-visual (웹/비주얼 템플릿 검수), advertisement (광고 검수), stationery (명함/스테이셔너리 검수).';
  ALTER TABLE "templates_template_checks" ADD CONSTRAINT "templates_template_checks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."templates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "templates_template_checks_locales" ADD CONSTRAINT "templates_template_checks_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."templates_template_checks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_templates_v_version_template_checks" ADD CONSTRAINT "_templates_v_version_template_checks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_templates_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_templates_v_version_template_checks_locales" ADD CONSTRAINT "_templates_v_version_template_checks_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_templates_v_version_template_checks"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "templates_template_checks_order_idx" ON "templates_template_checks" USING btree ("_order");
  CREATE INDEX "templates_template_checks_parent_id_idx" ON "templates_template_checks" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "templates_template_checks_locales_locale_parent_id_unique" ON "templates_template_checks_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_templates_v_version_template_checks_order_idx" ON "_templates_v_version_template_checks" USING btree ("_order");
  CREATE INDEX "_templates_v_version_template_checks_parent_id_idx" ON "_templates_v_version_template_checks" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_templates_v_version_template_checks_locales_locale_parent_i" ON "_templates_v_version_template_checks_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "templates_template_checks" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "templates_template_checks_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_templates_v_version_template_checks" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_templates_v_version_template_checks_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "templates_template_checks" CASCADE;
  DROP TABLE "templates_template_checks_locales" CASCADE;
  DROP TABLE "_templates_v_version_template_checks" CASCADE;
  DROP TABLE "_templates_v_version_template_checks_locales" CASCADE;
  ALTER TABLE "payload_mcp_api_keys" RENAME COLUMN "payload_mcp_tool_find_checks" TO "payload_mcp_tool_find_rules";
  ALTER TABLE "agent_settings" ALTER COLUMN "product_information" SET DEFAULT 'This product turns published brand guidelines, resources, templates, and rules into operational standards creators can use during production work.';
  ALTER TABLE "agent_settings" ALTER COLUMN "available_tools" SET DEFAULT 'Guideline tools can list, search, and read published guideline context. Template tools can find published templates with template rules and prepare downloadable template image attachments from open slot values. Check tools can list supported check scenarios and inspect attached images using these scenarios: quick (빠른 기본 검수), image-mood (이미지 무드 검수), sns (SNS 콘텐츠 검수), web-visual (웹/비주얼 템플릿 검수), advertisement (광고 검수), stationery (명함/스테이셔너리 검수).';`)
}
