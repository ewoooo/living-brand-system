import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// 🔴 생성된 diff에서 `agent_chat_sessions`의 ai_usage 컬럼 DROP 9건을 걷어냈다.
// 그건 stage의 20260806_052358이 이미 하는 일인데, drizzle이 before 상태를 DB가 아니라
// 파일명 정렬 마지막 스냅샷(20260806_081710, 머지 이전 생성분)에서 읽어서 다시 뱉은 것이다.
// 그대로 두면 빈 DB에서 같은 컬럼을 두 번 지우려다 죽는다. 스냅샷 .json은 config 전체를
// 반영하므로 손대지 않고 그대로 커밋한다.

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_brand_colors_mono_logo_fill" AS ENUM('black', 'white');
  ALTER TABLE "brand_colors" ADD COLUMN "allows_full_color_logo" boolean DEFAULT false;
  ALTER TABLE "brand_colors" ADD COLUMN "allows_white_wordmark" boolean DEFAULT false;
  ALTER TABLE "brand_colors" ADD COLUMN "mono_logo_fill" "enum_brand_colors_mono_logo_fill";
  ALTER TABLE "_brand_colors_v" ADD COLUMN "version_allows_full_color_logo" boolean DEFAULT false;
  ALTER TABLE "_brand_colors_v" ADD COLUMN "version_allows_white_wordmark" boolean DEFAULT false;
  ALTER TABLE "_brand_colors_v" ADD COLUMN "version_mono_logo_fill" "enum_brand_colors_mono_logo_fill";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "brand_colors" DROP COLUMN "allows_full_color_logo";
  ALTER TABLE "brand_colors" DROP COLUMN "allows_white_wordmark";
  ALTER TABLE "brand_colors" DROP COLUMN "mono_logo_fill";
  ALTER TABLE "_brand_colors_v" DROP COLUMN "version_allows_full_color_logo";
  ALTER TABLE "_brand_colors_v" DROP COLUMN "version_allows_white_wordmark";
  ALTER TABLE "_brand_colors_v" DROP COLUMN "version_mono_logo_fill";
  DROP TYPE "public"."enum_brand_colors_mono_logo_fill";`)
}
