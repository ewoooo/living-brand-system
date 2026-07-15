import * as migration_20260707_082517_baseline from './20260707_082517_baseline';
import * as migration_20260707_082518_baseline_seed from './20260707_082518_baseline_seed';
import * as migration_20260707_094635_add_category_description from './20260707_094635_add_category_description';
import * as migration_20260708_000000_enable_public_table_rls from './20260708_000000_enable_public_table_rls';
import * as migration_20260708_010000_add_missing_fk_indexes from './20260708_010000_add_missing_fk_indexes';
import * as migration_20260708_055554_add_chapter_hierarchy from './20260708_055554_add_chapter_hierarchy';
import * as migration_20260708_064057_add_block_rules from './20260708_064057_add_block_rules';
import * as migration_20260708_073652_add_dodont_block from './20260708_073652_add_dodont_block';
import * as migration_20260709_013924_add_check_session_ai_usage from './20260709_013924_add_check_session_ai_usage';
import * as migration_20260709_014726_add_agent_chat_sessions from './20260709_014726_add_agent_chat_sessions';
import * as migration_20260709_015302_add_agent_chat_session_ai_usage from './20260709_015302_add_agent_chat_session_ai_usage';
import * as migration_20260709_020738_link_check_sessions_to_agent_chat_sessions from './20260709_020738_link_check_sessions_to_agent_chat_sessions';
import * as migration_20260709_021643_add_agent_chat_session_reaction from './20260709_021643_add_agent_chat_session_reaction';
import * as migration_20260709_024939_add_agent_chat_session_messages from './20260709_024939_add_agent_chat_session_messages';
import * as migration_20260709_070452_guideline_collection_slugs from './20260709_070452_guideline_collection_slugs';
import * as migration_20260709_094407_add_rule_messages from './20260709_094407_add_rule_messages';
import * as migration_20260709_095923_add_rule_tier_executor from './20260709_095923_add_rule_tier_executor';
import * as migration_20260710_014408_add_section_header_image from './20260710_014408_add_section_header_image';
import * as migration_20260710_020645_add_section_blocks from './20260710_020645_add_section_blocks';
import * as migration_20260710_021947_add_section_rule_references from './20260710_021947_add_section_rule_references';
import * as migration_20260710_042810_add_rule_specs from './20260710_042810_add_rule_specs';
import * as migration_20260710_043223_backfill_rule_specs from './20260710_043223_backfill_rule_specs';
import * as migration_20260710_045145_add_rule_document_relations from './20260710_045145_add_rule_document_relations';
import * as migration_20260710_045208_backfill_rule_documents from './20260710_045208_backfill_rule_documents';
import * as migration_20260710_050945_contract_rule_legacy_fields from './20260710_050945_contract_rule_legacy_fields';
import * as migration_20260710_052026_rename_rule_specs_to_checkers from './20260710_052026_rename_rule_specs_to_checkers';
import * as migration_20260710_070644_add_rule_source from './20260710_070644_add_rule_source';
import * as migration_20260710_070752_backfill_rule_source from './20260710_070752_backfill_rule_source';
import * as migration_20260710_075515_add_template_code_field from './20260710_075515_add_template_code_field';
import * as migration_20260710_082044_add_guideline_checks from './20260710_082044_add_guideline_checks';
import * as migration_20260710_082120_backfill_guideline_checks from './20260710_082120_backfill_guideline_checks';
import * as migration_20260710_085848 from './20260710_085848';
import * as migration_20260710_085950_backfill_template_checks from './20260710_085950_backfill_template_checks';
import * as migration_20260710_093702_connect_scenario_checks from './20260710_093702_connect_scenario_checks';
import * as migration_20260710_100108_contract_guideline_checks from './20260710_100108_contract_guideline_checks';
import * as migration_20260713_025218_remove_column_unit_title from './20260713_025218_remove_column_unit_title';
import * as migration_20260713_060746_add_chapter_label from './20260713_060746_add_chapter_label';
import * as migration_20260713_064522_check_editor_ai_context_rebased from './20260713_064522_check_editor_ai_context_rebased';
import * as migration_20260714_004502_add_template_html_fields from './20260714_004502_add_template_html_fields';
import * as migration_20260714_023146_add_guideline_documents from './20260714_023146_add_guideline_documents';
import * as migration_20260714_024739_switch_guideline_search_index from './20260714_024739_switch_guideline_search_index';
import * as migration_20260714_024930_add_guideline_legacy_mapping from './20260714_024930_add_guideline_legacy_mapping';
import * as migration_20260714_031420_add_guideline_legacy_slug from './20260714_031420_add_guideline_legacy_slug';
import * as migration_20260714_031500_backfill_guideline_documents from './20260714_031500_backfill_guideline_documents';
import * as migration_20260714_040034_contract_guideline_collections from './20260714_040034_contract_guideline_collections';
import * as migration_20260714_043746_prepare_guideline_route_slugs from './20260714_043746_prepare_guideline_route_slugs';
import * as migration_20260714_043817_backfill_guideline_route_slugs from './20260714_043817_backfill_guideline_route_slugs';
import * as migration_20260714_044457_remove_guideline_legacy_mapping from './20260714_044457_remove_guideline_legacy_mapping';
import * as migration_20260714_051528_consolidate_guideline_editor from './20260714_051528_consolidate_guideline_editor';
import * as migration_20260714_055652_cleanup_guideline_mcp_tools from './20260714_055652_cleanup_guideline_mcp_tools';
import * as migration_20260714_061204_add_template_overrides from './20260714_061204_add_template_overrides';
import * as migration_20260714_085554_heal_snapshot from './20260714_085554_heal_snapshot';
import * as migration_20260714_095159_add_contrast_checker_check from './20260714_095159_add_contrast_checker_check';
import * as migration_20260714_121152_heuristic_criteria_contract from './20260714_121152_heuristic_criteria_contract';
import * as migration_20260715_020540_checker_name_prompt from './20260715_020540_checker_name_prompt';
import * as migration_20260715_114800_extend_dodont_block from './20260715_114800_extend_dodont_block';

