import * as migration_20260701_021511 from './20260701_021511';
import * as migration_20260701_100619_add_mcp_api_keys from './20260701_100619_add_mcp_api_keys';
import * as migration_20260702_041019_add_template_import from './20260702_041019_add_template_import';
import * as migration_20260702_051113_add_template_categories from './20260702_051113_add_template_categories';
import * as migration_20260702_052502_add_template_asset_checksum from './20260702_052502_add_template_asset_checksum';
import * as migration_20260702_081141_add_agent_settings_global from './20260702_081141_add_agent_settings_global';
import * as migration_20260702_082845_remove_template_source_type from './20260702_082845_remove_template_source_type';
import * as migration_20260702_090914_add_template_rules from './20260702_090914_add_template_rules';
import * as migration_20260702_094833_remove_agent_skill_default from './20260702_094833_remove_agent_skill_default';
import * as migration_20260703_043507_add_brand_color_palette_fields from './20260703_043507_add_brand_color_palette_fields';
import * as migration_20260703_050030_add_color_palette_block from './20260703_050030_add_color_palette_block';
import * as migration_20260703_053851_add_rule_bindings_and_title_ko from './20260703_053851_add_rule_bindings_and_title_ko';
import * as migration_20260703_053900_seed_essenherb_ruleset from './20260703_053900_seed_essenherb_ruleset';
import * as migration_20260706_013000_seed_baseline_data from './20260706_013000_seed_baseline_data';
import * as migration_20260706_014821_page_owned_rule_placements from './20260706_014821_page_owned_rule_placements';
import * as migration_20260706_030057_remove_template_rules from './20260706_030057_remove_template_rules';
import * as migration_20260706_031500_add_mcp_call_check_session_source from './20260706_031500_add_mcp_call_check_session_source';
import * as migration_20260706_033000_normalize_rule_executor from './20260706_033000_normalize_rule_executor';
import * as migration_20260706_052000_add_rule_reference_assets from './20260706_052000_add_rule_reference_assets';
import * as migration_20260706_053000_make_color_group_editable from './20260706_053000_make_color_group_editable';
import * as migration_20260706_061000_split_review_rules from './20260706_061000_split_review_rules';

export const migrations = [
  {
    up: migration_20260701_021511.up,
    down: migration_20260701_021511.down,
    name: '20260701_021511',
  },
  {
    up: migration_20260701_100619_add_mcp_api_keys.up,
    down: migration_20260701_100619_add_mcp_api_keys.down,
    name: '20260701_100619_add_mcp_api_keys',
  },
  {
    up: migration_20260702_041019_add_template_import.up,
    down: migration_20260702_041019_add_template_import.down,
    name: '20260702_041019_add_template_import',
  },
  {
    up: migration_20260702_051113_add_template_categories.up,
    down: migration_20260702_051113_add_template_categories.down,
    name: '20260702_051113_add_template_categories',
  },
  {
    up: migration_20260702_052502_add_template_asset_checksum.up,
    down: migration_20260702_052502_add_template_asset_checksum.down,
    name: '20260702_052502_add_template_asset_checksum',
  },
  {
    up: migration_20260702_081141_add_agent_settings_global.up,
    down: migration_20260702_081141_add_agent_settings_global.down,
    name: '20260702_081141_add_agent_settings_global',
  },
  {
    up: migration_20260702_082845_remove_template_source_type.up,
    down: migration_20260702_082845_remove_template_source_type.down,
    name: '20260702_082845_remove_template_source_type',
  },
  {
    up: migration_20260702_090914_add_template_rules.up,
    down: migration_20260702_090914_add_template_rules.down,
    name: '20260702_090914_add_template_rules',
  },
  {
    up: migration_20260702_094833_remove_agent_skill_default.up,
    down: migration_20260702_094833_remove_agent_skill_default.down,
    name: '20260702_094833_remove_agent_skill_default',
  },
  {
    up: migration_20260703_043507_add_brand_color_palette_fields.up,
    down: migration_20260703_043507_add_brand_color_palette_fields.down,
    name: '20260703_043507_add_brand_color_palette_fields',
  },
  {
    up: migration_20260703_050030_add_color_palette_block.up,
    down: migration_20260703_050030_add_color_palette_block.down,
    name: '20260703_050030_add_color_palette_block',
  },
  {
    up: migration_20260703_053851_add_rule_bindings_and_title_ko.up,
    down: migration_20260703_053851_add_rule_bindings_and_title_ko.down,
    name: '20260703_053851_add_rule_bindings_and_title_ko',
  },
  {
    up: migration_20260703_053900_seed_essenherb_ruleset.up,
    down: migration_20260703_053900_seed_essenherb_ruleset.down,
    name: '20260703_053900_seed_essenherb_ruleset',
  },
  {
    up: migration_20260706_013000_seed_baseline_data.up,
    down: migration_20260706_013000_seed_baseline_data.down,
    name: '20260706_013000_seed_baseline_data',
  },
  {
    up: migration_20260706_014821_page_owned_rule_placements.up,
    down: migration_20260706_014821_page_owned_rule_placements.down,
    name: '20260706_014821_page_owned_rule_placements',
  },
  {
    up: migration_20260706_030057_remove_template_rules.up,
    down: migration_20260706_030057_remove_template_rules.down,
    name: '20260706_030057_remove_template_rules'
  },
  {
    up: migration_20260706_031500_add_mcp_call_check_session_source.up,
    down: migration_20260706_031500_add_mcp_call_check_session_source.down,
    name: '20260706_031500_add_mcp_call_check_session_source'
  },
  {
    up: migration_20260706_033000_normalize_rule_executor.up,
    down: migration_20260706_033000_normalize_rule_executor.down,
    name: '20260706_033000_normalize_rule_executor'
  },
  {
    up: migration_20260706_052000_add_rule_reference_assets.up,
    down: migration_20260706_052000_add_rule_reference_assets.down,
    name: '20260706_052000_add_rule_reference_assets'
  },
  {
    up: migration_20260706_053000_make_color_group_editable.up,
    down: migration_20260706_053000_make_color_group_editable.down,
    name: '20260706_053000_make_color_group_editable'
  },
  {
    up: migration_20260706_061000_split_review_rules.up,
    down: migration_20260706_061000_split_review_rules.down,
    name: '20260706_061000_split_review_rules'
  },
];
