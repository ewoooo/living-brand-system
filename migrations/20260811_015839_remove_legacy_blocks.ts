import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "guideline_docs_blocks_carousel_slides" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_carousel_slides_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_carousel" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_media_showcase_images" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_media_showcase" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_color_palette" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_color_palette_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_do_dont_groups_examples" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_do_dont_groups_examples_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_do_dont_groups" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_do_dont_groups_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_do_dont" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_do_dont_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_spec_list_groups_specs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_spec_list_groups" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_spec_list_groups_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_spec_list" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_signature_showcase_signatures" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_signature_showcase_signatures_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_signature_showcase" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_type_specimen" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_type_specimen_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_type_scale_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_type_scale_items_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_type_scale" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_layout_grid_variants" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_layout_grid_variants_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_layout_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_glyph_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_glyph_grid_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cpw" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "car" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cpr" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cprr" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cin" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cin_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "glw" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "icw" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "imw" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "iug" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "lgs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "lgs_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "lgv" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "lvw" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "msw" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "sdv" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "sdv_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "sla_variants" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "sla_variants_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "sla_apps" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "sla_apps_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "sla" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "scs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "tsc" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_color_pairing" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_color_pairing_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_color_pairing_recommendation" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_color_pairing_recommendation_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_icon_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_icon_grid_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_image_grid_cells" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_image_grid_cells_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_image_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_image_grid_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_logo_group_viewer_logos" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_logo_group_viewer_logos_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_logo_group_viewer_topics" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_logo_group_viewer_topics_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_logo_group_viewer" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_logo_group_viewer_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_logo_viewer_topics" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_logo_viewer_topics_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_logo_viewer" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_logo_viewer_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_stem_clear_space" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guideline_docs_blocks_stem_clear_space_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_carousel_slides" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_carousel_slides_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_carousel" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_media_showcase_images" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_media_showcase" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_color_palette" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_color_palette_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_do_dont_groups_examples" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_do_dont_groups_examples_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_do_dont_groups" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_do_dont_groups_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_do_dont" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_do_dont_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_spec_list_groups_specs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_spec_list_groups" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_spec_list_groups_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_spec_list" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_signature_showcase_signatures" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_signature_showcase_signatures_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_signature_showcase" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_type_specimen" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_type_specimen_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_type_scale_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_type_scale_items_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_type_scale" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_layout_grid_variants" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_layout_grid_variants_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_layout_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_glyph_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_glyph_grid_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_cpw_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_car_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_cpr_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_cprr_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_cin_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_cin_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_glw_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_icw_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_imw_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_iug_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_lgs_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_lgs_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_lgv_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_lvw_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_msw_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_sdv_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_sdv_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_sla_v_variants" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_sla_v_variants_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_sla_v_apps" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_sla_v_apps_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_sla_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_scs_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_tsc_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_color_pairing" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_color_pairing_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_color_pairing_recommendation" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_color_pairing_recommendation_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_icon_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_icon_grid_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_image_grid_cells" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_image_grid_cells_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_image_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_image_grid_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_logo_group_viewer_logos" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_logo_group_viewer_logos_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_logo_group_viewer_topics" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_logo_group_viewer_topics_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_logo_group_viewer" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_logo_group_viewer_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_logo_viewer_topics" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_logo_viewer_topics_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_logo_viewer" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_logo_viewer_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_stem_clear_space" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guideline_docs_v_blocks_stem_clear_space_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "guideline_docs_blocks_carousel_slides" CASCADE;
  DROP TABLE "guideline_docs_blocks_carousel_slides_locales" CASCADE;
  DROP TABLE "guideline_docs_blocks_carousel" CASCADE;
  DROP TABLE "guideline_docs_blocks_media_showcase_images" CASCADE;
  DROP TABLE "guideline_docs_blocks_media_showcase" CASCADE;
  DROP TABLE "guideline_docs_blocks_color_palette" CASCADE;
  DROP TABLE "guideline_docs_blocks_color_palette_locales" CASCADE;
  DROP TABLE "guideline_docs_blocks_do_dont_groups_examples" CASCADE;
  DROP TABLE "guideline_docs_blocks_do_dont_groups_examples_locales" CASCADE;
  DROP TABLE "guideline_docs_blocks_do_dont_groups" CASCADE;
  DROP TABLE "guideline_docs_blocks_do_dont_groups_locales" CASCADE;
  DROP TABLE "guideline_docs_blocks_do_dont" CASCADE;
  DROP TABLE "guideline_docs_blocks_do_dont_locales" CASCADE;
  DROP TABLE "guideline_docs_blocks_spec_list_groups_specs" CASCADE;
  DROP TABLE "guideline_docs_blocks_spec_list_groups" CASCADE;
  DROP TABLE "guideline_docs_blocks_spec_list_groups_locales" CASCADE;
  DROP TABLE "guideline_docs_blocks_spec_list" CASCADE;
  DROP TABLE "guideline_docs_blocks_signature_showcase_signatures" CASCADE;
  DROP TABLE "guideline_docs_blocks_signature_showcase_signatures_locales" CASCADE;
  DROP TABLE "guideline_docs_blocks_signature_showcase" CASCADE;
  DROP TABLE "guideline_docs_blocks_type_specimen" CASCADE;
  DROP TABLE "guideline_docs_blocks_type_specimen_locales" CASCADE;
  DROP TABLE "guideline_docs_blocks_type_scale_items" CASCADE;
  DROP TABLE "guideline_docs_blocks_type_scale_items_locales" CASCADE;
  DROP TABLE "guideline_docs_blocks_type_scale" CASCADE;
  DROP TABLE "guideline_docs_blocks_layout_grid_variants" CASCADE;
  DROP TABLE "guideline_docs_blocks_layout_grid_variants_locales" CASCADE;
  DROP TABLE "guideline_docs_blocks_layout_grid" CASCADE;
  DROP TABLE "guideline_docs_blocks_glyph_grid" CASCADE;
  DROP TABLE "guideline_docs_blocks_glyph_grid_locales" CASCADE;
  DROP TABLE "cpw" CASCADE;
  DROP TABLE "car" CASCADE;
  DROP TABLE "cpr" CASCADE;
  DROP TABLE "cprr" CASCADE;
  DROP TABLE "cin" CASCADE;
  DROP TABLE "cin_locales" CASCADE;
  DROP TABLE "glw" CASCADE;
  DROP TABLE "icw" CASCADE;
  DROP TABLE "imw" CASCADE;
  DROP TABLE "iug" CASCADE;
  DROP TABLE "lgs" CASCADE;
  DROP TABLE "lgs_locales" CASCADE;
  DROP TABLE "lgv" CASCADE;
  DROP TABLE "lvw" CASCADE;
  DROP TABLE "msw" CASCADE;
  DROP TABLE "sdv" CASCADE;
  DROP TABLE "sdv_locales" CASCADE;
  DROP TABLE "sla_variants" CASCADE;
  DROP TABLE "sla_variants_locales" CASCADE;
  DROP TABLE "sla_apps" CASCADE;
  DROP TABLE "sla_apps_locales" CASCADE;
  DROP TABLE "sla" CASCADE;
  DROP TABLE "scs" CASCADE;
  DROP TABLE "tsc" CASCADE;
  DROP TABLE "guideline_docs_blocks_color_pairing" CASCADE;
  DROP TABLE "guideline_docs_blocks_color_pairing_locales" CASCADE;
  DROP TABLE "guideline_docs_blocks_color_pairing_recommendation" CASCADE;
  DROP TABLE "guideline_docs_blocks_color_pairing_recommendation_locales" CASCADE;
  DROP TABLE "guideline_docs_blocks_icon_grid" CASCADE;
  DROP TABLE "guideline_docs_blocks_icon_grid_locales" CASCADE;
  DROP TABLE "guideline_docs_blocks_image_grid_cells" CASCADE;
  DROP TABLE "guideline_docs_blocks_image_grid_cells_locales" CASCADE;
  DROP TABLE "guideline_docs_blocks_image_grid" CASCADE;
  DROP TABLE "guideline_docs_blocks_image_grid_locales" CASCADE;
  DROP TABLE "guideline_docs_blocks_logo_group_viewer_logos" CASCADE;
  DROP TABLE "guideline_docs_blocks_logo_group_viewer_logos_locales" CASCADE;
  DROP TABLE "guideline_docs_blocks_logo_group_viewer_topics" CASCADE;
  DROP TABLE "guideline_docs_blocks_logo_group_viewer_topics_locales" CASCADE;
  DROP TABLE "guideline_docs_blocks_logo_group_viewer" CASCADE;
  DROP TABLE "guideline_docs_blocks_logo_group_viewer_locales" CASCADE;
  DROP TABLE "guideline_docs_blocks_logo_viewer_topics" CASCADE;
  DROP TABLE "guideline_docs_blocks_logo_viewer_topics_locales" CASCADE;
  DROP TABLE "guideline_docs_blocks_logo_viewer" CASCADE;
  DROP TABLE "guideline_docs_blocks_logo_viewer_locales" CASCADE;
  DROP TABLE "guideline_docs_blocks_stem_clear_space" CASCADE;
  DROP TABLE "guideline_docs_blocks_stem_clear_space_locales" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_carousel_slides" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_carousel_slides_locales" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_carousel" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_media_showcase_images" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_media_showcase" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_color_palette" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_color_palette_locales" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_do_dont_groups_examples" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_do_dont_groups_examples_locales" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_do_dont_groups" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_do_dont_groups_locales" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_do_dont" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_do_dont_locales" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_spec_list_groups_specs" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_spec_list_groups" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_spec_list_groups_locales" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_spec_list" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_signature_showcase_signatures" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_signature_showcase_signatures_locales" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_signature_showcase" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_type_specimen" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_type_specimen_locales" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_type_scale_items" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_type_scale_items_locales" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_type_scale" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_layout_grid_variants" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_layout_grid_variants_locales" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_layout_grid" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_glyph_grid" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_glyph_grid_locales" CASCADE;
  DROP TABLE "_cpw_v" CASCADE;
  DROP TABLE "_car_v" CASCADE;
  DROP TABLE "_cpr_v" CASCADE;
  DROP TABLE "_cprr_v" CASCADE;
  DROP TABLE "_cin_v" CASCADE;
  DROP TABLE "_cin_v_locales" CASCADE;
  DROP TABLE "_glw_v" CASCADE;
  DROP TABLE "_icw_v" CASCADE;
  DROP TABLE "_imw_v" CASCADE;
  DROP TABLE "_iug_v" CASCADE;
  DROP TABLE "_lgs_v" CASCADE;
  DROP TABLE "_lgs_v_locales" CASCADE;
  DROP TABLE "_lgv_v" CASCADE;
  DROP TABLE "_lvw_v" CASCADE;
  DROP TABLE "_msw_v" CASCADE;
  DROP TABLE "_sdv_v" CASCADE;
  DROP TABLE "_sdv_v_locales" CASCADE;
  DROP TABLE "_sla_v_variants" CASCADE;
  DROP TABLE "_sla_v_variants_locales" CASCADE;
  DROP TABLE "_sla_v_apps" CASCADE;
  DROP TABLE "_sla_v_apps_locales" CASCADE;
  DROP TABLE "_sla_v" CASCADE;
  DROP TABLE "_scs_v" CASCADE;
  DROP TABLE "_tsc_v" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_color_pairing" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_color_pairing_locales" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_color_pairing_recommendation" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_color_pairing_recommendation_locales" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_icon_grid" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_icon_grid_locales" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_image_grid_cells" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_image_grid_cells_locales" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_image_grid" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_image_grid_locales" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_logo_group_viewer_logos" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_logo_group_viewer_logos_locales" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_logo_group_viewer_topics" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_logo_group_viewer_topics_locales" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_logo_group_viewer" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_logo_group_viewer_locales" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_logo_viewer_topics" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_logo_viewer_topics_locales" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_logo_viewer" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_logo_viewer_locales" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_stem_clear_space" CASCADE;
  DROP TABLE "_guideline_docs_v_blocks_stem_clear_space_locales" CASCADE;
  ALTER TABLE "guideline_docs_rels" DROP CONSTRAINT "guideline_docs_rels_brand_colors_fk";
  
  ALTER TABLE "_guideline_docs_v_rels" DROP CONSTRAINT "_guideline_docs_v_rels_brand_colors_fk";
  
  DROP INDEX "guideline_docs_rels_brand_colors_id_idx";
  DROP INDEX "_guideline_docs_v_rels_brand_colors_id_idx";
  ALTER TABLE "guideline_docs_rels" DROP COLUMN "brand_colors_id";
  ALTER TABLE "_guideline_docs_v_rels" DROP COLUMN "brand_colors_id";
  DROP TYPE "public"."enum_guideline_docs_blocks_carousel_image_ratio";
  DROP TYPE "public"."enum_guideline_docs_blocks_media_showcase_image_ratio";
  DROP TYPE "public"."enum_guideline_docs_blocks_do_dont_group_layout";
  DROP TYPE "public"."enum_lgs_form";
  DROP TYPE "public"."enum_sla_type";
  DROP TYPE "public"."enum_color_pairing_system";
  DROP TYPE "public"."enum_color_pairing_recommendation_variant";
  DROP TYPE "public"."enum_guideline_docs_blocks_image_grid_image_ratio";
  DROP TYPE "public"."enum_guideline_docs_blocks_logo_group_viewer_topics_kind";
  DROP TYPE "public"."enum_guideline_docs_blocks_logo_viewer_topics_kind";
  DROP TYPE "public"."enum__guideline_docs_v_blocks_carousel_image_ratio";
  DROP TYPE "public"."enum__guideline_docs_v_blocks_media_showcase_image_ratio";
  DROP TYPE "public"."enum__guideline_docs_v_blocks_do_dont_groups_kind";
  DROP TYPE "public"."enum__guideline_docs_v_blocks_do_dont_image_ratio";
  DROP TYPE "public"."enum__guideline_docs_v_blocks_do_dont_group_layout";
  DROP TYPE "public"."enum__guideline_docs_v_blocks_do_dont_example_columns";
  DROP TYPE "public"."enum__guideline_docs_v_blocks_image_grid_image_ratio";
  DROP TYPE "public"."enum__guideline_docs_v_blocks_logo_group_viewer_topics_kind";
  DROP TYPE "public"."enum__guideline_docs_v_blocks_logo_viewer_topics_kind";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_guideline_docs_blocks_carousel_image_ratio" AS ENUM('original', '1:1', '5:4', '4:3', '3:2', '16:9', '2:1', '7:3', '4:5', '3:4', '2:3', '9:16');
  CREATE TYPE "public"."enum_guideline_docs_blocks_media_showcase_image_ratio" AS ENUM('original', '1:1', '5:4', '4:3', '3:2', '16:9', '2:1', '7:3', '4:5', '3:4', '2:3', '9:16');
  CREATE TYPE "public"."enum_guideline_docs_blocks_do_dont_groups_kind" AS ENUM('do', 'ok', 'dont');
  CREATE TYPE "public"."enum_guideline_docs_blocks_do_dont_image_ratio" AS ENUM('original', '1:1', '5:4', '4:3', '3:2', '16:9', '2:1', '7:3', '4:5', '3:4', '2:3', '9:16');
  CREATE TYPE "public"."enum_guideline_docs_blocks_do_dont_group_layout" AS ENUM('vertical', 'horizontal');
  CREATE TYPE "public"."enum_guideline_docs_blocks_do_dont_example_columns" AS ENUM('2', '3', '4');
  CREATE TYPE "public"."enum_lgs_form" AS ENUM('horizontalA', 'horizontalB', 'vertical');
  CREATE TYPE "public"."enum_sla_type" AS ENUM('sign', 'effect');
  CREATE TYPE "public"."enum_color_pairing_system" AS ENUM('tone-in-tone', 'tone-on-tone', 'mono-tone');
  CREATE TYPE "public"."enum_color_pairing_recommendation_variant" AS ENUM('light', 'dark');
  CREATE TYPE "public"."enum_guideline_docs_blocks_image_grid_image_ratio" AS ENUM('original', '1:1', '5:4', '4:3', '3:2', '16:9', '2:1', '7:3', '4:5', '3:4', '2:3', '9:16', 'manual', 'firstImage');
  CREATE TYPE "public"."enum_guideline_docs_blocks_logo_group_viewer_topics_kind" AS ENUM('minSize', 'clearSpace', 'registeredMark');
  CREATE TYPE "public"."enum_guideline_docs_blocks_logo_viewer_topics_kind" AS ENUM('minSize', 'clearSpace', 'registeredMark');
  CREATE TYPE "public"."enum__guideline_docs_v_blocks_carousel_image_ratio" AS ENUM('original', '1:1', '5:4', '4:3', '3:2', '16:9', '2:1', '7:3', '4:5', '3:4', '2:3', '9:16');
  CREATE TYPE "public"."enum__guideline_docs_v_blocks_media_showcase_image_ratio" AS ENUM('original', '1:1', '5:4', '4:3', '3:2', '16:9', '2:1', '7:3', '4:5', '3:4', '2:3', '9:16');
  CREATE TYPE "public"."enum__guideline_docs_v_blocks_do_dont_groups_kind" AS ENUM('do', 'ok', 'dont');
  CREATE TYPE "public"."enum__guideline_docs_v_blocks_do_dont_image_ratio" AS ENUM('original', '1:1', '5:4', '4:3', '3:2', '16:9', '2:1', '7:3', '4:5', '3:4', '2:3', '9:16');
  CREATE TYPE "public"."enum__guideline_docs_v_blocks_do_dont_group_layout" AS ENUM('vertical', 'horizontal');
  CREATE TYPE "public"."enum__guideline_docs_v_blocks_do_dont_example_columns" AS ENUM('2', '3', '4');
  CREATE TYPE "public"."enum__guideline_docs_v_blocks_image_grid_image_ratio" AS ENUM('original', '1:1', '5:4', '4:3', '3:2', '16:9', '2:1', '7:3', '4:5', '3:4', '2:3', '9:16', 'manual', 'firstImage');
  CREATE TYPE "public"."enum__guideline_docs_v_blocks_logo_group_viewer_topics_kind" AS ENUM('minSize', 'clearSpace', 'registeredMark');
  CREATE TYPE "public"."enum__guideline_docs_v_blocks_logo_viewer_topics_kind" AS ENUM('minSize', 'clearSpace', 'registeredMark');
  CREATE TABLE "guideline_docs_blocks_carousel_slides" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer
  );
  
  CREATE TABLE "guideline_docs_blocks_carousel_slides_locales" (
  	"caption" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "guideline_docs_blocks_carousel" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_ratio" "enum_guideline_docs_blocks_carousel_image_ratio" DEFAULT '16:9',
  	"block_name" varchar
  );
  
  CREATE TABLE "guideline_docs_blocks_media_showcase_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"image_background_color_id" integer,
  	"image_scale" "enum_image_scale" DEFAULT '100'
  );
  
  CREATE TABLE "guideline_docs_blocks_media_showcase" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_ratio" "enum_guideline_docs_blocks_media_showcase_image_ratio" DEFAULT '16:9',
  	"block_name" varchar
  );
  
  CREATE TABLE "guideline_docs_blocks_color_palette" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "guideline_docs_blocks_color_palette_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "guideline_docs_blocks_do_dont_groups_examples" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer
  );
  
  CREATE TABLE "guideline_docs_blocks_do_dont_groups_examples_locales" (
  	"caption" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "guideline_docs_blocks_do_dont_groups" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"kind" "enum_guideline_docs_blocks_do_dont_groups_kind" DEFAULT 'dont'
  );
  
  CREATE TABLE "guideline_docs_blocks_do_dont_groups_locales" (
  	"category" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "guideline_docs_blocks_do_dont" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_ratio" "enum_guideline_docs_blocks_do_dont_image_ratio" DEFAULT '4:3',
  	"group_layout" "enum_guideline_docs_blocks_do_dont_group_layout" DEFAULT 'vertical',
  	"example_columns" "enum_guideline_docs_blocks_do_dont_example_columns" DEFAULT '3',
  	"block_name" varchar
  );
  
  CREATE TABLE "guideline_docs_blocks_do_dont_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "guideline_docs_blocks_spec_list_groups_specs" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" varchar
  );
  
  CREATE TABLE "guideline_docs_blocks_spec_list_groups" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "guideline_docs_blocks_spec_list_groups_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "guideline_docs_blocks_spec_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "guideline_docs_blocks_signature_showcase_signatures" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"phrase" varchar
  );
  
  CREATE TABLE "guideline_docs_blocks_signature_showcase_signatures_locales" (
  	"label" varchar,
  	"note" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "guideline_docs_blocks_signature_showcase" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "guideline_docs_blocks_type_specimen" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"typeface_id" integer,
  	"block_name" varchar
  );
  
  CREATE TABLE "guideline_docs_blocks_type_specimen_locales" (
  	"samples_word" varchar,
  	"samples_sentence" varchar,
  	"samples_paragraph" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "guideline_docs_blocks_type_scale_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"size_px" numeric,
  	"line_height_px" numeric,
  	"weight" numeric
  );
  
  CREATE TABLE "guideline_docs_blocks_type_scale_items_locales" (
  	"sample" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "guideline_docs_blocks_type_scale" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"typeface_id" integer,
  	"block_name" varchar
  );
  
  CREATE TABLE "guideline_docs_blocks_layout_grid_variants" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"columns" numeric,
  	"gutter" varchar,
  	"margin" varchar
  );
  
  CREATE TABLE "guideline_docs_blocks_layout_grid_variants_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "guideline_docs_blocks_layout_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"accent_id" integer,
  	"block_name" varchar
  );
  
  CREATE TABLE "guideline_docs_blocks_glyph_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"typeface_id" integer,
  	"block_name" varchar
  );
  
  CREATE TABLE "guideline_docs_blocks_glyph_grid_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "cpw" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "car" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "cpr" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "cprr" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "cin" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"logo_id" integer,
  	"block_name" varchar
  );
  
  CREATE TABLE "cin_locales" (
  	"lead" varchar,
  	"body" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "glw" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "icw" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "imw" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "iug" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "lgs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"form" "enum_lgs_form" DEFAULT 'horizontalA',
  	"block_name" varchar
  );
  
  CREATE TABLE "lgs_locales" (
  	"name_ko" varchar DEFAULT 'HD현대중공업',
  	"name_en" varchar DEFAULT 'HYUNDAI
  HEAVY INDUSTRIES',
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "lgv" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "lvw" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "msw" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "sdv" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "sdv_locales" (
  	"chapter_code" varchar,
  	"chapter_title" varchar,
  	"section_code" varchar,
  	"section_title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "sla_variants" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"logo_id" integer
  );
  
  CREATE TABLE "sla_variants_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "sla_apps" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"type" "enum_sla_type" DEFAULT 'sign',
  	"image_id" integer
  );
  
  CREATE TABLE "sla_apps_locales" (
  	"caption" varchar,
  	"note" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "sla" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "scs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "tsc" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "guideline_docs_blocks_color_pairing" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"system" "enum_color_pairing_system" DEFAULT 'tone-in-tone',
  	"block_name" varchar
  );
  
  CREATE TABLE "guideline_docs_blocks_color_pairing_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "guideline_docs_blocks_color_pairing_recommendation" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"variant" "enum_color_pairing_recommendation_variant" DEFAULT 'light',
  	"block_name" varchar
  );
  
  CREATE TABLE "guideline_docs_blocks_color_pairing_recommendation_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "guideline_docs_blocks_icon_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"colored" boolean DEFAULT false,
  	"cell_height_pct" numeric DEFAULT 100,
  	"svg_size_pct" numeric DEFAULT 70,
  	"svg_offset_pct" numeric DEFAULT 0,
  	"block_name" varchar
  );
  
  CREATE TABLE "guideline_docs_blocks_icon_grid_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "guideline_docs_blocks_image_grid_cells" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer
  );
  
  CREATE TABLE "guideline_docs_blocks_image_grid_cells_locales" (
  	"caption" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "guideline_docs_blocks_image_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"columns" numeric DEFAULT 3,
  	"rows" numeric DEFAULT 2,
  	"image_ratio" "enum_guideline_docs_blocks_image_grid_image_ratio" DEFAULT '1:1',
  	"ratio_width" numeric DEFAULT 4,
  	"ratio_height" numeric DEFAULT 3,
  	"block_name" varchar
  );
  
  CREATE TABLE "guideline_docs_blocks_image_grid_locales" (
  	"title" varchar,
  	"description" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "guideline_docs_blocks_logo_group_viewer_logos" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"logo_id" integer,
  	"logo_real_height_px" numeric,
  	"registered_mark_id" integer,
  	"clear_space_guide_id" integer,
  	"min_size_px" numeric DEFAULT 20,
  	"registered_min_px" numeric DEFAULT 45
  );
  
  CREATE TABLE "guideline_docs_blocks_logo_group_viewer_logos_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "guideline_docs_blocks_logo_group_viewer_topics" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"kind" "enum_guideline_docs_blocks_logo_group_viewer_topics_kind"
  );
  
  CREATE TABLE "guideline_docs_blocks_logo_group_viewer_topics_locales" (
  	"label" varchar,
  	"description" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "guideline_docs_blocks_logo_group_viewer" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "guideline_docs_blocks_logo_group_viewer_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "guideline_docs_blocks_logo_viewer_topics" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"kind" "enum_guideline_docs_blocks_logo_viewer_topics_kind"
  );
  
  CREATE TABLE "guideline_docs_blocks_logo_viewer_topics_locales" (
  	"label" varchar,
  	"description" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "guideline_docs_blocks_logo_viewer" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"logo_id" integer,
  	"logo_real_height_px" numeric,
  	"registered_mark_id" integer,
  	"clear_space_guide_id" integer,
  	"min_size_px" numeric DEFAULT 20,
  	"registered_min_px" numeric DEFAULT 45,
  	"block_name" varchar
  );
  
  CREATE TABLE "guideline_docs_blocks_logo_viewer_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "guideline_docs_blocks_stem_clear_space" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"logo_id" integer,
  	"stem_ratio" numeric DEFAULT 0.025,
  	"stem_x" numeric DEFAULT 0.29,
  	"multiplier" numeric DEFAULT 3,
  	"block_name" varchar
  );
  
  CREATE TABLE "guideline_docs_blocks_stem_clear_space_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "_guideline_docs_v_blocks_carousel_slides" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_guideline_docs_v_blocks_carousel_slides_locales" (
  	"caption" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_guideline_docs_v_blocks_carousel" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_ratio" "enum__guideline_docs_v_blocks_carousel_image_ratio" DEFAULT '16:9',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_guideline_docs_v_blocks_media_showcase_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"image_background_color_id" integer,
  	"image_scale" "enum_image_scale" DEFAULT '100',
  	"_uuid" varchar
  );
  
  CREATE TABLE "_guideline_docs_v_blocks_media_showcase" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_ratio" "enum__guideline_docs_v_blocks_media_showcase_image_ratio" DEFAULT '16:9',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_guideline_docs_v_blocks_color_palette" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_guideline_docs_v_blocks_color_palette_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_guideline_docs_v_blocks_do_dont_groups_examples" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_guideline_docs_v_blocks_do_dont_groups_examples_locales" (
  	"caption" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_guideline_docs_v_blocks_do_dont_groups" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"kind" "enum__guideline_docs_v_blocks_do_dont_groups_kind" DEFAULT 'dont',
  	"_uuid" varchar
  );
  
  CREATE TABLE "_guideline_docs_v_blocks_do_dont_groups_locales" (
  	"category" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_guideline_docs_v_blocks_do_dont" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_ratio" "enum__guideline_docs_v_blocks_do_dont_image_ratio" DEFAULT '4:3',
  	"group_layout" "enum__guideline_docs_v_blocks_do_dont_group_layout" DEFAULT 'vertical',
  	"example_columns" "enum__guideline_docs_v_blocks_do_dont_example_columns" DEFAULT '3',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_guideline_docs_v_blocks_do_dont_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_guideline_docs_v_blocks_spec_list_groups_specs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_guideline_docs_v_blocks_spec_list_groups" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_guideline_docs_v_blocks_spec_list_groups_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_guideline_docs_v_blocks_spec_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_guideline_docs_v_blocks_signature_showcase_signatures" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"phrase" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_guideline_docs_v_blocks_signature_showcase_signatures_locales" (
  	"label" varchar,
  	"note" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_guideline_docs_v_blocks_signature_showcase" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_guideline_docs_v_blocks_type_specimen" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"typeface_id" integer,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_guideline_docs_v_blocks_type_specimen_locales" (
  	"samples_word" varchar,
  	"samples_sentence" varchar,
  	"samples_paragraph" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_guideline_docs_v_blocks_type_scale_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"size_px" numeric,
  	"line_height_px" numeric,
  	"weight" numeric,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_guideline_docs_v_blocks_type_scale_items_locales" (
  	"sample" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_guideline_docs_v_blocks_type_scale" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"typeface_id" integer,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_guideline_docs_v_blocks_layout_grid_variants" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"columns" numeric,
  	"gutter" varchar,
  	"margin" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_guideline_docs_v_blocks_layout_grid_variants_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_guideline_docs_v_blocks_layout_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"accent_id" integer,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_guideline_docs_v_blocks_glyph_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"typeface_id" integer,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_guideline_docs_v_blocks_glyph_grid_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_cpw_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_car_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_cpr_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_cprr_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_cin_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"logo_id" integer,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_cin_v_locales" (
  	"lead" varchar,
  	"body" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_glw_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_icw_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_imw_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_iug_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_lgs_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"form" "enum_lgs_form" DEFAULT 'horizontalA',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_lgs_v_locales" (
  	"name_ko" varchar DEFAULT 'HD현대중공업',
  	"name_en" varchar DEFAULT 'HYUNDAI
  HEAVY INDUSTRIES',
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_lgv_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_lvw_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_msw_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_sdv_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_sdv_v_locales" (
  	"chapter_code" varchar,
  	"chapter_title" varchar,
  	"section_code" varchar,
  	"section_title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_sla_v_variants" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"logo_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_sla_v_variants_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_sla_v_apps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"type" "enum_sla_type" DEFAULT 'sign',
  	"image_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_sla_v_apps_locales" (
  	"caption" varchar,
  	"note" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_sla_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_scs_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_tsc_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_guideline_docs_v_blocks_color_pairing" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"system" "enum_color_pairing_system" DEFAULT 'tone-in-tone',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_guideline_docs_v_blocks_color_pairing_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_guideline_docs_v_blocks_color_pairing_recommendation" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"variant" "enum_color_pairing_recommendation_variant" DEFAULT 'light',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_guideline_docs_v_blocks_color_pairing_recommendation_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_guideline_docs_v_blocks_icon_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"colored" boolean DEFAULT false,
  	"cell_height_pct" numeric DEFAULT 100,
  	"svg_size_pct" numeric DEFAULT 70,
  	"svg_offset_pct" numeric DEFAULT 0,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_guideline_docs_v_blocks_icon_grid_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_guideline_docs_v_blocks_image_grid_cells" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_guideline_docs_v_blocks_image_grid_cells_locales" (
  	"caption" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_guideline_docs_v_blocks_image_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"columns" numeric DEFAULT 3,
  	"rows" numeric DEFAULT 2,
  	"image_ratio" "enum__guideline_docs_v_blocks_image_grid_image_ratio" DEFAULT '1:1',
  	"ratio_width" numeric DEFAULT 4,
  	"ratio_height" numeric DEFAULT 3,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_guideline_docs_v_blocks_image_grid_locales" (
  	"title" varchar,
  	"description" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_guideline_docs_v_blocks_logo_group_viewer_logos" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"logo_id" integer,
  	"logo_real_height_px" numeric,
  	"registered_mark_id" integer,
  	"clear_space_guide_id" integer,
  	"min_size_px" numeric DEFAULT 20,
  	"registered_min_px" numeric DEFAULT 45,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_guideline_docs_v_blocks_logo_group_viewer_logos_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_guideline_docs_v_blocks_logo_group_viewer_topics" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"kind" "enum__guideline_docs_v_blocks_logo_group_viewer_topics_kind",
  	"_uuid" varchar
  );
  
  CREATE TABLE "_guideline_docs_v_blocks_logo_group_viewer_topics_locales" (
  	"label" varchar,
  	"description" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_guideline_docs_v_blocks_logo_group_viewer" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_guideline_docs_v_blocks_logo_group_viewer_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_guideline_docs_v_blocks_logo_viewer_topics" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"kind" "enum__guideline_docs_v_blocks_logo_viewer_topics_kind",
  	"_uuid" varchar
  );
  
  CREATE TABLE "_guideline_docs_v_blocks_logo_viewer_topics_locales" (
  	"label" varchar,
  	"description" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_guideline_docs_v_blocks_logo_viewer" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"logo_id" integer,
  	"logo_real_height_px" numeric,
  	"registered_mark_id" integer,
  	"clear_space_guide_id" integer,
  	"min_size_px" numeric DEFAULT 20,
  	"registered_min_px" numeric DEFAULT 45,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_guideline_docs_v_blocks_logo_viewer_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_guideline_docs_v_blocks_stem_clear_space" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"logo_id" integer,
  	"stem_ratio" numeric DEFAULT 0.025,
  	"stem_x" numeric DEFAULT 0.29,
  	"multiplier" numeric DEFAULT 3,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_guideline_docs_v_blocks_stem_clear_space_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "ddw_examples" ALTER COLUMN "kind" DROP DEFAULT;
  ALTER TABLE "ddw_examples" ALTER COLUMN "kind" SET DATA TYPE "public"."enum_guideline_docs_blocks_do_dont_groups_kind" USING "kind"::text::"public"."enum_guideline_docs_blocks_do_dont_groups_kind";
  ALTER TABLE "ddw_examples" ALTER COLUMN "kind" SET DEFAULT 'dont';
  ALTER TABLE "ddw" ALTER COLUMN "image_ratio" DROP DEFAULT;
  ALTER TABLE "ddw" ALTER COLUMN "image_ratio" SET DATA TYPE "public"."enum_guideline_docs_blocks_do_dont_image_ratio" USING "image_ratio"::text::"public"."enum_guideline_docs_blocks_do_dont_image_ratio";
  ALTER TABLE "ddw" ALTER COLUMN "image_ratio" SET DEFAULT '16:9';
  ALTER TABLE "ddw" ALTER COLUMN "columns" DROP DEFAULT;
  ALTER TABLE "ddw" ALTER COLUMN "columns" SET DATA TYPE "public"."enum_guideline_docs_blocks_do_dont_example_columns" USING "columns"::text::"public"."enum_guideline_docs_blocks_do_dont_example_columns";
  ALTER TABLE "ddw" ALTER COLUMN "columns" SET DEFAULT '3';
  ALTER TABLE "_ddw_v_examples" ALTER COLUMN "kind" DROP DEFAULT;
  ALTER TABLE "_ddw_v_examples" ALTER COLUMN "kind" SET DATA TYPE "public"."enum_guideline_docs_blocks_do_dont_groups_kind" USING "kind"::text::"public"."enum_guideline_docs_blocks_do_dont_groups_kind";
  ALTER TABLE "_ddw_v_examples" ALTER COLUMN "kind" SET DEFAULT 'dont';
  ALTER TABLE "_ddw_v" ALTER COLUMN "image_ratio" DROP DEFAULT;
  ALTER TABLE "_ddw_v" ALTER COLUMN "image_ratio" SET DATA TYPE "public"."enum_guideline_docs_blocks_do_dont_image_ratio" USING "image_ratio"::text::"public"."enum_guideline_docs_blocks_do_dont_image_ratio";
  ALTER TABLE "_ddw_v" ALTER COLUMN "image_ratio" SET DEFAULT '16:9';
  ALTER TABLE "_ddw_v" ALTER COLUMN "columns" DROP DEFAULT;
  ALTER TABLE "_ddw_v" ALTER COLUMN "columns" SET DATA TYPE "public"."enum_guideline_docs_blocks_do_dont_example_columns" USING "columns"::text::"public"."enum_guideline_docs_blocks_do_dont_example_columns";
  ALTER TABLE "_ddw_v" ALTER COLUMN "columns" SET DEFAULT '3';
  ALTER TABLE "guideline_docs_rels" ADD COLUMN "brand_colors_id" integer;
  ALTER TABLE "_guideline_docs_v_rels" ADD COLUMN "brand_colors_id" integer;
  ALTER TABLE "guideline_docs_blocks_carousel_slides" ADD CONSTRAINT "guideline_docs_blocks_carousel_slides_image_id_application_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_carousel_slides" ADD CONSTRAINT "guideline_docs_blocks_carousel_slides_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_carousel"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_carousel_slides_locales" ADD CONSTRAINT "guideline_docs_blocks_carousel_slides_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_carousel_slides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_carousel" ADD CONSTRAINT "guideline_docs_blocks_carousel_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_media_showcase_images" ADD CONSTRAINT "guideline_docs_blocks_media_showcase_images_image_id_application_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_media_showcase_images" ADD CONSTRAINT "guideline_docs_blocks_media_showcase_images_image_background_color_id_brand_colors_id_fk" FOREIGN KEY ("image_background_color_id") REFERENCES "public"."brand_colors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_media_showcase_images" ADD CONSTRAINT "guideline_docs_blocks_media_showcase_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_media_showcase"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_media_showcase" ADD CONSTRAINT "guideline_docs_blocks_media_showcase_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_color_palette" ADD CONSTRAINT "guideline_docs_blocks_color_palette_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_color_palette_locales" ADD CONSTRAINT "guideline_docs_blocks_color_palette_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_color_palette"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_do_dont_groups_examples" ADD CONSTRAINT "guideline_docs_blocks_do_dont_groups_examples_image_id_application_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_do_dont_groups_examples" ADD CONSTRAINT "guideline_docs_blocks_do_dont_groups_examples_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_do_dont_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_do_dont_groups_examples_locales" ADD CONSTRAINT "guideline_docs_blocks_do_dont_groups_examples_locales_par_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_do_dont_groups_examples"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_do_dont_groups" ADD CONSTRAINT "guideline_docs_blocks_do_dont_groups_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_do_dont"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_do_dont_groups_locales" ADD CONSTRAINT "guideline_docs_blocks_do_dont_groups_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_do_dont_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_do_dont" ADD CONSTRAINT "guideline_docs_blocks_do_dont_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_do_dont_locales" ADD CONSTRAINT "guideline_docs_blocks_do_dont_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_do_dont"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_spec_list_groups_specs" ADD CONSTRAINT "guideline_docs_blocks_spec_list_groups_specs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_spec_list_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_spec_list_groups" ADD CONSTRAINT "guideline_docs_blocks_spec_list_groups_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_spec_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_spec_list_groups_locales" ADD CONSTRAINT "guideline_docs_blocks_spec_list_groups_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_spec_list_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_spec_list" ADD CONSTRAINT "guideline_docs_blocks_spec_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_signature_showcase_signatures" ADD CONSTRAINT "guideline_docs_blocks_signature_showcase_signatures_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_signature_showcase"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_signature_showcase_signatures_locales" ADD CONSTRAINT "guideline_docs_blocks_signature_showcase_signatures_local_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_signature_showcase_signatures"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_signature_showcase" ADD CONSTRAINT "guideline_docs_blocks_signature_showcase_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_type_specimen" ADD CONSTRAINT "guideline_docs_blocks_type_specimen_typeface_id_brand_typefaces_id_fk" FOREIGN KEY ("typeface_id") REFERENCES "public"."brand_typefaces"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_type_specimen" ADD CONSTRAINT "guideline_docs_blocks_type_specimen_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_type_specimen_locales" ADD CONSTRAINT "guideline_docs_blocks_type_specimen_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_type_specimen"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_type_scale_items" ADD CONSTRAINT "guideline_docs_blocks_type_scale_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_type_scale"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_type_scale_items_locales" ADD CONSTRAINT "guideline_docs_blocks_type_scale_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_type_scale_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_type_scale" ADD CONSTRAINT "guideline_docs_blocks_type_scale_typeface_id_brand_typefaces_id_fk" FOREIGN KEY ("typeface_id") REFERENCES "public"."brand_typefaces"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_type_scale" ADD CONSTRAINT "guideline_docs_blocks_type_scale_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_layout_grid_variants" ADD CONSTRAINT "guideline_docs_blocks_layout_grid_variants_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_layout_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_layout_grid_variants_locales" ADD CONSTRAINT "guideline_docs_blocks_layout_grid_variants_locales_parent_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_layout_grid_variants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_layout_grid" ADD CONSTRAINT "guideline_docs_blocks_layout_grid_accent_id_brand_colors_id_fk" FOREIGN KEY ("accent_id") REFERENCES "public"."brand_colors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_layout_grid" ADD CONSTRAINT "guideline_docs_blocks_layout_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_glyph_grid" ADD CONSTRAINT "guideline_docs_blocks_glyph_grid_typeface_id_brand_typefaces_id_fk" FOREIGN KEY ("typeface_id") REFERENCES "public"."brand_typefaces"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_glyph_grid" ADD CONSTRAINT "guideline_docs_blocks_glyph_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_glyph_grid_locales" ADD CONSTRAINT "guideline_docs_blocks_glyph_grid_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_glyph_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cpw" ADD CONSTRAINT "cpw_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "car" ADD CONSTRAINT "car_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cpr" ADD CONSTRAINT "cpr_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cprr" ADD CONSTRAINT "cprr_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cin" ADD CONSTRAINT "cin_logo_id_brand_logos_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."brand_logos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cin" ADD CONSTRAINT "cin_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cin_locales" ADD CONSTRAINT "cin_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."cin"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "glw" ADD CONSTRAINT "glw_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "icw" ADD CONSTRAINT "icw_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "imw" ADD CONSTRAINT "imw_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "iug" ADD CONSTRAINT "iug_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "lgs" ADD CONSTRAINT "lgs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "lgs_locales" ADD CONSTRAINT "lgs_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."lgs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "lgv" ADD CONSTRAINT "lgv_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "lvw" ADD CONSTRAINT "lvw_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "msw" ADD CONSTRAINT "msw_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sdv" ADD CONSTRAINT "sdv_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sdv_locales" ADD CONSTRAINT "sdv_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sdv"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sla_variants" ADD CONSTRAINT "sla_variants_logo_id_brand_logos_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."brand_logos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sla_variants" ADD CONSTRAINT "sla_variants_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sla"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sla_variants_locales" ADD CONSTRAINT "sla_variants_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sla_variants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sla_apps" ADD CONSTRAINT "sla_apps_image_id_application_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sla_apps" ADD CONSTRAINT "sla_apps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sla"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sla_apps_locales" ADD CONSTRAINT "sla_apps_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sla_apps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sla" ADD CONSTRAINT "sla_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "scs" ADD CONSTRAINT "scs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tsc" ADD CONSTRAINT "tsc_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_color_pairing" ADD CONSTRAINT "guideline_docs_blocks_color_pairing_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_color_pairing_locales" ADD CONSTRAINT "guideline_docs_blocks_color_pairing_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_color_pairing"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_color_pairing_recommendation" ADD CONSTRAINT "guideline_docs_blocks_color_pairing_recommendation_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_color_pairing_recommendation_locales" ADD CONSTRAINT "guideline_docs_blocks_color_pairing_recommendation_locale_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_color_pairing_recommendation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_icon_grid" ADD CONSTRAINT "guideline_docs_blocks_icon_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_icon_grid_locales" ADD CONSTRAINT "guideline_docs_blocks_icon_grid_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_icon_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_image_grid_cells" ADD CONSTRAINT "guideline_docs_blocks_image_grid_cells_image_id_application_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_image_grid_cells" ADD CONSTRAINT "guideline_docs_blocks_image_grid_cells_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_image_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_image_grid_cells_locales" ADD CONSTRAINT "guideline_docs_blocks_image_grid_cells_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_image_grid_cells"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_image_grid" ADD CONSTRAINT "guideline_docs_blocks_image_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_image_grid_locales" ADD CONSTRAINT "guideline_docs_blocks_image_grid_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_image_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_logo_group_viewer_logos" ADD CONSTRAINT "guideline_docs_blocks_logo_group_viewer_logos_logo_id_application_images_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_logo_group_viewer_logos" ADD CONSTRAINT "guideline_docs_blocks_logo_group_viewer_logos_registered_mark_id_application_images_id_fk" FOREIGN KEY ("registered_mark_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_logo_group_viewer_logos" ADD CONSTRAINT "guideline_docs_blocks_logo_group_viewer_logos_clear_space_guide_id_application_images_id_fk" FOREIGN KEY ("clear_space_guide_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_logo_group_viewer_logos" ADD CONSTRAINT "guideline_docs_blocks_logo_group_viewer_logos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_logo_group_viewer"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_logo_group_viewer_logos_locales" ADD CONSTRAINT "guideline_docs_blocks_logo_group_viewer_logos_locales_par_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_logo_group_viewer_logos"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_logo_group_viewer_topics" ADD CONSTRAINT "guideline_docs_blocks_logo_group_viewer_topics_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_logo_group_viewer"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_logo_group_viewer_topics_locales" ADD CONSTRAINT "guideline_docs_blocks_logo_group_viewer_topics_locales_pa_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_logo_group_viewer_topics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_logo_group_viewer" ADD CONSTRAINT "guideline_docs_blocks_logo_group_viewer_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_logo_group_viewer_locales" ADD CONSTRAINT "guideline_docs_blocks_logo_group_viewer_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_logo_group_viewer"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_logo_viewer_topics" ADD CONSTRAINT "guideline_docs_blocks_logo_viewer_topics_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_logo_viewer"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_logo_viewer_topics_locales" ADD CONSTRAINT "guideline_docs_blocks_logo_viewer_topics_locales_parent_i_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_logo_viewer_topics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_logo_viewer" ADD CONSTRAINT "guideline_docs_blocks_logo_viewer_logo_id_application_images_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_logo_viewer" ADD CONSTRAINT "guideline_docs_blocks_logo_viewer_registered_mark_id_application_images_id_fk" FOREIGN KEY ("registered_mark_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_logo_viewer" ADD CONSTRAINT "guideline_docs_blocks_logo_viewer_clear_space_guide_id_application_images_id_fk" FOREIGN KEY ("clear_space_guide_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_logo_viewer" ADD CONSTRAINT "guideline_docs_blocks_logo_viewer_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_logo_viewer_locales" ADD CONSTRAINT "guideline_docs_blocks_logo_viewer_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_logo_viewer"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_stem_clear_space" ADD CONSTRAINT "guideline_docs_blocks_stem_clear_space_logo_id_brand_logos_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."brand_logos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_stem_clear_space" ADD CONSTRAINT "guideline_docs_blocks_stem_clear_space_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_docs_blocks_stem_clear_space_locales" ADD CONSTRAINT "guideline_docs_blocks_stem_clear_space_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guideline_docs_blocks_stem_clear_space"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_carousel_slides" ADD CONSTRAINT "_guideline_docs_v_blocks_carousel_slides_image_id_application_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_carousel_slides" ADD CONSTRAINT "_guideline_docs_v_blocks_carousel_slides_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_carousel"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_carousel_slides_locales" ADD CONSTRAINT "_guideline_docs_v_blocks_carousel_slides_locales_parent_i_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_carousel_slides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_carousel" ADD CONSTRAINT "_guideline_docs_v_blocks_carousel_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_media_showcase_images" ADD CONSTRAINT "_guideline_docs_v_blocks_media_showcase_images_image_id_application_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_media_showcase_images" ADD CONSTRAINT "_guideline_docs_v_blocks_media_showcase_images_image_background_color_id_brand_colors_id_fk" FOREIGN KEY ("image_background_color_id") REFERENCES "public"."brand_colors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_media_showcase_images" ADD CONSTRAINT "_guideline_docs_v_blocks_media_showcase_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_media_showcase"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_media_showcase" ADD CONSTRAINT "_guideline_docs_v_blocks_media_showcase_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_color_palette" ADD CONSTRAINT "_guideline_docs_v_blocks_color_palette_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_color_palette_locales" ADD CONSTRAINT "_guideline_docs_v_blocks_color_palette_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_color_palette"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_do_dont_groups_examples" ADD CONSTRAINT "_guideline_docs_v_blocks_do_dont_groups_examples_image_id_application_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_do_dont_groups_examples" ADD CONSTRAINT "_guideline_docs_v_blocks_do_dont_groups_examples_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_do_dont_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_do_dont_groups_examples_locales" ADD CONSTRAINT "_guideline_docs_v_blocks_do_dont_groups_examples_locales__fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_do_dont_groups_examples"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_do_dont_groups" ADD CONSTRAINT "_guideline_docs_v_blocks_do_dont_groups_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_do_dont"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_do_dont_groups_locales" ADD CONSTRAINT "_guideline_docs_v_blocks_do_dont_groups_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_do_dont_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_do_dont" ADD CONSTRAINT "_guideline_docs_v_blocks_do_dont_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_do_dont_locales" ADD CONSTRAINT "_guideline_docs_v_blocks_do_dont_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_do_dont"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_spec_list_groups_specs" ADD CONSTRAINT "_guideline_docs_v_blocks_spec_list_groups_specs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_spec_list_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_spec_list_groups" ADD CONSTRAINT "_guideline_docs_v_blocks_spec_list_groups_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_spec_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_spec_list_groups_locales" ADD CONSTRAINT "_guideline_docs_v_blocks_spec_list_groups_locales_parent__fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_spec_list_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_spec_list" ADD CONSTRAINT "_guideline_docs_v_blocks_spec_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_signature_showcase_signatures" ADD CONSTRAINT "_guideline_docs_v_blocks_signature_showcase_signatures_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_signature_showcase"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_signature_showcase_signatures_locales" ADD CONSTRAINT "_guideline_docs_v_blocks_signature_showcase_signatures_lo_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_signature_showcase_signatures"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_signature_showcase" ADD CONSTRAINT "_guideline_docs_v_blocks_signature_showcase_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_type_specimen" ADD CONSTRAINT "_guideline_docs_v_blocks_type_specimen_typeface_id_brand_typefaces_id_fk" FOREIGN KEY ("typeface_id") REFERENCES "public"."brand_typefaces"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_type_specimen" ADD CONSTRAINT "_guideline_docs_v_blocks_type_specimen_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_type_specimen_locales" ADD CONSTRAINT "_guideline_docs_v_blocks_type_specimen_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_type_specimen"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_type_scale_items" ADD CONSTRAINT "_guideline_docs_v_blocks_type_scale_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_type_scale"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_type_scale_items_locales" ADD CONSTRAINT "_guideline_docs_v_blocks_type_scale_items_locales_parent__fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_type_scale_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_type_scale" ADD CONSTRAINT "_guideline_docs_v_blocks_type_scale_typeface_id_brand_typefaces_id_fk" FOREIGN KEY ("typeface_id") REFERENCES "public"."brand_typefaces"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_type_scale" ADD CONSTRAINT "_guideline_docs_v_blocks_type_scale_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_layout_grid_variants" ADD CONSTRAINT "_guideline_docs_v_blocks_layout_grid_variants_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_layout_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_layout_grid_variants_locales" ADD CONSTRAINT "_guideline_docs_v_blocks_layout_grid_variants_locales_par_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_layout_grid_variants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_layout_grid" ADD CONSTRAINT "_guideline_docs_v_blocks_layout_grid_accent_id_brand_colors_id_fk" FOREIGN KEY ("accent_id") REFERENCES "public"."brand_colors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_layout_grid" ADD CONSTRAINT "_guideline_docs_v_blocks_layout_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_glyph_grid" ADD CONSTRAINT "_guideline_docs_v_blocks_glyph_grid_typeface_id_brand_typefaces_id_fk" FOREIGN KEY ("typeface_id") REFERENCES "public"."brand_typefaces"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_glyph_grid" ADD CONSTRAINT "_guideline_docs_v_blocks_glyph_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_glyph_grid_locales" ADD CONSTRAINT "_guideline_docs_v_blocks_glyph_grid_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_glyph_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_cpw_v" ADD CONSTRAINT "_cpw_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_car_v" ADD CONSTRAINT "_car_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_cpr_v" ADD CONSTRAINT "_cpr_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_cprr_v" ADD CONSTRAINT "_cprr_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_cin_v" ADD CONSTRAINT "_cin_v_logo_id_brand_logos_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."brand_logos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_cin_v" ADD CONSTRAINT "_cin_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_cin_v_locales" ADD CONSTRAINT "_cin_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_cin_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_glw_v" ADD CONSTRAINT "_glw_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_icw_v" ADD CONSTRAINT "_icw_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_imw_v" ADD CONSTRAINT "_imw_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_iug_v" ADD CONSTRAINT "_iug_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_lgs_v" ADD CONSTRAINT "_lgs_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_lgs_v_locales" ADD CONSTRAINT "_lgs_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_lgs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_lgv_v" ADD CONSTRAINT "_lgv_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_lvw_v" ADD CONSTRAINT "_lvw_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_msw_v" ADD CONSTRAINT "_msw_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_sdv_v" ADD CONSTRAINT "_sdv_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_sdv_v_locales" ADD CONSTRAINT "_sdv_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_sdv_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_sla_v_variants" ADD CONSTRAINT "_sla_v_variants_logo_id_brand_logos_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."brand_logos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_sla_v_variants" ADD CONSTRAINT "_sla_v_variants_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_sla_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_sla_v_variants_locales" ADD CONSTRAINT "_sla_v_variants_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_sla_v_variants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_sla_v_apps" ADD CONSTRAINT "_sla_v_apps_image_id_application_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_sla_v_apps" ADD CONSTRAINT "_sla_v_apps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_sla_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_sla_v_apps_locales" ADD CONSTRAINT "_sla_v_apps_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_sla_v_apps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_sla_v" ADD CONSTRAINT "_sla_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_scs_v" ADD CONSTRAINT "_scs_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_tsc_v" ADD CONSTRAINT "_tsc_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_color_pairing" ADD CONSTRAINT "_guideline_docs_v_blocks_color_pairing_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_color_pairing_locales" ADD CONSTRAINT "_guideline_docs_v_blocks_color_pairing_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_color_pairing"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_color_pairing_recommendation" ADD CONSTRAINT "_guideline_docs_v_blocks_color_pairing_recommendation_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_color_pairing_recommendation_locales" ADD CONSTRAINT "_guideline_docs_v_blocks_color_pairing_recommendation_loc_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_color_pairing_recommendation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_icon_grid" ADD CONSTRAINT "_guideline_docs_v_blocks_icon_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_icon_grid_locales" ADD CONSTRAINT "_guideline_docs_v_blocks_icon_grid_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_icon_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_image_grid_cells" ADD CONSTRAINT "_guideline_docs_v_blocks_image_grid_cells_image_id_application_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_image_grid_cells" ADD CONSTRAINT "_guideline_docs_v_blocks_image_grid_cells_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_image_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_image_grid_cells_locales" ADD CONSTRAINT "_guideline_docs_v_blocks_image_grid_cells_locales_parent__fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_image_grid_cells"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_image_grid" ADD CONSTRAINT "_guideline_docs_v_blocks_image_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_image_grid_locales" ADD CONSTRAINT "_guideline_docs_v_blocks_image_grid_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_image_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_logo_group_viewer_logos" ADD CONSTRAINT "_guideline_docs_v_blocks_logo_group_viewer_logos_logo_id_application_images_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_logo_group_viewer_logos" ADD CONSTRAINT "_guideline_docs_v_blocks_logo_group_viewer_logos_registered_mark_id_application_images_id_fk" FOREIGN KEY ("registered_mark_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_logo_group_viewer_logos" ADD CONSTRAINT "_guideline_docs_v_blocks_logo_group_viewer_logos_clear_space_guide_id_application_images_id_fk" FOREIGN KEY ("clear_space_guide_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_logo_group_viewer_logos" ADD CONSTRAINT "_guideline_docs_v_blocks_logo_group_viewer_logos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_logo_group_viewer"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_logo_group_viewer_logos_locales" ADD CONSTRAINT "_guideline_docs_v_blocks_logo_group_viewer_logos_locales__fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_logo_group_viewer_logos"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_logo_group_viewer_topics" ADD CONSTRAINT "_guideline_docs_v_blocks_logo_group_viewer_topics_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_logo_group_viewer"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_logo_group_viewer_topics_locales" ADD CONSTRAINT "_guideline_docs_v_blocks_logo_group_viewer_topics_locales_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_logo_group_viewer_topics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_logo_group_viewer" ADD CONSTRAINT "_guideline_docs_v_blocks_logo_group_viewer_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_logo_group_viewer_locales" ADD CONSTRAINT "_guideline_docs_v_blocks_logo_group_viewer_locales_parent_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_logo_group_viewer"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_logo_viewer_topics" ADD CONSTRAINT "_guideline_docs_v_blocks_logo_viewer_topics_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_logo_viewer"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_logo_viewer_topics_locales" ADD CONSTRAINT "_guideline_docs_v_blocks_logo_viewer_topics_locales_paren_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_logo_viewer_topics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_logo_viewer" ADD CONSTRAINT "_guideline_docs_v_blocks_logo_viewer_logo_id_application_images_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_logo_viewer" ADD CONSTRAINT "_guideline_docs_v_blocks_logo_viewer_registered_mark_id_application_images_id_fk" FOREIGN KEY ("registered_mark_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_logo_viewer" ADD CONSTRAINT "_guideline_docs_v_blocks_logo_viewer_clear_space_guide_id_application_images_id_fk" FOREIGN KEY ("clear_space_guide_id") REFERENCES "public"."application_images"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_logo_viewer" ADD CONSTRAINT "_guideline_docs_v_blocks_logo_viewer_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_logo_viewer_locales" ADD CONSTRAINT "_guideline_docs_v_blocks_logo_viewer_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_logo_viewer"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_stem_clear_space" ADD CONSTRAINT "_guideline_docs_v_blocks_stem_clear_space_logo_id_brand_logos_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."brand_logos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_stem_clear_space" ADD CONSTRAINT "_guideline_docs_v_blocks_stem_clear_space_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_blocks_stem_clear_space_locales" ADD CONSTRAINT "_guideline_docs_v_blocks_stem_clear_space_locales_parent__fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guideline_docs_v_blocks_stem_clear_space"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "guideline_docs_blocks_carousel_slides_order_idx" ON "guideline_docs_blocks_carousel_slides" USING btree ("_order");
  CREATE INDEX "guideline_docs_blocks_carousel_slides_parent_id_idx" ON "guideline_docs_blocks_carousel_slides" USING btree ("_parent_id");
  CREATE INDEX "guideline_docs_blocks_carousel_slides_image_idx" ON "guideline_docs_blocks_carousel_slides" USING btree ("image_id");
  CREATE UNIQUE INDEX "guideline_docs_blocks_carousel_slides_locales_locale_parent_" ON "guideline_docs_blocks_carousel_slides_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "guideline_docs_blocks_carousel_order_idx" ON "guideline_docs_blocks_carousel" USING btree ("_order");
  CREATE INDEX "guideline_docs_blocks_carousel_parent_id_idx" ON "guideline_docs_blocks_carousel" USING btree ("_parent_id");
  CREATE INDEX "guideline_docs_blocks_carousel_path_idx" ON "guideline_docs_blocks_carousel" USING btree ("_path");
  CREATE INDEX "guideline_docs_blocks_media_showcase_images_order_idx" ON "guideline_docs_blocks_media_showcase_images" USING btree ("_order");
  CREATE INDEX "guideline_docs_blocks_media_showcase_images_parent_id_idx" ON "guideline_docs_blocks_media_showcase_images" USING btree ("_parent_id");
  CREATE INDEX "guideline_docs_blocks_media_showcase_images_image_idx" ON "guideline_docs_blocks_media_showcase_images" USING btree ("image_id");
  CREATE INDEX "guideline_docs_blocks_media_showcase_images_image_backgr_idx" ON "guideline_docs_blocks_media_showcase_images" USING btree ("image_background_color_id");
  CREATE INDEX "guideline_docs_blocks_media_showcase_order_idx" ON "guideline_docs_blocks_media_showcase" USING btree ("_order");
  CREATE INDEX "guideline_docs_blocks_media_showcase_parent_id_idx" ON "guideline_docs_blocks_media_showcase" USING btree ("_parent_id");
  CREATE INDEX "guideline_docs_blocks_media_showcase_path_idx" ON "guideline_docs_blocks_media_showcase" USING btree ("_path");
  CREATE INDEX "guideline_docs_blocks_color_palette_order_idx" ON "guideline_docs_blocks_color_palette" USING btree ("_order");
  CREATE INDEX "guideline_docs_blocks_color_palette_parent_id_idx" ON "guideline_docs_blocks_color_palette" USING btree ("_parent_id");
  CREATE INDEX "guideline_docs_blocks_color_palette_path_idx" ON "guideline_docs_blocks_color_palette" USING btree ("_path");
  CREATE UNIQUE INDEX "guideline_docs_blocks_color_palette_locales_locale_parent_id" ON "guideline_docs_blocks_color_palette_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "guideline_docs_blocks_do_dont_groups_examples_order_idx" ON "guideline_docs_blocks_do_dont_groups_examples" USING btree ("_order");
  CREATE INDEX "guideline_docs_blocks_do_dont_groups_examples_parent_id_idx" ON "guideline_docs_blocks_do_dont_groups_examples" USING btree ("_parent_id");
  CREATE INDEX "guideline_docs_blocks_do_dont_groups_examples_image_idx" ON "guideline_docs_blocks_do_dont_groups_examples" USING btree ("image_id");
  CREATE UNIQUE INDEX "guideline_docs_blocks_do_dont_groups_examples_locales_locale" ON "guideline_docs_blocks_do_dont_groups_examples_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "guideline_docs_blocks_do_dont_groups_order_idx" ON "guideline_docs_blocks_do_dont_groups" USING btree ("_order");
  CREATE INDEX "guideline_docs_blocks_do_dont_groups_parent_id_idx" ON "guideline_docs_blocks_do_dont_groups" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "guideline_docs_blocks_do_dont_groups_locales_locale_parent_i" ON "guideline_docs_blocks_do_dont_groups_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "guideline_docs_blocks_do_dont_order_idx" ON "guideline_docs_blocks_do_dont" USING btree ("_order");
  CREATE INDEX "guideline_docs_blocks_do_dont_parent_id_idx" ON "guideline_docs_blocks_do_dont" USING btree ("_parent_id");
  CREATE INDEX "guideline_docs_blocks_do_dont_path_idx" ON "guideline_docs_blocks_do_dont" USING btree ("_path");
  CREATE UNIQUE INDEX "guideline_docs_blocks_do_dont_locales_locale_parent_id_uniqu" ON "guideline_docs_blocks_do_dont_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "guideline_docs_blocks_spec_list_groups_specs_order_idx" ON "guideline_docs_blocks_spec_list_groups_specs" USING btree ("_order");
  CREATE INDEX "guideline_docs_blocks_spec_list_groups_specs_parent_id_idx" ON "guideline_docs_blocks_spec_list_groups_specs" USING btree ("_parent_id");
  CREATE INDEX "guideline_docs_blocks_spec_list_groups_order_idx" ON "guideline_docs_blocks_spec_list_groups" USING btree ("_order");
  CREATE INDEX "guideline_docs_blocks_spec_list_groups_parent_id_idx" ON "guideline_docs_blocks_spec_list_groups" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "guideline_docs_blocks_spec_list_groups_locales_locale_parent" ON "guideline_docs_blocks_spec_list_groups_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "guideline_docs_blocks_spec_list_order_idx" ON "guideline_docs_blocks_spec_list" USING btree ("_order");
  CREATE INDEX "guideline_docs_blocks_spec_list_parent_id_idx" ON "guideline_docs_blocks_spec_list" USING btree ("_parent_id");
  CREATE INDEX "guideline_docs_blocks_spec_list_path_idx" ON "guideline_docs_blocks_spec_list" USING btree ("_path");
  CREATE INDEX "guideline_docs_blocks_signature_showcase_signatures_order_idx" ON "guideline_docs_blocks_signature_showcase_signatures" USING btree ("_order");
  CREATE INDEX "guideline_docs_blocks_signature_showcase_signatures_parent_id_idx" ON "guideline_docs_blocks_signature_showcase_signatures" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "guideline_docs_blocks_signature_showcase_signatures_locales_" ON "guideline_docs_blocks_signature_showcase_signatures_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "guideline_docs_blocks_signature_showcase_order_idx" ON "guideline_docs_blocks_signature_showcase" USING btree ("_order");
  CREATE INDEX "guideline_docs_blocks_signature_showcase_parent_id_idx" ON "guideline_docs_blocks_signature_showcase" USING btree ("_parent_id");
  CREATE INDEX "guideline_docs_blocks_signature_showcase_path_idx" ON "guideline_docs_blocks_signature_showcase" USING btree ("_path");
  CREATE INDEX "guideline_docs_blocks_type_specimen_order_idx" ON "guideline_docs_blocks_type_specimen" USING btree ("_order");
  CREATE INDEX "guideline_docs_blocks_type_specimen_parent_id_idx" ON "guideline_docs_blocks_type_specimen" USING btree ("_parent_id");
  CREATE INDEX "guideline_docs_blocks_type_specimen_path_idx" ON "guideline_docs_blocks_type_specimen" USING btree ("_path");
  CREATE INDEX "guideline_docs_blocks_type_specimen_typeface_idx" ON "guideline_docs_blocks_type_specimen" USING btree ("typeface_id");
  CREATE UNIQUE INDEX "guideline_docs_blocks_type_specimen_locales_locale_parent_id" ON "guideline_docs_blocks_type_specimen_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "guideline_docs_blocks_type_scale_items_order_idx" ON "guideline_docs_blocks_type_scale_items" USING btree ("_order");
  CREATE INDEX "guideline_docs_blocks_type_scale_items_parent_id_idx" ON "guideline_docs_blocks_type_scale_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "guideline_docs_blocks_type_scale_items_locales_locale_parent" ON "guideline_docs_blocks_type_scale_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "guideline_docs_blocks_type_scale_order_idx" ON "guideline_docs_blocks_type_scale" USING btree ("_order");
  CREATE INDEX "guideline_docs_blocks_type_scale_parent_id_idx" ON "guideline_docs_blocks_type_scale" USING btree ("_parent_id");
  CREATE INDEX "guideline_docs_blocks_type_scale_path_idx" ON "guideline_docs_blocks_type_scale" USING btree ("_path");
  CREATE INDEX "guideline_docs_blocks_type_scale_typeface_idx" ON "guideline_docs_blocks_type_scale" USING btree ("typeface_id");
  CREATE INDEX "guideline_docs_blocks_layout_grid_variants_order_idx" ON "guideline_docs_blocks_layout_grid_variants" USING btree ("_order");
  CREATE INDEX "guideline_docs_blocks_layout_grid_variants_parent_id_idx" ON "guideline_docs_blocks_layout_grid_variants" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "guideline_docs_blocks_layout_grid_variants_locales_locale_pa" ON "guideline_docs_blocks_layout_grid_variants_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "guideline_docs_blocks_layout_grid_order_idx" ON "guideline_docs_blocks_layout_grid" USING btree ("_order");
  CREATE INDEX "guideline_docs_blocks_layout_grid_parent_id_idx" ON "guideline_docs_blocks_layout_grid" USING btree ("_parent_id");
  CREATE INDEX "guideline_docs_blocks_layout_grid_path_idx" ON "guideline_docs_blocks_layout_grid" USING btree ("_path");
  CREATE INDEX "guideline_docs_blocks_layout_grid_accent_idx" ON "guideline_docs_blocks_layout_grid" USING btree ("accent_id");
  CREATE INDEX "guideline_docs_blocks_glyph_grid_order_idx" ON "guideline_docs_blocks_glyph_grid" USING btree ("_order");
  CREATE INDEX "guideline_docs_blocks_glyph_grid_parent_id_idx" ON "guideline_docs_blocks_glyph_grid" USING btree ("_parent_id");
  CREATE INDEX "guideline_docs_blocks_glyph_grid_path_idx" ON "guideline_docs_blocks_glyph_grid" USING btree ("_path");
  CREATE INDEX "guideline_docs_blocks_glyph_grid_typeface_idx" ON "guideline_docs_blocks_glyph_grid" USING btree ("typeface_id");
  CREATE UNIQUE INDEX "guideline_docs_blocks_glyph_grid_locales_locale_parent_id_un" ON "guideline_docs_blocks_glyph_grid_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "cpw_order_idx" ON "cpw" USING btree ("_order");
  CREATE INDEX "cpw_parent_id_idx" ON "cpw" USING btree ("_parent_id");
  CREATE INDEX "cpw_path_idx" ON "cpw" USING btree ("_path");
  CREATE INDEX "car_order_idx" ON "car" USING btree ("_order");
  CREATE INDEX "car_parent_id_idx" ON "car" USING btree ("_parent_id");
  CREATE INDEX "car_path_idx" ON "car" USING btree ("_path");
  CREATE INDEX "cpr_order_idx" ON "cpr" USING btree ("_order");
  CREATE INDEX "cpr_parent_id_idx" ON "cpr" USING btree ("_parent_id");
  CREATE INDEX "cpr_path_idx" ON "cpr" USING btree ("_path");
  CREATE INDEX "cprr_order_idx" ON "cprr" USING btree ("_order");
  CREATE INDEX "cprr_parent_id_idx" ON "cprr" USING btree ("_parent_id");
  CREATE INDEX "cprr_path_idx" ON "cprr" USING btree ("_path");
  CREATE INDEX "cin_order_idx" ON "cin" USING btree ("_order");
  CREATE INDEX "cin_parent_id_idx" ON "cin" USING btree ("_parent_id");
  CREATE INDEX "cin_path_idx" ON "cin" USING btree ("_path");
  CREATE INDEX "cin_logo_idx" ON "cin" USING btree ("logo_id");
  CREATE UNIQUE INDEX "cin_locales_locale_parent_id_unique" ON "cin_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "glw_order_idx" ON "glw" USING btree ("_order");
  CREATE INDEX "glw_parent_id_idx" ON "glw" USING btree ("_parent_id");
  CREATE INDEX "glw_path_idx" ON "glw" USING btree ("_path");
  CREATE INDEX "icw_order_idx" ON "icw" USING btree ("_order");
  CREATE INDEX "icw_parent_id_idx" ON "icw" USING btree ("_parent_id");
  CREATE INDEX "icw_path_idx" ON "icw" USING btree ("_path");
  CREATE INDEX "imw_order_idx" ON "imw" USING btree ("_order");
  CREATE INDEX "imw_parent_id_idx" ON "imw" USING btree ("_parent_id");
  CREATE INDEX "imw_path_idx" ON "imw" USING btree ("_path");
  CREATE INDEX "iug_order_idx" ON "iug" USING btree ("_order");
  CREATE INDEX "iug_parent_id_idx" ON "iug" USING btree ("_parent_id");
  CREATE INDEX "iug_path_idx" ON "iug" USING btree ("_path");
  CREATE INDEX "lgs_order_idx" ON "lgs" USING btree ("_order");
  CREATE INDEX "lgs_parent_id_idx" ON "lgs" USING btree ("_parent_id");
  CREATE INDEX "lgs_path_idx" ON "lgs" USING btree ("_path");
  CREATE UNIQUE INDEX "lgs_locales_locale_parent_id_unique" ON "lgs_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "lgv_order_idx" ON "lgv" USING btree ("_order");
  CREATE INDEX "lgv_parent_id_idx" ON "lgv" USING btree ("_parent_id");
  CREATE INDEX "lgv_path_idx" ON "lgv" USING btree ("_path");
  CREATE INDEX "lvw_order_idx" ON "lvw" USING btree ("_order");
  CREATE INDEX "lvw_parent_id_idx" ON "lvw" USING btree ("_parent_id");
  CREATE INDEX "lvw_path_idx" ON "lvw" USING btree ("_path");
  CREATE INDEX "msw_order_idx" ON "msw" USING btree ("_order");
  CREATE INDEX "msw_parent_id_idx" ON "msw" USING btree ("_parent_id");
  CREATE INDEX "msw_path_idx" ON "msw" USING btree ("_path");
  CREATE INDEX "sdv_order_idx" ON "sdv" USING btree ("_order");
  CREATE INDEX "sdv_parent_id_idx" ON "sdv" USING btree ("_parent_id");
  CREATE INDEX "sdv_path_idx" ON "sdv" USING btree ("_path");
  CREATE UNIQUE INDEX "sdv_locales_locale_parent_id_unique" ON "sdv_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "sla_variants_order_idx" ON "sla_variants" USING btree ("_order");
  CREATE INDEX "sla_variants_parent_id_idx" ON "sla_variants" USING btree ("_parent_id");
  CREATE INDEX "sla_variants_logo_idx" ON "sla_variants" USING btree ("logo_id");
  CREATE UNIQUE INDEX "sla_variants_locales_locale_parent_id_unique" ON "sla_variants_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "sla_apps_order_idx" ON "sla_apps" USING btree ("_order");
  CREATE INDEX "sla_apps_parent_id_idx" ON "sla_apps" USING btree ("_parent_id");
  CREATE INDEX "sla_apps_image_idx" ON "sla_apps" USING btree ("image_id");
  CREATE UNIQUE INDEX "sla_apps_locales_locale_parent_id_unique" ON "sla_apps_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "sla_order_idx" ON "sla" USING btree ("_order");
  CREATE INDEX "sla_parent_id_idx" ON "sla" USING btree ("_parent_id");
  CREATE INDEX "sla_path_idx" ON "sla" USING btree ("_path");
  CREATE INDEX "scs_order_idx" ON "scs" USING btree ("_order");
  CREATE INDEX "scs_parent_id_idx" ON "scs" USING btree ("_parent_id");
  CREATE INDEX "scs_path_idx" ON "scs" USING btree ("_path");
  CREATE INDEX "tsc_order_idx" ON "tsc" USING btree ("_order");
  CREATE INDEX "tsc_parent_id_idx" ON "tsc" USING btree ("_parent_id");
  CREATE INDEX "tsc_path_idx" ON "tsc" USING btree ("_path");
  CREATE INDEX "guideline_docs_blocks_color_pairing_order_idx" ON "guideline_docs_blocks_color_pairing" USING btree ("_order");
  CREATE INDEX "guideline_docs_blocks_color_pairing_parent_id_idx" ON "guideline_docs_blocks_color_pairing" USING btree ("_parent_id");
  CREATE INDEX "guideline_docs_blocks_color_pairing_path_idx" ON "guideline_docs_blocks_color_pairing" USING btree ("_path");
  CREATE UNIQUE INDEX "guideline_docs_blocks_color_pairing_locales_locale_parent_id" ON "guideline_docs_blocks_color_pairing_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "guideline_docs_blocks_color_pairing_recommendation_order_idx" ON "guideline_docs_blocks_color_pairing_recommendation" USING btree ("_order");
  CREATE INDEX "guideline_docs_blocks_color_pairing_recommendation_parent_id_idx" ON "guideline_docs_blocks_color_pairing_recommendation" USING btree ("_parent_id");
  CREATE INDEX "guideline_docs_blocks_color_pairing_recommendation_path_idx" ON "guideline_docs_blocks_color_pairing_recommendation" USING btree ("_path");
  CREATE UNIQUE INDEX "guideline_docs_blocks_color_pairing_recommendation_locales_l" ON "guideline_docs_blocks_color_pairing_recommendation_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "guideline_docs_blocks_icon_grid_order_idx" ON "guideline_docs_blocks_icon_grid" USING btree ("_order");
  CREATE INDEX "guideline_docs_blocks_icon_grid_parent_id_idx" ON "guideline_docs_blocks_icon_grid" USING btree ("_parent_id");
  CREATE INDEX "guideline_docs_blocks_icon_grid_path_idx" ON "guideline_docs_blocks_icon_grid" USING btree ("_path");
  CREATE UNIQUE INDEX "guideline_docs_blocks_icon_grid_locales_locale_parent_id_uni" ON "guideline_docs_blocks_icon_grid_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "guideline_docs_blocks_image_grid_cells_order_idx" ON "guideline_docs_blocks_image_grid_cells" USING btree ("_order");
  CREATE INDEX "guideline_docs_blocks_image_grid_cells_parent_id_idx" ON "guideline_docs_blocks_image_grid_cells" USING btree ("_parent_id");
  CREATE INDEX "guideline_docs_blocks_image_grid_cells_image_idx" ON "guideline_docs_blocks_image_grid_cells" USING btree ("image_id");
  CREATE UNIQUE INDEX "guideline_docs_blocks_image_grid_cells_locales_locale_parent" ON "guideline_docs_blocks_image_grid_cells_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "guideline_docs_blocks_image_grid_order_idx" ON "guideline_docs_blocks_image_grid" USING btree ("_order");
  CREATE INDEX "guideline_docs_blocks_image_grid_parent_id_idx" ON "guideline_docs_blocks_image_grid" USING btree ("_parent_id");
  CREATE INDEX "guideline_docs_blocks_image_grid_path_idx" ON "guideline_docs_blocks_image_grid" USING btree ("_path");
  CREATE UNIQUE INDEX "guideline_docs_blocks_image_grid_locales_locale_parent_id_un" ON "guideline_docs_blocks_image_grid_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "guideline_docs_blocks_logo_group_viewer_logos_order_idx" ON "guideline_docs_blocks_logo_group_viewer_logos" USING btree ("_order");
  CREATE INDEX "guideline_docs_blocks_logo_group_viewer_logos_parent_id_idx" ON "guideline_docs_blocks_logo_group_viewer_logos" USING btree ("_parent_id");
  CREATE INDEX "guideline_docs_blocks_logo_group_viewer_logos_logo_idx" ON "guideline_docs_blocks_logo_group_viewer_logos" USING btree ("logo_id");
  CREATE INDEX "guideline_docs_blocks_logo_group_viewer_logos_registered_idx" ON "guideline_docs_blocks_logo_group_viewer_logos" USING btree ("registered_mark_id");
  CREATE INDEX "guideline_docs_blocks_logo_group_viewer_logos_clear_spac_idx" ON "guideline_docs_blocks_logo_group_viewer_logos" USING btree ("clear_space_guide_id");
  CREATE UNIQUE INDEX "guideline_docs_blocks_logo_group_viewer_logos_locales_locale" ON "guideline_docs_blocks_logo_group_viewer_logos_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "guideline_docs_blocks_logo_group_viewer_topics_order_idx" ON "guideline_docs_blocks_logo_group_viewer_topics" USING btree ("_order");
  CREATE INDEX "guideline_docs_blocks_logo_group_viewer_topics_parent_id_idx" ON "guideline_docs_blocks_logo_group_viewer_topics" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "guideline_docs_blocks_logo_group_viewer_topics_locales_local" ON "guideline_docs_blocks_logo_group_viewer_topics_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "guideline_docs_blocks_logo_group_viewer_order_idx" ON "guideline_docs_blocks_logo_group_viewer" USING btree ("_order");
  CREATE INDEX "guideline_docs_blocks_logo_group_viewer_parent_id_idx" ON "guideline_docs_blocks_logo_group_viewer" USING btree ("_parent_id");
  CREATE INDEX "guideline_docs_blocks_logo_group_viewer_path_idx" ON "guideline_docs_blocks_logo_group_viewer" USING btree ("_path");
  CREATE UNIQUE INDEX "guideline_docs_blocks_logo_group_viewer_locales_locale_paren" ON "guideline_docs_blocks_logo_group_viewer_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "guideline_docs_blocks_logo_viewer_topics_order_idx" ON "guideline_docs_blocks_logo_viewer_topics" USING btree ("_order");
  CREATE INDEX "guideline_docs_blocks_logo_viewer_topics_parent_id_idx" ON "guideline_docs_blocks_logo_viewer_topics" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "guideline_docs_blocks_logo_viewer_topics_locales_locale_pare" ON "guideline_docs_blocks_logo_viewer_topics_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "guideline_docs_blocks_logo_viewer_order_idx" ON "guideline_docs_blocks_logo_viewer" USING btree ("_order");
  CREATE INDEX "guideline_docs_blocks_logo_viewer_parent_id_idx" ON "guideline_docs_blocks_logo_viewer" USING btree ("_parent_id");
  CREATE INDEX "guideline_docs_blocks_logo_viewer_path_idx" ON "guideline_docs_blocks_logo_viewer" USING btree ("_path");
  CREATE INDEX "guideline_docs_blocks_logo_viewer_logo_idx" ON "guideline_docs_blocks_logo_viewer" USING btree ("logo_id");
  CREATE INDEX "guideline_docs_blocks_logo_viewer_registered_mark_idx" ON "guideline_docs_blocks_logo_viewer" USING btree ("registered_mark_id");
  CREATE INDEX "guideline_docs_blocks_logo_viewer_clear_space_guide_idx" ON "guideline_docs_blocks_logo_viewer" USING btree ("clear_space_guide_id");
  CREATE UNIQUE INDEX "guideline_docs_blocks_logo_viewer_locales_locale_parent_id_u" ON "guideline_docs_blocks_logo_viewer_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "guideline_docs_blocks_stem_clear_space_order_idx" ON "guideline_docs_blocks_stem_clear_space" USING btree ("_order");
  CREATE INDEX "guideline_docs_blocks_stem_clear_space_parent_id_idx" ON "guideline_docs_blocks_stem_clear_space" USING btree ("_parent_id");
  CREATE INDEX "guideline_docs_blocks_stem_clear_space_path_idx" ON "guideline_docs_blocks_stem_clear_space" USING btree ("_path");
  CREATE INDEX "guideline_docs_blocks_stem_clear_space_logo_idx" ON "guideline_docs_blocks_stem_clear_space" USING btree ("logo_id");
  CREATE UNIQUE INDEX "guideline_docs_blocks_stem_clear_space_locales_locale_parent" ON "guideline_docs_blocks_stem_clear_space_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_carousel_slides_order_idx" ON "_guideline_docs_v_blocks_carousel_slides" USING btree ("_order");
  CREATE INDEX "_guideline_docs_v_blocks_carousel_slides_parent_id_idx" ON "_guideline_docs_v_blocks_carousel_slides" USING btree ("_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_carousel_slides_image_idx" ON "_guideline_docs_v_blocks_carousel_slides" USING btree ("image_id");
  CREATE UNIQUE INDEX "_guideline_docs_v_blocks_carousel_slides_locales_locale_pare" ON "_guideline_docs_v_blocks_carousel_slides_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_carousel_order_idx" ON "_guideline_docs_v_blocks_carousel" USING btree ("_order");
  CREATE INDEX "_guideline_docs_v_blocks_carousel_parent_id_idx" ON "_guideline_docs_v_blocks_carousel" USING btree ("_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_carousel_path_idx" ON "_guideline_docs_v_blocks_carousel" USING btree ("_path");
  CREATE INDEX "_guideline_docs_v_blocks_media_showcase_images_order_idx" ON "_guideline_docs_v_blocks_media_showcase_images" USING btree ("_order");
  CREATE INDEX "_guideline_docs_v_blocks_media_showcase_images_parent_id_idx" ON "_guideline_docs_v_blocks_media_showcase_images" USING btree ("_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_media_showcase_images_image_idx" ON "_guideline_docs_v_blocks_media_showcase_images" USING btree ("image_id");
  CREATE INDEX "_guideline_docs_v_blocks_media_showcase_images_image_bac_idx" ON "_guideline_docs_v_blocks_media_showcase_images" USING btree ("image_background_color_id");
  CREATE INDEX "_guideline_docs_v_blocks_media_showcase_order_idx" ON "_guideline_docs_v_blocks_media_showcase" USING btree ("_order");
  CREATE INDEX "_guideline_docs_v_blocks_media_showcase_parent_id_idx" ON "_guideline_docs_v_blocks_media_showcase" USING btree ("_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_media_showcase_path_idx" ON "_guideline_docs_v_blocks_media_showcase" USING btree ("_path");
  CREATE INDEX "_guideline_docs_v_blocks_color_palette_order_idx" ON "_guideline_docs_v_blocks_color_palette" USING btree ("_order");
  CREATE INDEX "_guideline_docs_v_blocks_color_palette_parent_id_idx" ON "_guideline_docs_v_blocks_color_palette" USING btree ("_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_color_palette_path_idx" ON "_guideline_docs_v_blocks_color_palette" USING btree ("_path");
  CREATE UNIQUE INDEX "_guideline_docs_v_blocks_color_palette_locales_locale_parent" ON "_guideline_docs_v_blocks_color_palette_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_do_dont_groups_examples_order_idx" ON "_guideline_docs_v_blocks_do_dont_groups_examples" USING btree ("_order");
  CREATE INDEX "_guideline_docs_v_blocks_do_dont_groups_examples_parent_id_idx" ON "_guideline_docs_v_blocks_do_dont_groups_examples" USING btree ("_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_do_dont_groups_examples_image_idx" ON "_guideline_docs_v_blocks_do_dont_groups_examples" USING btree ("image_id");
  CREATE UNIQUE INDEX "_guideline_docs_v_blocks_do_dont_groups_examples_locales_loc" ON "_guideline_docs_v_blocks_do_dont_groups_examples_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_do_dont_groups_order_idx" ON "_guideline_docs_v_blocks_do_dont_groups" USING btree ("_order");
  CREATE INDEX "_guideline_docs_v_blocks_do_dont_groups_parent_id_idx" ON "_guideline_docs_v_blocks_do_dont_groups" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_guideline_docs_v_blocks_do_dont_groups_locales_locale_paren" ON "_guideline_docs_v_blocks_do_dont_groups_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_do_dont_order_idx" ON "_guideline_docs_v_blocks_do_dont" USING btree ("_order");
  CREATE INDEX "_guideline_docs_v_blocks_do_dont_parent_id_idx" ON "_guideline_docs_v_blocks_do_dont" USING btree ("_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_do_dont_path_idx" ON "_guideline_docs_v_blocks_do_dont" USING btree ("_path");
  CREATE UNIQUE INDEX "_guideline_docs_v_blocks_do_dont_locales_locale_parent_id_un" ON "_guideline_docs_v_blocks_do_dont_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_spec_list_groups_specs_order_idx" ON "_guideline_docs_v_blocks_spec_list_groups_specs" USING btree ("_order");
  CREATE INDEX "_guideline_docs_v_blocks_spec_list_groups_specs_parent_id_idx" ON "_guideline_docs_v_blocks_spec_list_groups_specs" USING btree ("_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_spec_list_groups_order_idx" ON "_guideline_docs_v_blocks_spec_list_groups" USING btree ("_order");
  CREATE INDEX "_guideline_docs_v_blocks_spec_list_groups_parent_id_idx" ON "_guideline_docs_v_blocks_spec_list_groups" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_guideline_docs_v_blocks_spec_list_groups_locales_locale_par" ON "_guideline_docs_v_blocks_spec_list_groups_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_spec_list_order_idx" ON "_guideline_docs_v_blocks_spec_list" USING btree ("_order");
  CREATE INDEX "_guideline_docs_v_blocks_spec_list_parent_id_idx" ON "_guideline_docs_v_blocks_spec_list" USING btree ("_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_spec_list_path_idx" ON "_guideline_docs_v_blocks_spec_list" USING btree ("_path");
  CREATE INDEX "_guideline_docs_v_blocks_signature_showcase_signatures_order_idx" ON "_guideline_docs_v_blocks_signature_showcase_signatures" USING btree ("_order");
  CREATE INDEX "_guideline_docs_v_blocks_signature_showcase_signatures_parent_id_idx" ON "_guideline_docs_v_blocks_signature_showcase_signatures" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_guideline_docs_v_blocks_signature_showcase_signatures_local" ON "_guideline_docs_v_blocks_signature_showcase_signatures_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_signature_showcase_order_idx" ON "_guideline_docs_v_blocks_signature_showcase" USING btree ("_order");
  CREATE INDEX "_guideline_docs_v_blocks_signature_showcase_parent_id_idx" ON "_guideline_docs_v_blocks_signature_showcase" USING btree ("_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_signature_showcase_path_idx" ON "_guideline_docs_v_blocks_signature_showcase" USING btree ("_path");
  CREATE INDEX "_guideline_docs_v_blocks_type_specimen_order_idx" ON "_guideline_docs_v_blocks_type_specimen" USING btree ("_order");
  CREATE INDEX "_guideline_docs_v_blocks_type_specimen_parent_id_idx" ON "_guideline_docs_v_blocks_type_specimen" USING btree ("_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_type_specimen_path_idx" ON "_guideline_docs_v_blocks_type_specimen" USING btree ("_path");
  CREATE INDEX "_guideline_docs_v_blocks_type_specimen_typeface_idx" ON "_guideline_docs_v_blocks_type_specimen" USING btree ("typeface_id");
  CREATE UNIQUE INDEX "_guideline_docs_v_blocks_type_specimen_locales_locale_parent" ON "_guideline_docs_v_blocks_type_specimen_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_type_scale_items_order_idx" ON "_guideline_docs_v_blocks_type_scale_items" USING btree ("_order");
  CREATE INDEX "_guideline_docs_v_blocks_type_scale_items_parent_id_idx" ON "_guideline_docs_v_blocks_type_scale_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_guideline_docs_v_blocks_type_scale_items_locales_locale_par" ON "_guideline_docs_v_blocks_type_scale_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_type_scale_order_idx" ON "_guideline_docs_v_blocks_type_scale" USING btree ("_order");
  CREATE INDEX "_guideline_docs_v_blocks_type_scale_parent_id_idx" ON "_guideline_docs_v_blocks_type_scale" USING btree ("_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_type_scale_path_idx" ON "_guideline_docs_v_blocks_type_scale" USING btree ("_path");
  CREATE INDEX "_guideline_docs_v_blocks_type_scale_typeface_idx" ON "_guideline_docs_v_blocks_type_scale" USING btree ("typeface_id");
  CREATE INDEX "_guideline_docs_v_blocks_layout_grid_variants_order_idx" ON "_guideline_docs_v_blocks_layout_grid_variants" USING btree ("_order");
  CREATE INDEX "_guideline_docs_v_blocks_layout_grid_variants_parent_id_idx" ON "_guideline_docs_v_blocks_layout_grid_variants" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_guideline_docs_v_blocks_layout_grid_variants_locales_locale" ON "_guideline_docs_v_blocks_layout_grid_variants_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_layout_grid_order_idx" ON "_guideline_docs_v_blocks_layout_grid" USING btree ("_order");
  CREATE INDEX "_guideline_docs_v_blocks_layout_grid_parent_id_idx" ON "_guideline_docs_v_blocks_layout_grid" USING btree ("_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_layout_grid_path_idx" ON "_guideline_docs_v_blocks_layout_grid" USING btree ("_path");
  CREATE INDEX "_guideline_docs_v_blocks_layout_grid_accent_idx" ON "_guideline_docs_v_blocks_layout_grid" USING btree ("accent_id");
  CREATE INDEX "_guideline_docs_v_blocks_glyph_grid_order_idx" ON "_guideline_docs_v_blocks_glyph_grid" USING btree ("_order");
  CREATE INDEX "_guideline_docs_v_blocks_glyph_grid_parent_id_idx" ON "_guideline_docs_v_blocks_glyph_grid" USING btree ("_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_glyph_grid_path_idx" ON "_guideline_docs_v_blocks_glyph_grid" USING btree ("_path");
  CREATE INDEX "_guideline_docs_v_blocks_glyph_grid_typeface_idx" ON "_guideline_docs_v_blocks_glyph_grid" USING btree ("typeface_id");
  CREATE UNIQUE INDEX "_guideline_docs_v_blocks_glyph_grid_locales_locale_parent_id" ON "_guideline_docs_v_blocks_glyph_grid_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_cpw_v_order_idx" ON "_cpw_v" USING btree ("_order");
  CREATE INDEX "_cpw_v_parent_id_idx" ON "_cpw_v" USING btree ("_parent_id");
  CREATE INDEX "_cpw_v_path_idx" ON "_cpw_v" USING btree ("_path");
  CREATE INDEX "_car_v_order_idx" ON "_car_v" USING btree ("_order");
  CREATE INDEX "_car_v_parent_id_idx" ON "_car_v" USING btree ("_parent_id");
  CREATE INDEX "_car_v_path_idx" ON "_car_v" USING btree ("_path");
  CREATE INDEX "_cpr_v_order_idx" ON "_cpr_v" USING btree ("_order");
  CREATE INDEX "_cpr_v_parent_id_idx" ON "_cpr_v" USING btree ("_parent_id");
  CREATE INDEX "_cpr_v_path_idx" ON "_cpr_v" USING btree ("_path");
  CREATE INDEX "_cprr_v_order_idx" ON "_cprr_v" USING btree ("_order");
  CREATE INDEX "_cprr_v_parent_id_idx" ON "_cprr_v" USING btree ("_parent_id");
  CREATE INDEX "_cprr_v_path_idx" ON "_cprr_v" USING btree ("_path");
  CREATE INDEX "_cin_v_order_idx" ON "_cin_v" USING btree ("_order");
  CREATE INDEX "_cin_v_parent_id_idx" ON "_cin_v" USING btree ("_parent_id");
  CREATE INDEX "_cin_v_path_idx" ON "_cin_v" USING btree ("_path");
  CREATE INDEX "_cin_v_logo_idx" ON "_cin_v" USING btree ("logo_id");
  CREATE UNIQUE INDEX "_cin_v_locales_locale_parent_id_unique" ON "_cin_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_glw_v_order_idx" ON "_glw_v" USING btree ("_order");
  CREATE INDEX "_glw_v_parent_id_idx" ON "_glw_v" USING btree ("_parent_id");
  CREATE INDEX "_glw_v_path_idx" ON "_glw_v" USING btree ("_path");
  CREATE INDEX "_icw_v_order_idx" ON "_icw_v" USING btree ("_order");
  CREATE INDEX "_icw_v_parent_id_idx" ON "_icw_v" USING btree ("_parent_id");
  CREATE INDEX "_icw_v_path_idx" ON "_icw_v" USING btree ("_path");
  CREATE INDEX "_imw_v_order_idx" ON "_imw_v" USING btree ("_order");
  CREATE INDEX "_imw_v_parent_id_idx" ON "_imw_v" USING btree ("_parent_id");
  CREATE INDEX "_imw_v_path_idx" ON "_imw_v" USING btree ("_path");
  CREATE INDEX "_iug_v_order_idx" ON "_iug_v" USING btree ("_order");
  CREATE INDEX "_iug_v_parent_id_idx" ON "_iug_v" USING btree ("_parent_id");
  CREATE INDEX "_iug_v_path_idx" ON "_iug_v" USING btree ("_path");
  CREATE INDEX "_lgs_v_order_idx" ON "_lgs_v" USING btree ("_order");
  CREATE INDEX "_lgs_v_parent_id_idx" ON "_lgs_v" USING btree ("_parent_id");
  CREATE INDEX "_lgs_v_path_idx" ON "_lgs_v" USING btree ("_path");
  CREATE UNIQUE INDEX "_lgs_v_locales_locale_parent_id_unique" ON "_lgs_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_lgv_v_order_idx" ON "_lgv_v" USING btree ("_order");
  CREATE INDEX "_lgv_v_parent_id_idx" ON "_lgv_v" USING btree ("_parent_id");
  CREATE INDEX "_lgv_v_path_idx" ON "_lgv_v" USING btree ("_path");
  CREATE INDEX "_lvw_v_order_idx" ON "_lvw_v" USING btree ("_order");
  CREATE INDEX "_lvw_v_parent_id_idx" ON "_lvw_v" USING btree ("_parent_id");
  CREATE INDEX "_lvw_v_path_idx" ON "_lvw_v" USING btree ("_path");
  CREATE INDEX "_msw_v_order_idx" ON "_msw_v" USING btree ("_order");
  CREATE INDEX "_msw_v_parent_id_idx" ON "_msw_v" USING btree ("_parent_id");
  CREATE INDEX "_msw_v_path_idx" ON "_msw_v" USING btree ("_path");
  CREATE INDEX "_sdv_v_order_idx" ON "_sdv_v" USING btree ("_order");
  CREATE INDEX "_sdv_v_parent_id_idx" ON "_sdv_v" USING btree ("_parent_id");
  CREATE INDEX "_sdv_v_path_idx" ON "_sdv_v" USING btree ("_path");
  CREATE UNIQUE INDEX "_sdv_v_locales_locale_parent_id_unique" ON "_sdv_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_sla_v_variants_order_idx" ON "_sla_v_variants" USING btree ("_order");
  CREATE INDEX "_sla_v_variants_parent_id_idx" ON "_sla_v_variants" USING btree ("_parent_id");
  CREATE INDEX "_sla_v_variants_logo_idx" ON "_sla_v_variants" USING btree ("logo_id");
  CREATE UNIQUE INDEX "_sla_v_variants_locales_locale_parent_id_unique" ON "_sla_v_variants_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_sla_v_apps_order_idx" ON "_sla_v_apps" USING btree ("_order");
  CREATE INDEX "_sla_v_apps_parent_id_idx" ON "_sla_v_apps" USING btree ("_parent_id");
  CREATE INDEX "_sla_v_apps_image_idx" ON "_sla_v_apps" USING btree ("image_id");
  CREATE UNIQUE INDEX "_sla_v_apps_locales_locale_parent_id_unique" ON "_sla_v_apps_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_sla_v_order_idx" ON "_sla_v" USING btree ("_order");
  CREATE INDEX "_sla_v_parent_id_idx" ON "_sla_v" USING btree ("_parent_id");
  CREATE INDEX "_sla_v_path_idx" ON "_sla_v" USING btree ("_path");
  CREATE INDEX "_scs_v_order_idx" ON "_scs_v" USING btree ("_order");
  CREATE INDEX "_scs_v_parent_id_idx" ON "_scs_v" USING btree ("_parent_id");
  CREATE INDEX "_scs_v_path_idx" ON "_scs_v" USING btree ("_path");
  CREATE INDEX "_tsc_v_order_idx" ON "_tsc_v" USING btree ("_order");
  CREATE INDEX "_tsc_v_parent_id_idx" ON "_tsc_v" USING btree ("_parent_id");
  CREATE INDEX "_tsc_v_path_idx" ON "_tsc_v" USING btree ("_path");
  CREATE INDEX "_guideline_docs_v_blocks_color_pairing_order_idx" ON "_guideline_docs_v_blocks_color_pairing" USING btree ("_order");
  CREATE INDEX "_guideline_docs_v_blocks_color_pairing_parent_id_idx" ON "_guideline_docs_v_blocks_color_pairing" USING btree ("_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_color_pairing_path_idx" ON "_guideline_docs_v_blocks_color_pairing" USING btree ("_path");
  CREATE UNIQUE INDEX "_guideline_docs_v_blocks_color_pairing_locales_locale_parent" ON "_guideline_docs_v_blocks_color_pairing_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_color_pairing_recommendation_order_idx" ON "_guideline_docs_v_blocks_color_pairing_recommendation" USING btree ("_order");
  CREATE INDEX "_guideline_docs_v_blocks_color_pairing_recommendation_parent_id_idx" ON "_guideline_docs_v_blocks_color_pairing_recommendation" USING btree ("_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_color_pairing_recommendation_path_idx" ON "_guideline_docs_v_blocks_color_pairing_recommendation" USING btree ("_path");
  CREATE UNIQUE INDEX "_guideline_docs_v_blocks_color_pairing_recommendation_locale" ON "_guideline_docs_v_blocks_color_pairing_recommendation_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_icon_grid_order_idx" ON "_guideline_docs_v_blocks_icon_grid" USING btree ("_order");
  CREATE INDEX "_guideline_docs_v_blocks_icon_grid_parent_id_idx" ON "_guideline_docs_v_blocks_icon_grid" USING btree ("_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_icon_grid_path_idx" ON "_guideline_docs_v_blocks_icon_grid" USING btree ("_path");
  CREATE UNIQUE INDEX "_guideline_docs_v_blocks_icon_grid_locales_locale_parent_id_" ON "_guideline_docs_v_blocks_icon_grid_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_image_grid_cells_order_idx" ON "_guideline_docs_v_blocks_image_grid_cells" USING btree ("_order");
  CREATE INDEX "_guideline_docs_v_blocks_image_grid_cells_parent_id_idx" ON "_guideline_docs_v_blocks_image_grid_cells" USING btree ("_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_image_grid_cells_image_idx" ON "_guideline_docs_v_blocks_image_grid_cells" USING btree ("image_id");
  CREATE UNIQUE INDEX "_guideline_docs_v_blocks_image_grid_cells_locales_locale_par" ON "_guideline_docs_v_blocks_image_grid_cells_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_image_grid_order_idx" ON "_guideline_docs_v_blocks_image_grid" USING btree ("_order");
  CREATE INDEX "_guideline_docs_v_blocks_image_grid_parent_id_idx" ON "_guideline_docs_v_blocks_image_grid" USING btree ("_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_image_grid_path_idx" ON "_guideline_docs_v_blocks_image_grid" USING btree ("_path");
  CREATE UNIQUE INDEX "_guideline_docs_v_blocks_image_grid_locales_locale_parent_id" ON "_guideline_docs_v_blocks_image_grid_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_logo_group_viewer_logos_order_idx" ON "_guideline_docs_v_blocks_logo_group_viewer_logos" USING btree ("_order");
  CREATE INDEX "_guideline_docs_v_blocks_logo_group_viewer_logos_parent_id_idx" ON "_guideline_docs_v_blocks_logo_group_viewer_logos" USING btree ("_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_logo_group_viewer_logos_logo_idx" ON "_guideline_docs_v_blocks_logo_group_viewer_logos" USING btree ("logo_id");
  CREATE INDEX "_guideline_docs_v_blocks_logo_group_viewer_logos_registe_idx" ON "_guideline_docs_v_blocks_logo_group_viewer_logos" USING btree ("registered_mark_id");
  CREATE INDEX "_guideline_docs_v_blocks_logo_group_viewer_logos_clear_s_idx" ON "_guideline_docs_v_blocks_logo_group_viewer_logos" USING btree ("clear_space_guide_id");
  CREATE UNIQUE INDEX "_guideline_docs_v_blocks_logo_group_viewer_logos_locales_loc" ON "_guideline_docs_v_blocks_logo_group_viewer_logos_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_logo_group_viewer_topics_order_idx" ON "_guideline_docs_v_blocks_logo_group_viewer_topics" USING btree ("_order");
  CREATE INDEX "_guideline_docs_v_blocks_logo_group_viewer_topics_parent_id_idx" ON "_guideline_docs_v_blocks_logo_group_viewer_topics" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_guideline_docs_v_blocks_logo_group_viewer_topics_locales_lo" ON "_guideline_docs_v_blocks_logo_group_viewer_topics_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_logo_group_viewer_order_idx" ON "_guideline_docs_v_blocks_logo_group_viewer" USING btree ("_order");
  CREATE INDEX "_guideline_docs_v_blocks_logo_group_viewer_parent_id_idx" ON "_guideline_docs_v_blocks_logo_group_viewer" USING btree ("_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_logo_group_viewer_path_idx" ON "_guideline_docs_v_blocks_logo_group_viewer" USING btree ("_path");
  CREATE UNIQUE INDEX "_guideline_docs_v_blocks_logo_group_viewer_locales_locale_pa" ON "_guideline_docs_v_blocks_logo_group_viewer_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_logo_viewer_topics_order_idx" ON "_guideline_docs_v_blocks_logo_viewer_topics" USING btree ("_order");
  CREATE INDEX "_guideline_docs_v_blocks_logo_viewer_topics_parent_id_idx" ON "_guideline_docs_v_blocks_logo_viewer_topics" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_guideline_docs_v_blocks_logo_viewer_topics_locales_locale_p" ON "_guideline_docs_v_blocks_logo_viewer_topics_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_logo_viewer_order_idx" ON "_guideline_docs_v_blocks_logo_viewer" USING btree ("_order");
  CREATE INDEX "_guideline_docs_v_blocks_logo_viewer_parent_id_idx" ON "_guideline_docs_v_blocks_logo_viewer" USING btree ("_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_logo_viewer_path_idx" ON "_guideline_docs_v_blocks_logo_viewer" USING btree ("_path");
  CREATE INDEX "_guideline_docs_v_blocks_logo_viewer_logo_idx" ON "_guideline_docs_v_blocks_logo_viewer" USING btree ("logo_id");
  CREATE INDEX "_guideline_docs_v_blocks_logo_viewer_registered_mark_idx" ON "_guideline_docs_v_blocks_logo_viewer" USING btree ("registered_mark_id");
  CREATE INDEX "_guideline_docs_v_blocks_logo_viewer_clear_space_guide_idx" ON "_guideline_docs_v_blocks_logo_viewer" USING btree ("clear_space_guide_id");
  CREATE UNIQUE INDEX "_guideline_docs_v_blocks_logo_viewer_locales_locale_parent_i" ON "_guideline_docs_v_blocks_logo_viewer_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_stem_clear_space_order_idx" ON "_guideline_docs_v_blocks_stem_clear_space" USING btree ("_order");
  CREATE INDEX "_guideline_docs_v_blocks_stem_clear_space_parent_id_idx" ON "_guideline_docs_v_blocks_stem_clear_space" USING btree ("_parent_id");
  CREATE INDEX "_guideline_docs_v_blocks_stem_clear_space_path_idx" ON "_guideline_docs_v_blocks_stem_clear_space" USING btree ("_path");
  CREATE INDEX "_guideline_docs_v_blocks_stem_clear_space_logo_idx" ON "_guideline_docs_v_blocks_stem_clear_space" USING btree ("logo_id");
  CREATE UNIQUE INDEX "_guideline_docs_v_blocks_stem_clear_space_locales_locale_par" ON "_guideline_docs_v_blocks_stem_clear_space_locales" USING btree ("_locale","_parent_id");
  ALTER TABLE "guideline_docs_rels" ADD CONSTRAINT "guideline_docs_rels_brand_colors_fk" FOREIGN KEY ("brand_colors_id") REFERENCES "public"."brand_colors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_docs_v_rels" ADD CONSTRAINT "_guideline_docs_v_rels_brand_colors_fk" FOREIGN KEY ("brand_colors_id") REFERENCES "public"."brand_colors"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "guideline_docs_rels_brand_colors_id_idx" ON "guideline_docs_rels" USING btree ("brand_colors_id");
  CREATE INDEX "_guideline_docs_v_rels_brand_colors_id_idx" ON "_guideline_docs_v_rels" USING btree ("brand_colors_id");`)
}
