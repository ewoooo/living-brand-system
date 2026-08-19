import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_cil_hidden_controls" ADD VALUE 'h' BEFORE 'subsidiaryOn';
  ALTER TYPE "public"."enum__cil_v_hidden_controls" ADD VALUE 'h' BEFORE 'subsidiaryOn';
  ALTER TABLE "cil" ADD COLUMN "h" numeric DEFAULT 100;
  ALTER TABLE "_cil_v" ADD COLUMN "h" numeric DEFAULT 100;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "cil_hidden_controls" ALTER COLUMN "value" SET DATA TYPE text;
  DROP TYPE "public"."enum_cil_hidden_controls";
  CREATE TYPE "public"."enum_cil_hidden_controls" AS ENUM('subsidiaryOn', 'subsidiary', 'branchOn', 'branch', 'form', 'language', 'colorType', 'mono', 'clearSpace', 'measured');
  ALTER TABLE "cil_hidden_controls" ALTER COLUMN "value" SET DATA TYPE "public"."enum_cil_hidden_controls" USING "value"::"public"."enum_cil_hidden_controls";
  ALTER TABLE "_cil_v_hidden_controls" ALTER COLUMN "value" SET DATA TYPE text;
  DROP TYPE "public"."enum__cil_v_hidden_controls";
  CREATE TYPE "public"."enum__cil_v_hidden_controls" AS ENUM('subsidiaryOn', 'subsidiary', 'branchOn', 'branch', 'form', 'language', 'colorType', 'mono', 'clearSpace', 'measured');
  ALTER TABLE "_cil_v_hidden_controls" ALTER COLUMN "value" SET DATA TYPE "public"."enum__cil_v_hidden_controls" USING "value"::"public"."enum__cil_v_hidden_controls";
  ALTER TABLE "cil" DROP COLUMN "h";
  ALTER TABLE "_cil_v" DROP COLUMN "h";`)
}
