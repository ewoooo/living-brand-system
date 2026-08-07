import * as migration_20260722_105137_baseline_v2 from './20260722_105137_baseline_v2';
import * as migration_20260723_074435_add_stem_clearspace_and_logo_viewer_blocks from './20260723_074435_add_stem_clearspace_and_logo_viewer_blocks';
import * as migration_20260723_082743_logo_viewer_topics from './20260723_082743_logo_viewer_topics';
import * as migration_20260723_085557_logo_viewer_real_height from './20260723_085557_logo_viewer_real_height';
import * as migration_20260724_005136_logo_group_viewer from './20260724_005136_logo_group_viewer';
import * as migration_20260724_074150_add_color_pairing_block from './20260724_074150_add_color_pairing_block';
import * as migration_20260728_023011_add_color_pairing_recommendation_block from './20260728_023011_add_color_pairing_recommendation_block';
import * as migration_20260728_052054_studio_image_profile_routes from './20260728_052054_studio_image_profile_routes';
import * as migration_20260728_060029_add_image_grid_description from './20260728_060029_add_image_grid_description';
import * as migration_20260729_013432_add_template_print_ppi from './20260729_013432_add_template_print_ppi';
import * as migration_20260729_024631_remove_json_templates from './20260729_024631_remove_json_templates';
import * as migration_20260729_070436_technical_illustration_profile from './20260729_070436_technical_illustration_profile';
import * as migration_20260729_082630_technical_illustration_image_output_contract from './20260729_082630_technical_illustration_image_output_contract';
import * as migration_20260730_020827_block_widget_separation from './20260730_020827_block_widget_separation';
import * as migration_20260730_080926_remove_template_rule_references from './20260730_080926_remove_template_rule_references';
import * as migration_20260730_083726_agent_chat_triage_persistence from './20260730_083726_agent_chat_triage_persistence';
import * as migration_20260731_023412_generated_images_collection from './20260731_023412_generated_images_collection';
import * as migration_20260731_024329_agent_response_levels from './20260731_024329_agent_response_levels';
import * as migration_20260731_085028_add_ci_widget_blocks from './20260731_085028_add_ci_widget_blocks';
import * as migration_20260731_094017_mcp_feature_tools from './20260731_094017_mcp_feature_tools';
import * as migration_20260803_025030_do_dont_widget from './20260803_025030_do_dont_widget';
import * as migration_20260804_051328_add_layout_grid_sample from './20260804_051328_add_layout_grid_sample';
import * as migration_20260804_053103_add_layout_grid_controls from './20260804_053103_add_layout_grid_controls';
import * as migration_20260804_073352_add_layout_grid_controls_config from './20260804_073352_add_layout_grid_controls_config';
import * as migration_20260804_080321_add_grid_labels_and_guides from './20260804_080321_add_grid_labels_and_guides';
import * as migration_20260804_082132_add_layout_grid_locks from './20260804_082132_add_layout_grid_locks';
import * as migration_20260804_083406_add_layout_grid_caption from './20260804_083406_add_layout_grid_caption';
import * as migration_20260804_085424_add_layout_grid_widget_values from './20260804_085424_add_layout_grid_widget_values';
import * as migration_20260805_031410_drop_agent_chat_triage from './20260805_031410_drop_agent_chat_triage';
import * as migration_20260805_042818_add_check_scenario_aliases from './20260805_042818_add_check_scenario_aliases';
import * as migration_20260806_052358_drop_agent_chat_session_ai_usage from './20260806_052358_drop_agent_chat_session_ai_usage';
import * as migration_20260806_065844_add_hd_color_groups_and_widgets from './20260806_065844_add_hd_color_groups_and_widgets';
import * as migration_20260806_074622_add_hd_color_palette_group from './20260806_074622_add_hd_color_palette_group';
import * as migration_20260806_081710_hd_color_palette_groups_many from './20260806_081710_hd_color_palette_groups_many';
import * as migration_20260806_090323_brand_color_logo_rules from './20260806_090323_brand_color_logo_rules';
import * as migration_20260806_091021_logo_on_background_widget from './20260806_091021_logo_on_background_widget';
import * as migration_20260807_010007_color_incorrect_usage_widget from './20260807_010007_color_incorrect_usage_widget';
import * as migration_20260807_012350_dodont_widget_unify from './20260807_012350_dodont_widget_unify';
import * as migration_20260807_020833_hd_color_palette_layout from './20260807_020833_hd_color_palette_layout';

