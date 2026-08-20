import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_cil_subsidiary" AS ENUM('현대중공업', '현대삼호', '현대마린솔루션', '현대마린엔진', '현대이엔티', '현대오일뱅크', '현대케미칼', '현대쉘베이스오일', '현대오씨아이', '현대이앤에프', '현대일렉트릭', '현대에너지솔루션', '현대사이트솔루션', '현대로보틱스', '현대스포츠', '하이드로젠', '건설기계', '한국조선해양');
  CREATE TYPE "public"."enum_cil_branch" AS ENUM('EUROPE R&D CENTER', 'LONDON', 'GERMANY', 'ATHENS', 'OSLO', 'SINGAPORE', 'TOKYO', 'CHINA', 'VIETNAM', 'INDIA', 'PHILIPPINES', 'DUBAI', 'SAUDI ARABIA', 'HOUSTON', 'ATLANTA', 'PANAMA', 'BRAZIL', 'SOUTH AFRICA');
  CREATE TYPE "public"."enum_cil_form" AS ENUM('horizontal', 'horizontalA', 'horizontalB', 'vertical');
  CREATE TYPE "public"."enum_cil_language" AS ENUM('ko', 'en', 'hd');
  CREATE TYPE "public"."enum_cil_color_type" AS ENUM('fullColor', 'whiteWordmark', 'mono');
  CREATE TYPE "public"."enum_cil_mono" AS ENUM('BLACK', 'WHITE');
  CREATE TYPE "public"."enum_cil_clear_space" AS ENUM('off', 'normal', 'exception');
  CREATE TYPE "public"."enum__cil_v_subsidiary" AS ENUM('현대중공업', '현대삼호', '현대마린솔루션', '현대마린엔진', '현대이엔티', '현대오일뱅크', '현대케미칼', '현대쉘베이스오일', '현대오씨아이', '현대이앤에프', '현대일렉트릭', '현대에너지솔루션', '현대사이트솔루션', '현대로보틱스', '현대스포츠', '하이드로젠', '건설기계', '한국조선해양');
  CREATE TYPE "public"."enum__cil_v_branch" AS ENUM('EUROPE R&D CENTER', 'LONDON', 'GERMANY', 'ATHENS', 'OSLO', 'SINGAPORE', 'TOKYO', 'CHINA', 'VIETNAM', 'INDIA', 'PHILIPPINES', 'DUBAI', 'SAUDI ARABIA', 'HOUSTON', 'ATLANTA', 'PANAMA', 'BRAZIL', 'SOUTH AFRICA');
  CREATE TYPE "public"."enum__cil_v_form" AS ENUM('horizontal', 'horizontalA', 'horizontalB', 'vertical');
  CREATE TYPE "public"."enum__cil_v_language" AS ENUM('ko', 'en', 'hd');
  CREATE TYPE "public"."enum__cil_v_color_type" AS ENUM('fullColor', 'whiteWordmark', 'mono');
  CREATE TYPE "public"."enum__cil_v_mono" AS ENUM('BLACK', 'WHITE');
  CREATE TYPE "public"."enum__cil_v_clear_space" AS ENUM('off', 'normal', 'exception');
  ALTER TABLE "cil" ADD COLUMN "subsidiary" "enum_cil_subsidiary" DEFAULT '현대중공업';
  ALTER TABLE "cil" ADD COLUMN "branch" "enum_cil_branch" DEFAULT 'EUROPE R&D CENTER';
  ALTER TABLE "cil" ADD COLUMN "form" "enum_cil_form" DEFAULT 'horizontal';
  ALTER TABLE "cil" ADD COLUMN "language" "enum_cil_language" DEFAULT 'ko';
  ALTER TABLE "cil" ADD COLUMN "color_type" "enum_cil_color_type" DEFAULT 'fullColor';
  ALTER TABLE "cil" ADD COLUMN "mono" "enum_cil_mono" DEFAULT 'BLACK';
  ALTER TABLE "cil" ADD COLUMN "clear_space" "enum_cil_clear_space" DEFAULT 'off';
  ALTER TABLE "cil" ADD COLUMN "measured" boolean DEFAULT false;
  ALTER TABLE "_cil_v" ADD COLUMN "subsidiary" "enum__cil_v_subsidiary" DEFAULT '현대중공업';
  ALTER TABLE "_cil_v" ADD COLUMN "branch" "enum__cil_v_branch" DEFAULT 'EUROPE R&D CENTER';
  ALTER TABLE "_cil_v" ADD COLUMN "form" "enum__cil_v_form" DEFAULT 'horizontal';
  ALTER TABLE "_cil_v" ADD COLUMN "language" "enum__cil_v_language" DEFAULT 'ko';
  ALTER TABLE "_cil_v" ADD COLUMN "color_type" "enum__cil_v_color_type" DEFAULT 'fullColor';
  ALTER TABLE "_cil_v" ADD COLUMN "mono" "enum__cil_v_mono" DEFAULT 'BLACK';
  ALTER TABLE "_cil_v" ADD COLUMN "clear_space" "enum__cil_v_clear_space" DEFAULT 'off';
  ALTER TABLE "_cil_v" ADD COLUMN "measured" boolean DEFAULT false;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "cil" DROP COLUMN "subsidiary";
  ALTER TABLE "cil" DROP COLUMN "branch";
  ALTER TABLE "cil" DROP COLUMN "form";
  ALTER TABLE "cil" DROP COLUMN "language";
  ALTER TABLE "cil" DROP COLUMN "color_type";
  ALTER TABLE "cil" DROP COLUMN "mono";
  ALTER TABLE "cil" DROP COLUMN "clear_space";
  ALTER TABLE "cil" DROP COLUMN "measured";
  ALTER TABLE "_cil_v" DROP COLUMN "subsidiary";
  ALTER TABLE "_cil_v" DROP COLUMN "branch";
  ALTER TABLE "_cil_v" DROP COLUMN "form";
  ALTER TABLE "_cil_v" DROP COLUMN "language";
  ALTER TABLE "_cil_v" DROP COLUMN "color_type";
  ALTER TABLE "_cil_v" DROP COLUMN "mono";
  ALTER TABLE "_cil_v" DROP COLUMN "clear_space";
  ALTER TABLE "_cil_v" DROP COLUMN "measured";
  DROP TYPE "public"."enum_cil_subsidiary";
  DROP TYPE "public"."enum_cil_branch";
  DROP TYPE "public"."enum_cil_form";
  DROP TYPE "public"."enum_cil_language";
  DROP TYPE "public"."enum_cil_color_type";
  DROP TYPE "public"."enum_cil_mono";
  DROP TYPE "public"."enum_cil_clear_space";
  DROP TYPE "public"."enum__cil_v_subsidiary";
  DROP TYPE "public"."enum__cil_v_branch";
  DROP TYPE "public"."enum__cil_v_form";
  DROP TYPE "public"."enum__cil_v_language";
  DROP TYPE "public"."enum__cil_v_color_type";
  DROP TYPE "public"."enum__cil_v_mono";
  DROP TYPE "public"."enum__cil_v_clear_space";`)
}
