import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload_mcp_api_keys" ADD COLUMN "payload_mcp_tool_find_guideline_documents" boolean DEFAULT true;
  UPDATE "payload_mcp_api_keys"
  SET "payload_mcp_tool_find_guideline_documents" =
    COALESCE("payload_mcp_tool_find_guideline_pages", false)
    AND COALESCE("payload_mcp_tool_find_chapters", false)
    AND COALESCE("payload_mcp_tool_find_sections", false);
  ALTER TABLE "payload_mcp_api_keys" DROP COLUMN "payload_mcp_tool_find_guideline_pages";
  ALTER TABLE "payload_mcp_api_keys" DROP COLUMN "payload_mcp_tool_find_chapters";
  ALTER TABLE "payload_mcp_api_keys" DROP COLUMN "payload_mcp_tool_find_sections";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload_mcp_api_keys" ADD COLUMN "payload_mcp_tool_find_guideline_pages" boolean DEFAULT true;
  ALTER TABLE "payload_mcp_api_keys" ADD COLUMN "payload_mcp_tool_find_chapters" boolean DEFAULT true;
  ALTER TABLE "payload_mcp_api_keys" ADD COLUMN "payload_mcp_tool_find_sections" boolean DEFAULT true;
  UPDATE "payload_mcp_api_keys"
  SET
    "payload_mcp_tool_find_guideline_pages" = COALESCE("payload_mcp_tool_find_guideline_documents", false),
    "payload_mcp_tool_find_chapters" = COALESCE("payload_mcp_tool_find_guideline_documents", false),
    "payload_mcp_tool_find_sections" = COALESCE("payload_mcp_tool_find_guideline_documents", false);
  ALTER TABLE "payload_mcp_api_keys" DROP COLUMN "payload_mcp_tool_find_guideline_documents";`)
}