export const migrations = [
  {
    up: migration_20260722_105137_baseline_v2.up,
    down: migration_20260722_105137_baseline_v2.down,
    name: '20260722_105137_baseline_v2',
  },
  {
    up: migration_20260723_074435_add_stem_clearspace_and_logo_viewer_blocks.up,
    down: migration_20260723_074435_add_stem_clearspace_and_logo_viewer_blocks.down,
    name: '20260723_074435_add_stem_clearspace_and_logo_viewer_blocks',
  },
  {
    up: migration_20260723_082743_logo_viewer_topics.up,
    down: migration_20260723_082743_logo_viewer_topics.down,
    name: '20260723_082743_logo_viewer_topics',
  },
  {
    up: migration_20260723_085557_logo_viewer_real_height.up,
    down: migration_20260723_085557_logo_viewer_real_height.down,
    name: '20260723_085557_logo_viewer_real_height',
  },
  {
    up: migration_20260724_005136_logo_group_viewer.up,
    down: migration_20260724_005136_logo_group_viewer.down,
    name: '20260724_005136_logo_group_viewer',
  },
  {
    up: migration_20260724_074150_add_color_pairing_block.up,
    down: migration_20260724_074150_add_color_pairing_block.down,
    name: '20260724_074150_add_color_pairing_block',
  },
  {
    up: migration_20260728_023011_add_color_pairing_recommendation_block.up,
    down: migration_20260728_023011_add_color_pairing_recommendation_block.down,
    name: '20260728_023011_add_color_pairing_recommendation_block',
  },
  {
    up: migration_20260728_052054_studio_image_profile_routes.up,
    down: migration_20260728_052054_studio_image_profile_routes.down,
    name: '20260728_052054_studio_image_profile_routes',
  },
  {
    up: migration_20260728_060029_add_image_grid_description.up,
    down: migration_20260728_060029_add_image_grid_description.down,
    name: '20260728_060029_add_image_grid_description',
  },
  {
    up: migration_20260729_013432_add_template_print_ppi.up,
    down: migration_20260729_013432_add_template_print_ppi.down,
    name: '20260729_013432_add_template_print_ppi',
  },
  {
    up: migration_20260729_024631_remove_json_templates.up,
    down: migration_20260729_024631_remove_json_templates.down,
    name: '20260729_024631_remove_json_templates',
  },
  {
    up: migration_20260729_070436_technical_illustration_profile.up,
    down: migration_20260729_070436_technical_illustration_profile.down,
    name: '20260729_070436_technical_illustration_profile',
  },
  {
    up: migration_20260729_082630_technical_illustration_image_output_contract.up,
    down: migration_20260729_082630_technical_illustration_image_output_contract.down,
    name: '20260729_082630_technical_illustration_image_output_contract',
  },
  {
    up: migration_20260730_020827_block_widget_separation.up,
    down: migration_20260730_020827_block_widget_separation.down,
    name: '20260730_020827_block_widget_separation',
  },
  {
    up: migration_20260730_080926_remove_template_rule_references.up,
    down: migration_20260730_080926_remove_template_rule_references.down,
    name: '20260730_080926_remove_template_rule_references',
  },
  {
    up: migration_20260730_083726_agent_chat_triage_persistence.up,
    down: migration_20260730_083726_agent_chat_triage_persistence.down,
    name: '20260730_083726_agent_chat_triage_persistence',
  },
  {
    up: migration_20260731_023412_generated_images_collection.up,
    down: migration_20260731_023412_generated_images_collection.down,
    name: '20260731_023412_generated_images_collection',
  },
  {
    up: migration_20260731_024329_agent_response_levels.up,
    down: migration_20260731_024329_agent_response_levels.down,
    name: '20260731_024329_agent_response_levels',
  },
  {
    up: migration_20260731_085028_add_ci_widget_blocks.up,
    down: migration_20260731_085028_add_ci_widget_blocks.down,
    name: '20260731_085028_add_ci_widget_blocks',
  },
  {
    up: migration_20260731_094017_mcp_feature_tools.up,
    down: migration_20260731_094017_mcp_feature_tools.down,
    name: '20260731_094017_mcp_feature_tools',
  },
  {
    up: migration_20260803_025030_do_dont_widget.up,
    down: migration_20260803_025030_do_dont_widget.down,
    name: '20260803_025030_do_dont_widget',
  },
  {
    up: migration_20260804_051328_add_layout_grid_sample.up,
    down: migration_20260804_051328_add_layout_grid_sample.down,
    name: '20260804_051328_add_layout_grid_sample',
  },
  {
    up: migration_20260804_053103_add_layout_grid_controls.up,
    down: migration_20260804_053103_add_layout_grid_controls.down,
    name: '20260804_053103_add_layout_grid_controls',
  },
  {
    up: migration_20260804_073352_add_layout_grid_controls_config.up,
    down: migration_20260804_073352_add_layout_grid_controls_config.down,
    name: '20260804_073352_add_layout_grid_controls_config',
  },
  {
    up: migration_20260804_080321_add_grid_labels_and_guides.up,
    down: migration_20260804_080321_add_grid_labels_and_guides.down,
    name: '20260804_080321_add_grid_labels_and_guides',
  },
  {
    up: migration_20260804_082132_add_layout_grid_locks.up,
    down: migration_20260804_082132_add_layout_grid_locks.down,
    name: '20260804_082132_add_layout_grid_locks',
  },
  {
    up: migration_20260804_083406_add_layout_grid_caption.up,
    down: migration_20260804_083406_add_layout_grid_caption.down,
    name: '20260804_083406_add_layout_grid_caption',
  },
  {
    up: migration_20260804_085424_add_layout_grid_widget_values.up,
    down: migration_20260804_085424_add_layout_grid_widget_values.down,
    name: '20260804_085424_add_layout_grid_widget_values',
  },
  {
    up: migration_20260805_031410_drop_agent_chat_triage.up,
    down: migration_20260805_031410_drop_agent_chat_triage.down,
    name: '20260805_031410_drop_agent_chat_triage',
  },
  {
    up: migration_20260805_042818_add_check_scenario_aliases.up,
    down: migration_20260805_042818_add_check_scenario_aliases.down,
    name: '20260805_042818_add_check_scenario_aliases',
  },
  {
    up: migration_20260806_052358_drop_agent_chat_session_ai_usage.up,
    down: migration_20260806_052358_drop_agent_chat_session_ai_usage.down,
    name: '20260806_052358_drop_agent_chat_session_ai_usage',
  },
  {
    up: migration_20260806_065844_add_hd_color_groups_and_widgets.up,
    down: migration_20260806_065844_add_hd_color_groups_and_widgets.down,
    name: '20260806_065844_add_hd_color_groups_and_widgets',
  },
  {
    up: migration_20260806_074622_add_hd_color_palette_group.up,
    down: migration_20260806_074622_add_hd_color_palette_group.down,
    name: '20260806_074622_add_hd_color_palette_group',
  },
  {
    up: migration_20260806_081710_hd_color_palette_groups_many.up,
    down: migration_20260806_081710_hd_color_palette_groups_many.down,
    name: '20260806_081710_hd_color_palette_groups_many',
  },
  {
    up: migration_20260806_090323_brand_color_logo_rules.up,
    down: migration_20260806_090323_brand_color_logo_rules.down,
    name: '20260806_090323_brand_color_logo_rules',
  },
  {
    up: migration_20260806_091021_logo_on_background_widget.up,
    down: migration_20260806_091021_logo_on_background_widget.down,
    name: '20260806_091021_logo_on_background_widget',
  },
  {
    up: migration_20260807_010007_color_incorrect_usage_widget.up,
    down: migration_20260807_010007_color_incorrect_usage_widget.down,
    name: '20260807_010007_color_incorrect_usage_widget',
  },
  {
    up: migration_20260807_012350_dodont_widget_unify.up,
    down: migration_20260807_012350_dodont_widget_unify.down,
    name: '20260807_012350_dodont_widget_unify',
  },
  {
    up: migration_20260807_020833_hd_color_palette_layout.up,
    down: migration_20260807_020833_hd_color_palette_layout.down,
    name: '20260807_020833_hd_color_palette_layout'
  },
];
