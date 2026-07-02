import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
	await db.execute(sql`
   CREATE TABLE "template_assets" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  ALTER TABLE "_brand_logos_v" DROP CONSTRAINT "_brand_logos_v_parent_id_brand_logos_id_fk";
  
  ALTER TABLE "_brand_colors_v" DROP CONSTRAINT "_brand_colors_v_parent_id_brand_colors_id_fk";
  
  ALTER TABLE "payload_mcp_api_keys" DROP CONSTRAINT "payload_mcp_api_keys_user_id_users_id_fk";
  
  ALTER TABLE "templates" ADD COLUMN "json_template" jsonb;
  ALTER TABLE "templates" ADD COLUMN "source_url" varchar;
  ALTER TABLE "_templates_v" ADD COLUMN "version_json_template" jsonb;
  ALTER TABLE "_templates_v" ADD COLUMN "version_source_url" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "template_assets_id" integer;
  CREATE INDEX "template_assets_updated_at_idx" ON "template_assets" USING btree ("updated_at");
  CREATE INDEX "template_assets_created_at_idx" ON "template_assets" USING btree ("created_at");
  CREATE UNIQUE INDEX "template_assets_filename_idx" ON "template_assets" USING btree ("filename");
  ALTER TABLE "_brand_logos_v" ADD CONSTRAINT "_brand_logos_v_parent_id_brand_logos_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."brand_logos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_brand_colors_v" ADD CONSTRAINT "_brand_colors_v_parent_id_brand_colors_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."brand_colors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_mcp_api_keys" ADD CONSTRAINT "payload_mcp_api_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_template_assets_fk" FOREIGN KEY ("template_assets_id") REFERENCES "public"."template_assets"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_template_assets_id_idx" ON "payload_locked_documents_rels" USING btree ("template_assets_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
	await db.execute(sql`
   ALTER TABLE "template_assets" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "template_assets" CASCADE;
  ALTER TABLE "_brand_logos_v" DROP CONSTRAINT "_brand_logos_v_parent_id_brand_logos_id_fk";
  
  ALTER TABLE "_brand_colors_v" DROP CONSTRAINT "_brand_colors_v_parent_id_brand_colors_id_fk";
  
  ALTER TABLE "payload_mcp_api_keys" DROP CONSTRAINT "payload_mcp_api_keys_user_id_users_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_template_assets_fk";
  
  DROP INDEX "payload_locked_documents_rels_template_assets_id_idx";
  ALTER TABLE "_brand_logos_v" ADD CONSTRAINT "_brand_logos_v_parent_id_brand_logos_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."brand_logos"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_brand_colors_v" ADD CONSTRAINT "_brand_colors_v_parent_id_brand_colors_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."brand_colors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_mcp_api_keys" ADD CONSTRAINT "payload_mcp_api_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "templates" DROP COLUMN "json_template";
  ALTER TABLE "templates" DROP COLUMN "source_url";
  ALTER TABLE "_templates_v" DROP COLUMN "version_json_template";
  ALTER TABLE "_templates_v" DROP COLUMN "version_source_url";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "template_assets_id";`)
}
