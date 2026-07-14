import { revalidatePath } from 'next/cache'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { revalidateGuideline } from './Guideline'

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

describe('revalidateGuideline', () => {
	beforeEach(() => {
		vi.mocked(revalidatePath).mockClear()
	})

	it('revalidates the root layout only for published changes', async () => {
		await revalidateGuideline({
			doc: { _status: 'draft' },
			req: { context: {} },
		} as never)
		await revalidateGuideline({
			doc: { _status: 'published' },
			req: { context: { disableRevalidate: true } },
		} as never)
		await revalidateGuideline({
			doc: { _status: 'published' },
			req: { context: {} },
		} as never)

		expect(revalidatePath).toHaveBeenCalledOnce()
		expect(revalidatePath).toHaveBeenCalledWith('/', 'layout')
	})
})
