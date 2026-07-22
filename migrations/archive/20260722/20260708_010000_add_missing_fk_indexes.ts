import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Supabase performance advisor의 unindexed foreign keys 경고를 해소한다.
 * locale/version child tables는 parent 삭제·수정 시 FK 검증용 _parent_id 인덱스가 필요하다.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
	await db.execute(sql`
		CREATE INDEX IF NOT EXISTS _application_images_v_locales__parent_id_fk_idx ON public._application_images_v_locales (_parent_id);
		CREATE INDEX IF NOT EXISTS _brand_colors_v_locales__parent_id_fk_idx ON public._brand_colors_v_locales (_parent_id);
		CREATE INDEX IF NOT EXISTS _brand_logos_v_locales__parent_id_fk_idx ON public._brand_logos_v_locales (_parent_id);
		CREATE INDEX IF NOT EXISTS _brand_typefaces_v_locales__parent_id_fk_idx ON public._brand_typefaces_v_locales (_parent_id);
		CREATE INDEX IF NOT EXISTS _guideline_pages_v_blocks_color_palette_locales__parent_id_fk_i ON public._guideline_pages_v_blocks_color_palette_locales (_parent_id);
		CREATE INDEX IF NOT EXISTS _guideline_pages_v_blocks_column_unit_columns_locales__parent_i ON public._guideline_pages_v_blocks_column_unit_columns_locales (_parent_id);
		CREATE INDEX IF NOT EXISTS _guideline_pages_v_blocks_column_unit_locales__parent_id_fk_idx ON public._guideline_pages_v_blocks_column_unit_locales (_parent_id);
		CREATE INDEX IF NOT EXISTS _guideline_pages_v_locales__parent_id_fk_idx ON public._guideline_pages_v_locales (_parent_id);
		CREATE INDEX IF NOT EXISTS _guideline_sections_v_locales__parent_id_fk_idx ON public._guideline_sections_v_locales (_parent_id);
		CREATE INDEX IF NOT EXISTS _guideline_v_locales__parent_id_fk_idx ON public._guideline_v_locales (_parent_id);
		CREATE INDEX IF NOT EXISTS _plugins_v_locales__parent_id_fk_idx ON public._plugins_v_locales (_parent_id);
		CREATE INDEX IF NOT EXISTS _templates_v_locales__parent_id_fk_idx ON public._templates_v_locales (_parent_id);
		CREATE INDEX IF NOT EXISTS _templates_v_version_template_rules_locales__parent_id_fk_idx ON public._templates_v_version_template_rules_locales (_parent_id);
		CREATE INDEX IF NOT EXISTS application_images_locales__parent_id_fk_idx ON public.application_images_locales (_parent_id);
		CREATE INDEX IF NOT EXISTS brand_colors_locales__parent_id_fk_idx ON public.brand_colors_locales (_parent_id);
		CREATE INDEX IF NOT EXISTS brand_logos_locales__parent_id_fk_idx ON public.brand_logos_locales (_parent_id);
		CREATE INDEX IF NOT EXISTS brand_typefaces_locales__parent_id_fk_idx ON public.brand_typefaces_locales (_parent_id);
		CREATE INDEX IF NOT EXISTS guideline_locales__parent_id_fk_idx ON public.guideline_locales (_parent_id);
		CREATE INDEX IF NOT EXISTS guideline_pages_blocks_color_palette_locales__parent_id_fk_idx ON public.guideline_pages_blocks_color_palette_locales (_parent_id);
		CREATE INDEX IF NOT EXISTS guideline_pages_blocks_column_unit_columns_locales__parent_id_f ON public.guideline_pages_blocks_column_unit_columns_locales (_parent_id);
		CREATE INDEX IF NOT EXISTS guideline_pages_blocks_column_unit_locales__parent_id_fk_idx ON public.guideline_pages_blocks_column_unit_locales (_parent_id);
		CREATE INDEX IF NOT EXISTS guideline_pages_locales__parent_id_fk_idx ON public.guideline_pages_locales (_parent_id);
		CREATE INDEX IF NOT EXISTS guideline_sections_locales__parent_id_fk_idx ON public.guideline_sections_locales (_parent_id);
		CREATE INDEX IF NOT EXISTS plugins_locales__parent_id_fk_idx ON public.plugins_locales (_parent_id);
		CREATE INDEX IF NOT EXISTS search_locales__parent_id_fk_idx ON public.search_locales (_parent_id);
		CREATE INDEX IF NOT EXISTS template_categories_locales__parent_id_fk_idx ON public.template_categories_locales (_parent_id);
		CREATE INDEX IF NOT EXISTS templates_locales__parent_id_fk_idx ON public.templates_locales (_parent_id);
		CREATE INDEX IF NOT EXISTS templates_template_rules_locales__parent_id_fk_idx ON public.templates_template_rules_locales (_parent_id);
	`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
	await db.execute(sql`
		DROP INDEX IF EXISTS public._application_images_v_locales__parent_id_fk_idx;
		DROP INDEX IF EXISTS public._brand_colors_v_locales__parent_id_fk_idx;
		DROP INDEX IF EXISTS public._brand_logos_v_locales__parent_id_fk_idx;
		DROP INDEX IF EXISTS public._brand_typefaces_v_locales__parent_id_fk_idx;
		DROP INDEX IF EXISTS public._guideline_pages_v_blocks_color_palette_locales__parent_id_fk_i;
		DROP INDEX IF EXISTS public._guideline_pages_v_blocks_column_unit_columns_locales__parent_i;
		DROP INDEX IF EXISTS public._guideline_pages_v_blocks_column_unit_locales__parent_id_fk_idx;
		DROP INDEX IF EXISTS public._guideline_pages_v_locales__parent_id_fk_idx;
		DROP INDEX IF EXISTS public._guideline_sections_v_locales__parent_id_fk_idx;
		DROP INDEX IF EXISTS public._guideline_v_locales__parent_id_fk_idx;
		DROP INDEX IF EXISTS public._plugins_v_locales__parent_id_fk_idx;
		DROP INDEX IF EXISTS public._templates_v_locales__parent_id_fk_idx;
		DROP INDEX IF EXISTS public._templates_v_version_template_rules_locales__parent_id_fk_idx;
		DROP INDEX IF EXISTS public.application_images_locales__parent_id_fk_idx;
		DROP INDEX IF EXISTS public.brand_colors_locales__parent_id_fk_idx;
		DROP INDEX IF EXISTS public.brand_logos_locales__parent_id_fk_idx;
		DROP INDEX IF EXISTS public.brand_typefaces_locales__parent_id_fk_idx;
		DROP INDEX IF EXISTS public.guideline_locales__parent_id_fk_idx;
		DROP INDEX IF EXISTS public.guideline_pages_blocks_color_palette_locales__parent_id_fk_idx;
		DROP INDEX IF EXISTS public.guideline_pages_blocks_column_unit_columns_locales__parent_id_f;
		DROP INDEX IF EXISTS public.guideline_pages_blocks_column_unit_locales__parent_id_fk_idx;
		DROP INDEX IF EXISTS public.guideline_pages_locales__parent_id_fk_idx;
		DROP INDEX IF EXISTS public.guideline_sections_locales__parent_id_fk_idx;
		DROP INDEX IF EXISTS public.plugins_locales__parent_id_fk_idx;
		DROP INDEX IF EXISTS public.search_locales__parent_id_fk_idx;
		DROP INDEX IF EXISTS public.template_categories_locales__parent_id_fk_idx;
		DROP INDEX IF EXISTS public.templates_locales__parent_id_fk_idx;
		DROP INDEX IF EXISTS public.templates_template_rules_locales__parent_id_fk_idx;
	`)
}
