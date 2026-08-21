import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "cil" ALTER COLUMN "branch" SET DATA TYPE text;
  ALTER TABLE "cil" ALTER COLUMN "branch" SET DEFAULT 'EUROPE R&D CENTER'::text;
  DROP TYPE "public"."enum_cil_branch";
  CREATE TYPE "public"."enum_cil_branch" AS ENUM('EUROPE R&D CENTER', 'INDIA R&D CENTER', 'CHINA R&D CENTER', 'SWITZERLAND R&D CENTER', 'HUNGARY TECHNOLOGIES CENTER', 'EUROPE', 'LONDON', 'ATHENS', 'OSLO', 'SINGAPORE', 'TOKYO', 'HOUSTON', 'NEW JERSEY', 'PANAMA', 'DUBAI', 'GERMANY', 'CHINA', 'VIETNAM', 'INDIA', 'PHILIPPINES', 'SAUDI ARABIA', 'ATLANTA', 'BRAZIL', 'SOUTH AFRICA');
  ALTER TABLE "cil" ALTER COLUMN "branch" SET DEFAULT 'EUROPE R&D CENTER'::"public"."enum_cil_branch";
  ALTER TABLE "cil" ALTER COLUMN "branch" SET DATA TYPE "public"."enum_cil_branch" USING "branch"::"public"."enum_cil_branch";
  ALTER TABLE "_cil_v" ALTER COLUMN "branch" SET DATA TYPE text;
  ALTER TABLE "_cil_v" ALTER COLUMN "branch" SET DEFAULT 'EUROPE R&D CENTER'::text;
  DROP TYPE "public"."enum__cil_v_branch";
  CREATE TYPE "public"."enum__cil_v_branch" AS ENUM('EUROPE R&D CENTER', 'INDIA R&D CENTER', 'CHINA R&D CENTER', 'SWITZERLAND R&D CENTER', 'HUNGARY TECHNOLOGIES CENTER', 'EUROPE', 'LONDON', 'ATHENS', 'OSLO', 'SINGAPORE', 'TOKYO', 'HOUSTON', 'NEW JERSEY', 'PANAMA', 'DUBAI', 'GERMANY', 'CHINA', 'VIETNAM', 'INDIA', 'PHILIPPINES', 'SAUDI ARABIA', 'ATLANTA', 'BRAZIL', 'SOUTH AFRICA');
  ALTER TABLE "_cil_v" ALTER COLUMN "branch" SET DEFAULT 'EUROPE R&D CENTER'::"public"."enum__cil_v_branch";
  ALTER TABLE "_cil_v" ALTER COLUMN "branch" SET DATA TYPE "public"."enum__cil_v_branch" USING "branch"::"public"."enum__cil_v_branch";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "cil" ALTER COLUMN "branch" SET DATA TYPE text;
  ALTER TABLE "cil" ALTER COLUMN "branch" SET DEFAULT 'EUROPE R&D CENTER'::text;
  DROP TYPE "public"."enum_cil_branch";
  CREATE TYPE "public"."enum_cil_branch" AS ENUM('EUROPE R&D CENTER', 'LONDON', 'GERMANY', 'ATHENS', 'OSLO', 'SINGAPORE', 'TOKYO', 'CHINA', 'VIETNAM', 'INDIA', 'PHILIPPINES', 'DUBAI', 'SAUDI ARABIA', 'HOUSTON', 'ATLANTA', 'PANAMA', 'BRAZIL', 'SOUTH AFRICA');
  ALTER TABLE "cil" ALTER COLUMN "branch" SET DEFAULT 'EUROPE R&D CENTER'::"public"."enum_cil_branch";
  ALTER TABLE "cil" ALTER COLUMN "branch" SET DATA TYPE "public"."enum_cil_branch" USING "branch"::"public"."enum_cil_branch";
  ALTER TABLE "_cil_v" ALTER COLUMN "branch" SET DATA TYPE text;
  ALTER TABLE "_cil_v" ALTER COLUMN "branch" SET DEFAULT 'EUROPE R&D CENTER'::text;
  DROP TYPE "public"."enum__cil_v_branch";
  CREATE TYPE "public"."enum__cil_v_branch" AS ENUM('EUROPE R&D CENTER', 'LONDON', 'GERMANY', 'ATHENS', 'OSLO', 'SINGAPORE', 'TOKYO', 'CHINA', 'VIETNAM', 'INDIA', 'PHILIPPINES', 'DUBAI', 'SAUDI ARABIA', 'HOUSTON', 'ATLANTA', 'PANAMA', 'BRAZIL', 'SOUTH AFRICA');
  ALTER TABLE "_cil_v" ALTER COLUMN "branch" SET DEFAULT 'EUROPE R&D CENTER'::"public"."enum__cil_v_branch";
  ALTER TABLE "_cil_v" ALTER COLUMN "branch" SET DATA TYPE "public"."enum__cil_v_branch" USING "branch"::"public"."enum__cil_v_branch";`)
}
