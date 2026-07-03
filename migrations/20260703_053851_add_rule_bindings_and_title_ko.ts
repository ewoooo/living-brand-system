import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "rule_bindings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"page_id" integer NOT NULL,
  	"rule_id" integer NOT NULL,
  	"value" varchar,
  	"evidence" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "rules" ADD COLUMN "title_ko" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "rule_bindings_id" integer;
  ALTER TABLE "rule_bindings" ADD CONSTRAINT "rule_bindings_page_id_guideline_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."guideline_pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "rule_bindings" ADD CONSTRAINT "rule_bindings_rule_id_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."rules"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "rule_bindings_page_idx" ON "rule_bindings" USING btree ("page_id");
  CREATE INDEX "rule_bindings_rule_idx" ON "rule_bindings" USING btree ("rule_id");
  CREATE INDEX "rule_bindings_updated_at_idx" ON "rule_bindings" USING btree ("updated_at");
  CREATE INDEX "rule_bindings_created_at_idx" ON "rule_bindings" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_rule_bindings_fk" FOREIGN KEY ("rule_bindings_id") REFERENCES "public"."rule_bindings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_rule_bindings_id_idx" ON "payload_locked_documents_rels" USING btree ("rule_bindings_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "rule_bindings" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "rule_bindings" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_rule_bindings_fk";
  
  DROP INDEX "payload_locked_documents_rels_rule_bindings_id_idx";
  ALTER TABLE "rules" DROP COLUMN "title_ko";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "rule_bindings_id";`)
}
