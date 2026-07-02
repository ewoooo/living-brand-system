import * as migration_20260701_021511 from './20260701_021511'
import * as migration_20260701_100619_add_mcp_api_keys from './20260701_100619_add_mcp_api_keys'

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
]
