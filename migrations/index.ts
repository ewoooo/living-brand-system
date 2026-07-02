import * as migration_20260701_021511 from './20260701_021511'
import * as migration_20260701_100619_add_mcp_api_keys from './20260701_100619_add_mcp_api_keys'
import * as migration_20260702_041019_add_template_import from './20260702_041019_add_template_import'
import * as migration_20260702_051113_add_template_categories from './20260702_051113_add_template_categories'

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
]
