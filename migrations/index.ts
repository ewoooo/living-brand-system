import * as migration_20260707_082517_baseline from './20260707_082517_baseline';
import * as migration_20260707_082518_baseline_seed from './20260707_082518_baseline_seed';
import * as migration_20260707_094635_add_category_description from './20260707_094635_add_category_description';
import * as migration_20260708_000000_enable_public_table_rls from './20260708_000000_enable_public_table_rls';
import * as migration_20260708_010000_add_missing_fk_indexes from './20260708_010000_add_missing_fk_indexes';
import * as migration_20260708_055554_add_chapter_hierarchy from './20260708_055554_add_chapter_hierarchy';
import * as migration_20260708_064057_add_block_rules from './20260708_064057_add_block_rules';
import * as migration_20260708_073652_add_dodont_block from './20260708_073652_add_dodont_block';

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
    name: '20260708_073652_add_dodont_block'
  },
];
