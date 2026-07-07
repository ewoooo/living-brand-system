import * as migration_20260707_082517_baseline from './20260707_082517_baseline';
import * as migration_20260707_082518_baseline_seed from './20260707_082518_baseline_seed';
import * as migration_20260707_094635_add_category_description from './20260707_094635_add_category_description';

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
    name: '20260707_094635_add_category_description'
  },
];
