import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_guideline_blocks_block_type" AS ENUM('columnUnit', 'mediaShowcase', 'colorPalette', 'doDont');
  CREATE TABLE "guideline_blocks" (
    "id" serial PRIMARY KEY NOT NULL,
    "key" varchar NOT NULL,
    "source_block_id" varchar NOT NULL,
    "block_type" "enum_guideline_blocks_block_type" NOT NULL,
    "display_order" numeric NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "guideline_blocks_rels" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer,
    "parent_id" integer NOT NULL,
    "path" varchar NOT NULL,
    "guideline_sections_id" integer,
    "guideline_pages_id" integer
  );

  ALTER TABLE "rules_rels" ADD COLUMN "guideline_sections_id" integer;
  ALTER TABLE "rules_rels" ADD COLUMN "guideline_pages_id" integer;
  ALTER TABLE "rules_rels" ADD COLUMN "guideline_blocks_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "guideline_blocks_id" integer;
  ALTER TABLE "guideline_blocks_rels" ADD CONSTRAINT "guideline_blocks_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."guideline_blocks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_blocks_rels" ADD CONSTRAINT "guideline_blocks_rels_guideline_sections_fk" FOREIGN KEY ("guideline_sections_id") REFERENCES "public"."guideline_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_blocks_rels" ADD CONSTRAINT "guideline_blocks_rels_guideline_pages_fk" FOREIGN KEY ("guideline_pages_id") REFERENCES "public"."guideline_pages"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "guideline_blocks_key_idx" ON "guideline_blocks" USING btree ("key");
  CREATE INDEX "guideline_blocks_source_block_id_idx" ON "guideline_blocks" USING btree ("source_block_id");
  CREATE INDEX "guideline_blocks_updated_at_idx" ON "guideline_blocks" USING btree ("updated_at");
  CREATE INDEX "guideline_blocks_created_at_idx" ON "guideline_blocks" USING btree ("created_at");
  CREATE INDEX "guideline_blocks_rels_order_idx" ON "guideline_blocks_rels" USING btree ("order");
  CREATE INDEX "guideline_blocks_rels_parent_idx" ON "guideline_blocks_rels" USING btree ("parent_id");
  CREATE INDEX "guideline_blocks_rels_path_idx" ON "guideline_blocks_rels" USING btree ("path");
  CREATE INDEX "guideline_blocks_rels_guideline_sections_id_idx" ON "guideline_blocks_rels" USING btree ("guideline_sections_id");
  CREATE INDEX "guideline_blocks_rels_guideline_pages_id_idx" ON "guideline_blocks_rels" USING btree ("guideline_pages_id");
  ALTER TABLE "rules_rels" ADD CONSTRAINT "rules_rels_guideline_sections_fk" FOREIGN KEY ("guideline_sections_id") REFERENCES "public"."guideline_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "rules_rels" ADD CONSTRAINT "rules_rels_guideline_pages_fk" FOREIGN KEY ("guideline_pages_id") REFERENCES "public"."guideline_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "rules_rels" ADD CONSTRAINT "rules_rels_guideline_blocks_fk" FOREIGN KEY ("guideline_blocks_id") REFERENCES "public"."guideline_blocks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_guideline_blocks_fk" FOREIGN KEY ("guideline_blocks_id") REFERENCES "public"."guideline_blocks"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "rules_rels_guideline_sections_id_idx" ON "rules_rels" USING btree ("guideline_sections_id");
  CREATE INDEX "rules_rels_guideline_pages_id_idx" ON "rules_rels" USING btree ("guideline_pages_id");
  CREATE INDEX "rules_rels_guideline_blocks_id_idx" ON "rules_rels" USING btree ("guideline_blocks_id");
  CREATE INDEX "payload_locked_documents_rels_guideline_blocks_id_idx" ON "payload_locked_documents_rels" USING btree ("guideline_blocks_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "rules_rels" DROP CONSTRAINT "rules_rels_guideline_sections_fk";

  ALTER TABLE "rules_rels" DROP CONSTRAINT "rules_rels_guideline_pages_fk";

  ALTER TABLE "rules_rels" DROP CONSTRAINT "rules_rels_guideline_blocks_fk";

  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_guideline_blocks_fk";

  DROP INDEX "rules_rels_guideline_sections_id_idx";
  DROP INDEX "rules_rels_guideline_pages_id_idx";
  DROP INDEX "rules_rels_guideline_blocks_id_idx";
  DROP INDEX "payload_locked_documents_rels_guideline_blocks_id_idx";
  ALTER TABLE "rules_rels" DROP COLUMN "guideline_sections_id";
  ALTER TABLE "rules_rels" DROP COLUMN "guideline_pages_id";
  ALTER TABLE "rules_rels" DROP COLUMN "guideline_blocks_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "guideline_blocks_id";
  ALTER TABLE "guideline_blocks" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_blocks_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "guideline_blocks_rels" CASCADE;
  DROP TABLE "guideline_blocks" CASCADE;
  DROP TYPE "public"."enum_guideline_blocks_block_type";`)
}
