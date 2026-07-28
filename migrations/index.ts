import * as migration_20260722_105137_baseline_v2 from './20260722_105137_baseline_v2';
import * as migration_20260723_074435_add_stem_clearspace_and_logo_viewer_blocks from './20260723_074435_add_stem_clearspace_and_logo_viewer_blocks';
import * as migration_20260723_082743_logo_viewer_topics from './20260723_082743_logo_viewer_topics';
import * as migration_20260723_085557_logo_viewer_real_height from './20260723_085557_logo_viewer_real_height';
import * as migration_20260724_005136_logo_group_viewer from './20260724_005136_logo_group_viewer';
import * as migration_20260724_074150_add_color_pairing_block from './20260724_074150_add_color_pairing_block';
import * as migration_20260728_023011_add_color_pairing_recommendation_block from './20260728_023011_add_color_pairing_recommendation_block';
import * as migration_20260728_052054_studio_image_profile_routes from './20260728_052054_studio_image_profile_routes';
import * as migration_20260728_060029_add_image_grid_description from './20260728_060029_add_image_grid_description';

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
];
