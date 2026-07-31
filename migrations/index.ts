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
    name: '20260731_023412_generated_images_collection'
  },
];
