import { describe, expect, it, vi } from 'vitest'
import { updateLocale } from '../../migrations/20260714_031500_backfill_guideline_documents'

describe('guideline document backfill migration', () => {
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
