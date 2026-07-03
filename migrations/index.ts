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
];