export const migrations = [
  {
    up: migration_20260707_082517_baseline.up,
    down: migration_20260707_082517_baseline.down,
    name: '20260707_082517_baseline',
  },
  {
    up: migration_20260707_082518_baseline_seed.up,
    down: migration_20260707_082518_baseline_seed.down,
    name: '20260707_082518_baseline_seed',
  },
  {
    up: migration_20260707_094635_add_category_description.up,
    down: migration_20260707_094635_add_category_description.down,
    name: '20260707_094635_add_category_description',
  },
  {
    up: migration_20260708_000000_enable_public_table_rls.up,
    down: migration_20260708_000000_enable_public_table_rls.down,
    name: '20260708_000000_enable_public_table_rls',
  },
  {
    up: migration_20260708_010000_add_missing_fk_indexes.up,
    down: migration_20260708_010000_add_missing_fk_indexes.down,
    name: '20260708_010000_add_missing_fk_indexes',
  },
  {
    up: migration_20260708_055554_add_chapter_hierarchy.up,
    down: migration_20260708_055554_add_chapter_hierarchy.down,
    name: '20260708_055554_add_chapter_hierarchy',
  },
  {
    up: migration_20260708_064057_add_block_rules.up,
    down: migration_20260708_064057_add_block_rules.down,
    name: '20260708_064057_add_block_rules',
  },
  {
    up: migration_20260708_073652_add_dodont_block.up,
    down: migration_20260708_073652_add_dodont_block.down,
    name: '20260708_073652_add_dodont_block',
  },
  {
    up: migration_20260709_013924_add_check_session_ai_usage.up,
    down: migration_20260709_013924_add_check_session_ai_usage.down,
    name: '20260709_013924_add_check_session_ai_usage',
  },
  {
    up: migration_20260709_014726_add_agent_chat_sessions.up,
    down: migration_20260709_014726_add_agent_chat_sessions.down,
    name: '20260709_014726_add_agent_chat_sessions',
  },
  {
    up: migration_20260709_015302_add_agent_chat_session_ai_usage.up,
    down: migration_20260709_015302_add_agent_chat_session_ai_usage.down,
    name: '20260709_015302_add_agent_chat_session_ai_usage',
  },
  {
    up: migration_20260709_020738_link_check_sessions_to_agent_chat_sessions.up,
    down: migration_20260709_020738_link_check_sessions_to_agent_chat_sessions.down,
    name: '20260709_020738_link_check_sessions_to_agent_chat_sessions',
  },
  {
    up: migration_20260709_021643_add_agent_chat_session_reaction.up,
    down: migration_20260709_021643_add_agent_chat_session_reaction.down,
    name: '20260709_021643_add_agent_chat_session_reaction',
  },
  {
    up: migration_20260709_024939_add_agent_chat_session_messages.up,
    down: migration_20260709_024939_add_agent_chat_session_messages.down,
    name: '20260709_024939_add_agent_chat_session_messages',
  },
  {
    up: migration_20260709_070452_guideline_collection_slugs.up,
    down: migration_20260709_070452_guideline_collection_slugs.down,
    name: '20260709_070452_guideline_collection_slugs',
  },
  {
    up: migration_20260709_094407_add_rule_messages.up,
    down: migration_20260709_094407_add_rule_messages.down,
    name: '20260709_094407_add_rule_messages',
  },
  {
    up: migration_20260709_095923_add_rule_tier_executor.up,
    down: migration_20260709_095923_add_rule_tier_executor.down,
    name: '20260709_095923_add_rule_tier_executor',
  },
  {
    up: migration_20260710_014408_add_section_header_image.up,
    down: migration_20260710_014408_add_section_header_image.down,
    name: '20260710_014408_add_section_header_image',
  },
  {
    up: migration_20260710_020645_add_section_blocks.up,
    down: migration_20260710_020645_add_section_blocks.down,
    name: '20260710_020645_add_section_blocks',
  },
  {
    up: migration_20260710_021947_add_section_rule_references.up,
    down: migration_20260710_021947_add_section_rule_references.down,
    name: '20260710_021947_add_section_rule_references',
  },
  {
    up: migration_20260710_042810_add_rule_specs.up,
    down: migration_20260710_042810_add_rule_specs.down,
    name: '20260710_042810_add_rule_specs',
  },
  {
    up: migration_20260710_043223_backfill_rule_specs.up,
    down: migration_20260710_043223_backfill_rule_specs.down,
    name: '20260710_043223_backfill_rule_specs',
  },
  {
    up: migration_20260710_045145_add_rule_document_relations.up,
    down: migration_20260710_045145_add_rule_document_relations.down,
    name: '20260710_045145_add_rule_document_relations',
  },
  {
    up: migration_20260710_045208_backfill_rule_documents.up,
    down: migration_20260710_045208_backfill_rule_documents.down,
    name: '20260710_045208_backfill_rule_documents',
  },
  {
    up: migration_20260710_050945_contract_rule_legacy_fields.up,
    down: migration_20260710_050945_contract_rule_legacy_fields.down,
    name: '20260710_050945_contract_rule_legacy_fields',
  },
  {
    up: migration_20260710_052026_rename_rule_specs_to_checkers.up,
    down: migration_20260710_052026_rename_rule_specs_to_checkers.down,
    name: '20260710_052026_rename_rule_specs_to_checkers',
  },
  {
    up: migration_20260710_070644_add_rule_source.up,
    down: migration_20260710_070644_add_rule_source.down,
    name: '20260710_070644_add_rule_source',
  },
  {
    up: migration_20260710_070752_backfill_rule_source.up,
    down: migration_20260710_070752_backfill_rule_source.down,
    name: '20260710_070752_backfill_rule_source',
  },
  {
    up: migration_20260710_075515_add_template_code_field.up,
    down: migration_20260710_075515_add_template_code_field.down,
    name: '20260710_075515_add_template_code_field',
  },
  {
    up: migration_20260710_082044_add_guideline_checks.up,
    down: migration_20260710_082044_add_guideline_checks.down,
    name: '20260710_082044_add_guideline_checks',
  },
  {
    up: migration_20260710_082120_backfill_guideline_checks.up,
    down: migration_20260710_082120_backfill_guideline_checks.down,
    name: '20260710_082120_backfill_guideline_checks',
  },
  {
    up: migration_20260710_085848.up,
    down: migration_20260710_085848.down,
    name: '20260710_085848',
  },
  {
    up: migration_20260710_085950_backfill_template_checks.up,
    down: migration_20260710_085950_backfill_template_checks.down,
    name: '20260710_085950_backfill_template_checks',
  },
  {
    up: migration_20260710_093702_connect_scenario_checks.up,
    down: migration_20260710_093702_connect_scenario_checks.down,
    name: '20260710_093702_connect_scenario_checks',
  },
  {
    up: migration_20260710_100108_contract_guideline_checks.up,
    down: migration_20260710_100108_contract_guideline_checks.down,
    name: '20260710_100108_contract_guideline_checks',
  },
  {
    up: migration_20260713_025218_remove_column_unit_title.up,
    down: migration_20260713_025218_remove_column_unit_title.down,
    name: '20260713_025218_remove_column_unit_title',
  },
  {
    up: migration_20260713_060746_add_chapter_label.up,
    down: migration_20260713_060746_add_chapter_label.down,
    name: '20260713_060746_add_chapter_label',
  },
  {
    up: migration_20260713_064522_check_editor_ai_context_rebased.up,
    down: migration_20260713_064522_check_editor_ai_context_rebased.down,
    name: '20260713_064522_check_editor_ai_context_rebased',
  },
  {
    up: migration_20260714_004502_add_template_html_fields.up,
    down: migration_20260714_004502_add_template_html_fields.down,
    name: '20260714_004502_add_template_html_fields',
  },
  {
    up: migration_20260714_023146_add_guideline_documents.up,
    down: migration_20260714_023146_add_guideline_documents.down,
    name: '20260714_023146_add_guideline_documents',
  },
  {
    up: migration_20260714_024739_switch_guideline_search_index.up,
    down: migration_20260714_024739_switch_guideline_search_index.down,
    name: '20260714_024739_switch_guideline_search_index',
  },
  {
    up: migration_20260714_024930_add_guideline_legacy_mapping.up,
    down: migration_20260714_024930_add_guideline_legacy_mapping.down,
    name: '20260714_024930_add_guideline_legacy_mapping',
  },
  {
    up: migration_20260714_031420_add_guideline_legacy_slug.up,
    down: migration_20260714_031420_add_guideline_legacy_slug.down,
    name: '20260714_031420_add_guideline_legacy_slug',
  },
  {
    up: migration_20260714_031500_backfill_guideline_documents.up,
    down: migration_20260714_031500_backfill_guideline_documents.down,
    name: '20260714_031500_backfill_guideline_documents',
  },
  {
    up: migration_20260714_040034_contract_guideline_collections.up,
    down: migration_20260714_040034_contract_guideline_collections.down,
    name: '20260714_040034_contract_guideline_collections',
  },
  {
    up: migration_20260714_043746_prepare_guideline_route_slugs.up,
    down: migration_20260714_043746_prepare_guideline_route_slugs.down,
    name: '20260714_043746_prepare_guideline_route_slugs',
  },
  {
    up: migration_20260714_043817_backfill_guideline_route_slugs.up,
    down: migration_20260714_043817_backfill_guideline_route_slugs.down,
    name: '20260714_043817_backfill_guideline_route_slugs',
  },
  {
    up: migration_20260714_044457_remove_guideline_legacy_mapping.up,
    down: migration_20260714_044457_remove_guideline_legacy_mapping.down,
    name: '20260714_044457_remove_guideline_legacy_mapping',
  },
  {
    up: migration_20260714_051528_consolidate_guideline_editor.up,
    down: migration_20260714_051528_consolidate_guideline_editor.down,
    name: '20260714_051528_consolidate_guideline_editor',
  },
  {
    up: migration_20260714_055652_cleanup_guideline_mcp_tools.up,
    down: migration_20260714_055652_cleanup_guideline_mcp_tools.down,
    name: '20260714_055652_cleanup_guideline_mcp_tools',
  },
  {
    up: migration_20260714_061204_add_template_overrides.up,
    down: migration_20260714_061204_add_template_overrides.down,
    name: '20260714_061204_add_template_overrides',
  },
  {
    up: migration_20260714_085554_heal_snapshot.up,
    down: migration_20260714_085554_heal_snapshot.down,
    name: '20260714_085554_heal_snapshot',
  },
  {
    up: migration_20260714_095159_add_contrast_checker_check.up,
    down: migration_20260714_095159_add_contrast_checker_check.down,
    name: '20260714_095159_add_contrast_checker_check',
  },
  {
    up: migration_20260714_121152_heuristic_criteria_contract.up,
    down: migration_20260714_121152_heuristic_criteria_contract.down,
    name: '20260714_121152_heuristic_criteria_contract',
  },
  {
    up: migration_20260715_020540_checker_name_prompt.up,
    down: migration_20260715_020540_checker_name_prompt.down,
    name: '20260715_020540_checker_name_prompt',
  },
  {
    up: migration_20260715_114800_extend_dodont_block.up,
    down: migration_20260715_114800_extend_dodont_block.down,
    name: '20260715_114800_extend_dodont_block',
  },
];
