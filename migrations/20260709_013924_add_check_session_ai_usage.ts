import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "agent_settings" ALTER COLUMN "available_tools" SET DEFAULT 'Guideline tools can list, search, and read published guideline context. Template tools can find published templates with template rules and prepare downloadable template image attachments from open slot values. Check tools can list supported check scenarios and inspect attached images using these scenarios: quick (빠른 기본 검수), image-mood (이미지 무드 검수), sns (SNS 콘텐츠 검수), web-visual (웹/비주얼 템플릿 검수), advertisement (광고 검수), stationery (명함/스테이셔너리 검수).';
  ALTER TABLE "check_sessions" ADD COLUMN "ai_usage_model" varchar;
  ALTER TABLE "check_sessions" ADD COLUMN "ai_usage_call_count" numeric;
  ALTER TABLE "check_sessions" ADD COLUMN "ai_usage_input_tokens" numeric;
  ALTER TABLE "check_sessions" ADD COLUMN "ai_usage_output_tokens" numeric;
  ALTER TABLE "check_sessions" ADD COLUMN "ai_usage_total_tokens" numeric;
  ALTER TABLE "check_sessions" ADD COLUMN "ai_usage_cache_read_input_tokens" numeric;
  ALTER TABLE "check_sessions" ADD COLUMN "ai_usage_cache_write_input_tokens" numeric;
  ALTER TABLE "check_sessions" ADD COLUMN "ai_usage_reasoning_tokens" numeric;
  ALTER TABLE "check_sessions" ADD COLUMN "ai_usage_raw_usage" jsonb;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "agent_settings" ALTER COLUMN "available_tools" SET DEFAULT 'Guideline tools can list, search, and read published guideline context. Template tools can find published templates with template rules and prepare downloadable template image attachments from open slot values. Check tools can inspect attached images using quick, image-mood, or stationery scenarios.';
  ALTER TABLE "check_sessions" DROP COLUMN "ai_usage_model";
  ALTER TABLE "check_sessions" DROP COLUMN "ai_usage_call_count";
  ALTER TABLE "check_sessions" DROP COLUMN "ai_usage_input_tokens";
  ALTER TABLE "check_sessions" DROP COLUMN "ai_usage_output_tokens";
  ALTER TABLE "check_sessions" DROP COLUMN "ai_usage_total_tokens";
  ALTER TABLE "check_sessions" DROP COLUMN "ai_usage_cache_read_input_tokens";
  ALTER TABLE "check_sessions" DROP COLUMN "ai_usage_cache_write_input_tokens";
  ALTER TABLE "check_sessions" DROP COLUMN "ai_usage_reasoning_tokens";
  ALTER TABLE "check_sessions" DROP COLUMN "ai_usage_raw_usage";`)
}
