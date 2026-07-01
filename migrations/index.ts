import * as migration_20260701_021511 from './20260701_021511'

export const migrations = [
	{
		up: migration_20260701_021511.up,
		down: migration_20260701_021511.down,
		name: '20260701_021511',
	},
]
