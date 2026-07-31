import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload_mcp_api_keys" ADD COLUMN "payload_mcp_tool_search_guidelines" boolean DEFAULT true;
  ALTER TABLE "payload_mcp_api_keys" ADD COLUMN "payload_mcp_tool_find_templates" boolean DEFAULT true;
  ALTER TABLE "payload_mcp_api_keys" ADD COLUMN "payload_mcp_tool_list_image_profiles" boolean DEFAULT true;
  ALTER TABLE "payload_mcp_api_keys" ADD COLUMN "payload_mcp_tool_run_asset_check" boolean DEFAULT true;
  ALTER TABLE "payload_mcp_api_keys" ADD COLUMN "payload_mcp_tool_submit_asset_check_observations" boolean DEFAULT true;
  ALTER TABLE "payload_mcp_api_keys" ADD COLUMN "payload_mcp_tool_generate_brand_image" boolean DEFAULT true;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload_mcp_api_keys" DROP COLUMN "payload_mcp_tool_search_guidelines";
  ALTER TABLE "payload_mcp_api_keys" DROP COLUMN "payload_mcp_tool_find_templates";
  ALTER TABLE "payload_mcp_api_keys" DROP COLUMN "payload_mcp_tool_list_image_profiles";
  ALTER TABLE "payload_mcp_api_keys" DROP COLUMN "payload_mcp_tool_run_asset_check";
  ALTER TABLE "payload_mcp_api_keys" DROP COLUMN "payload_mcp_tool_submit_asset_check_observations";
  ALTER TABLE "payload_mcp_api_keys" DROP COLUMN "payload_mcp_tool_generate_brand_image";`)
}
