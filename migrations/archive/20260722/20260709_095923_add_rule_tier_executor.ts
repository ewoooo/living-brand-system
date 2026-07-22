import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "rules" ALTER COLUMN "tier" SET DATA TYPE text;
  UPDATE "rules" SET "tier" = CASE WHEN "tier" = 'A' THEN 'required' ELSE 'recommended' END WHERE "tier" IN ('A', 'B', 'C');
  DROP TYPE "public"."enum_rules_tier";
  CREATE TYPE "public"."enum_rules_tier" AS ENUM('required', 'recommended');
  ALTER TABLE "rules" ALTER COLUMN "tier" SET DATA TYPE "public"."enum_rules_tier" USING "tier"::"public"."enum_rules_tier";
  ALTER TABLE "rules" ALTER COLUMN "executor" SET DATA TYPE text;
  UPDATE "rules" SET "executor" = 'manual' WHERE "executor" = 'advisory';
  DROP TYPE "public"."enum_rules_executor";
  CREATE TYPE "public"."enum_rules_executor" AS ENUM('deterministic', 'heuristic', 'manual');
  ALTER TABLE "rules" ALTER COLUMN "executor" SET DATA TYPE "public"."enum_rules_executor" USING "executor"::"public"."enum_rules_executor";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "rules" ALTER COLUMN "tier" SET DATA TYPE text;
  UPDATE "rules" SET "tier" = CASE WHEN "tier" = 'required' THEN 'A' ELSE 'B' END WHERE "tier" IN ('required', 'recommended');
  DROP TYPE "public"."enum_rules_tier";
  CREATE TYPE "public"."enum_rules_tier" AS ENUM('A', 'B', 'C');
  ALTER TABLE "rules" ALTER COLUMN "tier" SET DATA TYPE "public"."enum_rules_tier" USING "tier"::"public"."enum_rules_tier";
  ALTER TABLE "rules" ALTER COLUMN "executor" SET DATA TYPE text;
  UPDATE "rules" SET "executor" = 'advisory' WHERE "executor" = 'manual';
  DROP TYPE "public"."enum_rules_executor";
  CREATE TYPE "public"."enum_rules_executor" AS ENUM('deterministic', 'heuristic', 'advisory');
  ALTER TABLE "rules" ALTER COLUMN "executor" SET DATA TYPE "public"."enum_rules_executor" USING "executor"::"public"."enum_rules_executor";`)
}
