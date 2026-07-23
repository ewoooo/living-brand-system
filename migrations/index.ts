import * as migration_20260722_105137_baseline_v2 from './20260722_105137_baseline_v2';
import * as migration_20260723_074435_add_stem_clearspace_and_logo_viewer_blocks from './20260723_074435_add_stem_clearspace_and_logo_viewer_blocks';

export const migrations = [
  {
    up: migration_20260722_105137_baseline_v2.up,
    down: migration_20260722_105137_baseline_v2.down,
    name: '20260722_105137_baseline_v2',
  },
  {
    up: migration_20260723_074435_add_stem_clearspace_and_logo_viewer_blocks.up,
    down: migration_20260723_074435_add_stem_clearspace_and_logo_viewer_blocks.down,
    name: '20260723_074435_add_stem_clearspace_and_logo_viewer_blocks'
  },
];
