import * as migration_20260722_105137_baseline_v2 from './20260722_105137_baseline_v2';

export const migrations = [
  {
    up: migration_20260722_105137_baseline_v2.up,
    down: migration_20260722_105137_baseline_v2.down,
    name: '20260722_105137_baseline_v2'
  },
];
