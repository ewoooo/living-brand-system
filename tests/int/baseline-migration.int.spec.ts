import { describe, expect, it, vi } from 'vitest'
import { up } from '../../migrations/20260722_105137_baseline_v2'

const currentSchema = {
	brand_icons: 'brand_icons',
	icon_grid: 'guideline_docs_blocks_icon_grid',
	image_grid: 'guideline_docs_blocks_image_grid',
	image_grid_cells: 'guideline_docs_blocks_image_grid_cells',
	migration_table: 'payload_migrations',
}

describe('baseline v2 migration', () => {
	it('adopts a fully migrated database without replaying schema DDL', async () => {
		const execute = vi
			.fn()
			.mockResolvedValueOnce({ rows: [currentSchema] })
			.mockResolvedValueOnce({ rows: [{ count: 5 }] })
			.mockResolvedValueOnce({ rows: [] })
			.mockResolvedValueOnce({ rows: [] })

		await up({ db: { execute } } as never)

		expect(execute).toHaveBeenCalledTimes(4)
	})

	it('rejects an existing database that has not applied the five handoff migrations', async () => {
		const execute = vi
			.fn()
			.mockResolvedValueOnce({ rows: [currentSchema] })
			.mockResolvedValueOnce({ rows: [{ count: 4 }] })

		await expect(up({ db: { execute } } as never)).rejects.toThrow(
			'20260722 마이그레이션 5개를 먼저 적용하세요',
		)
		expect(execute).toHaveBeenCalledTimes(2)
	})
})
