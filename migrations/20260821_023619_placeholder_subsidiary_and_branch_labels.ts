import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_cil_subsidiary" ADD VALUE '현대법인';
  ALTER TYPE "public"."enum_cil_subsidiary" ADD VALUE '현대계열사';
  ALTER TYPE "public"."enum_cil_branch" ADD VALUE 'SINGAPORE SERVICE CENTER' BEFORE 'EUROPE';
  ALTER TYPE "public"."enum_cil_branch" ADD VALUE 'HOUSTON TRAINING CENTER' BEFORE 'EUROPE';
  ALTER TYPE "public"."enum_cil_branch" ADD VALUE 'VIETNAM SHIPYARD' BEFORE 'EUROPE';
  ALTER TYPE "public"."enum_cil_branch" ADD VALUE 'ATLANTA PARTS CENTER' BEFORE 'EUROPE';
  ALTER TYPE "public"."enum__cil_v_subsidiary" ADD VALUE '현대법인';
  ALTER TYPE "public"."enum__cil_v_subsidiary" ADD VALUE '현대계열사';
  ALTER TYPE "public"."enum__cil_v_branch" ADD VALUE 'SINGAPORE SERVICE CENTER' BEFORE 'EUROPE';
  ALTER TYPE "public"."enum__cil_v_branch" ADD VALUE 'HOUSTON TRAINING CENTER' BEFORE 'EUROPE';
  ALTER TYPE "public"."enum__cil_v_branch" ADD VALUE 'VIETNAM SHIPYARD' BEFORE 'EUROPE';
  ALTER TYPE "public"."enum__cil_v_branch" ADD VALUE 'ATLANTA PARTS CENTER' BEFORE 'EUROPE';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "cil" ALTER COLUMN "subsidiary" SET DATA TYPE text;
  ALTER TABLE "cil" ALTER COLUMN "subsidiary" SET DEFAULT '현대중공업'::text;
  DROP TYPE "public"."enum_cil_subsidiary";
  CREATE TYPE "public"."enum_cil_subsidiary" AS ENUM('현대중공업', '현대삼호', '현대마린솔루션', '현대마린엔진', '현대이엔티', '현대오일뱅크', '현대케미칼', '현대쉘베이스오일', '현대오씨아이', '현대이앤에프', '현대일렉트릭', '현대에너지솔루션', '현대사이트솔루션', '현대로보틱스', '현대스포츠', '하이드로젠', '건설기계', '한국조선해양');
  ALTER TABLE "cil" ALTER COLUMN "subsidiary" SET DEFAULT '현대중공업'::"public"."enum_cil_subsidiary";
  ALTER TABLE "cil" ALTER COLUMN "subsidiary" SET DATA TYPE "public"."enum_cil_subsidiary" USING "subsidiary"::"public"."enum_cil_subsidiary";
  ALTER TABLE "cil" ALTER COLUMN "branch" SET DATA TYPE text;
  ALTER TABLE "cil" ALTER COLUMN "branch" SET DEFAULT 'EUROPE R&D CENTER'::text;
  DROP TYPE "public"."enum_cil_branch";
  CREATE TYPE "public"."enum_cil_branch" AS ENUM('EUROPE R&D CENTER', 'INDIA R&D CENTER', 'CHINA R&D CENTER', 'SWITZERLAND R&D CENTER', 'HUNGARY TECHNOLOGIES CENTER', 'EUROPE', 'LONDON', 'ATHENS', 'OSLO', 'SINGAPORE', 'TOKYO', 'HOUSTON', 'NEW JERSEY', 'PANAMA', 'DUBAI', 'GERMANY', 'CHINA', 'VIETNAM', 'INDIA', 'PHILIPPINES', 'SAUDI ARABIA', 'ATLANTA', 'BRAZIL', 'SOUTH AFRICA');
  ALTER TABLE "cil" ALTER COLUMN "branch" SET DEFAULT 'EUROPE R&D CENTER'::"public"."enum_cil_branch";
  ALTER TABLE "cil" ALTER COLUMN "branch" SET DATA TYPE "public"."enum_cil_branch" USING "branch"::"public"."enum_cil_branch";
  ALTER TABLE "_cil_v" ALTER COLUMN "subsidiary" SET DATA TYPE text;
  ALTER TABLE "_cil_v" ALTER COLUMN "subsidiary" SET DEFAULT '현대중공업'::text;
  DROP TYPE "public"."enum__cil_v_subsidiary";
  CREATE TYPE "public"."enum__cil_v_subsidiary" AS ENUM('현대중공업', '현대삼호', '현대마린솔루션', '현대마린엔진', '현대이엔티', '현대오일뱅크', '현대케미칼', '현대쉘베이스오일', '현대오씨아이', '현대이앤에프', '현대일렉트릭', '현대에너지솔루션', '현대사이트솔루션', '현대로보틱스', '현대스포츠', '하이드로젠', '건설기계', '한국조선해양');
  ALTER TABLE "_cil_v" ALTER COLUMN "subsidiary" SET DEFAULT '현대중공업'::"public"."enum__cil_v_subsidiary";
  ALTER TABLE "_cil_v" ALTER COLUMN "subsidiary" SET DATA TYPE "public"."enum__cil_v_subsidiary" USING "subsidiary"::"public"."enum__cil_v_subsidiary";
  ALTER TABLE "_cil_v" ALTER COLUMN "branch" SET DATA TYPE text;
  ALTER TABLE "_cil_v" ALTER COLUMN "branch" SET DEFAULT 'EUROPE R&D CENTER'::text;
  DROP TYPE "public"."enum__cil_v_branch";
  CREATE TYPE "public"."enum__cil_v_branch" AS ENUM('EUROPE R&D CENTER', 'INDIA R&D CENTER', 'CHINA R&D CENTER', 'SWITZERLAND R&D CENTER', 'HUNGARY TECHNOLOGIES CENTER', 'EUROPE', 'LONDON', 'ATHENS', 'OSLO', 'SINGAPORE', 'TOKYO', 'HOUSTON', 'NEW JERSEY', 'PANAMA', 'DUBAI', 'GERMANY', 'CHINA', 'VIETNAM', 'INDIA', 'PHILIPPINES', 'SAUDI ARABIA', 'ATLANTA', 'BRAZIL', 'SOUTH AFRICA');
  ALTER TABLE "_cil_v" ALTER COLUMN "branch" SET DEFAULT 'EUROPE R&D CENTER'::"public"."enum__cil_v_branch";
  ALTER TABLE "_cil_v" ALTER COLUMN "branch" SET DATA TYPE "public"."enum__cil_v_branch" USING "branch"::"public"."enum__cil_v_branch";`)
}
