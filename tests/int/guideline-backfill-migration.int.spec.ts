import { describe, expect, it, vi } from 'vitest'
import {
	normalizeBackfillBlocks,
	updateLocale,
} from '../../migrations/20260714_031500_backfill_guideline_documents'
import { kitBlocksPreludeSql } from '../../migrations/lib/kit-blocks-schema-prelude'

describe('guideline document backfill migration', () => {
	it('precreates the media showcase image tables used by the current Payload config', () => {
		expect(kitBlocksPreludeSql).toContain(
			'CREATE TABLE IF NOT EXISTS "guideline_docs_blocks_media_showcase_images"',
		)
		expect(kitBlocksPreludeSql).toContain(
			'CREATE TABLE IF NOT EXISTS "_guideline_docs_v_blocks_media_showcase_images"',
		)
	})

	it("precreates the Do/Don't example columns used by the current Payload config", () => {
		expect(kitBlocksPreludeSql).toContain(
			'CREATE TYPE "public"."enum_guideline_docs_blocks_do_dont_example_columns"',
		)
		expect(kitBlocksPreludeSql).toContain(
			'ALTER TABLE "guideline_docs_blocks_do_dont" ADD COLUMN IF NOT EXISTS "example_columns"',
		)
		expect(kitBlocksPreludeSql).toContain(
			'ALTER TABLE "_guideline_docs_v_blocks_do_dont" ADD COLUMN IF NOT EXISTS "example_columns"',
		)
	})

	it('converts a legacy media showcase image to the current images array', () => {
		expect(
			normalizeBackfillBlocks([
				{
					blockType: 'mediaShowcase',
					id: 'media-1',
					image: 7,
					imageBackgroundColor: 3,
					imageScale: '80',
				},
			] as never),
		).toEqual([
			{
				blockType: 'mediaShowcase',
				id: 'media-1',
				images: [{ image: 7, imageBackgroundColor: 3, imageScale: '80' }],
			},
		])
	})

	it('skips a localized draft without a slug before updating data or legacy mapping', async () => {
		const payload = {
			logger: { warn: vi.fn() },
			update: vi.fn(),
		}
		const db = { execute: vi.fn() }

		await updateLocale(
			payload as never,
			db as never,
			10,
			{
				_status: 'draft',
				displayOrder: 0,
				id: 3,
				slug: undefined,
				title: 'English title',
			} as never,
			'en',
			true,
			'guideline-chapters',
			new Map(),
			{} as never,
		)

		expect(payload.update).not.toHaveBeenCalled()
		expect(db.execute).not.toHaveBeenCalled()
		expect(payload.logger.warn).toHaveBeenCalledWith(
			'guideline-chapters:3의 en 최신 상태는 필수 번역 필드가 없어 제외합니다.',
		)
	})
})
