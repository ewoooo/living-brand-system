import { revalidatePath } from 'next/cache'
import type { CollectionConfig } from 'payload'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { withFrontendRevalidation } from './revalidate'

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

/** 훅을 심은 컬렉션 하나를 만들고, 그 afterChange/afterDelete를 꺼내 쓴다. */
function wrap(collection: Partial<CollectionConfig>) {
	const [wrapped] = withFrontendRevalidation([
		{ slug: 'guideline-documents', fields: [], ...collection } as CollectionConfig,
	])
	return {
		afterChange: wrapped.hooks?.afterChange?.at(-1) as (args: unknown) => Promise<unknown>,
		afterDelete: wrapped.hooks?.afterDelete?.at(-1) as (args: unknown) => Promise<unknown>,
		hooks: wrapped.hooks,
	}
}

/** 게시 목록 조회를 흉내낸다. published=false면 게시 해제된 상태. */
function req(published: boolean, context: Record<string, unknown> = {}) {
	return {
		context,
		payload: { count: vi.fn().mockResolvedValue({ totalDocs: published ? 1 : 0 }) },
	}
}

const change = (doc: unknown, previousDoc: unknown, published: boolean, context = {}) => ({
	collection: { slug: 'guideline-documents' },
	doc,
	previousDoc,
	req: req(published, context),
})

describe('withFrontendRevalidation', () => {
	beforeEach(() => {
		vi.mocked(revalidatePath).mockClear()
	})

	it('기록 그룹에는 훅을 달지 않는다', () => {
		const recorded = wrap({ admin: { group: '운영 기록' } })
		expect(recorded.hooks?.afterChange ?? []).toHaveLength(0)
		expect(recorded.hooks?.afterDelete ?? []).toHaveLength(0)
	})

	it('기존 훅을 지우지 않고 뒤에 붙인다', () => {
		const existing = vi.fn()
		const { hooks } = wrap({ hooks: { afterChange: [existing] } })
		expect(hooks?.afterChange).toHaveLength(2)
		expect(hooks?.afterChange?.[0]).toBe(existing)
	})

	it('게시 상태 변경은 껍데기를 버린다', async () => {
		const { afterChange } = wrap({})
		await afterChange(change({ id: 1, _status: 'published' }, { _status: 'draft' }, true))
		expect(revalidatePath).toHaveBeenCalledWith('/', 'layout')
	})

	it('초안 개념이 없는 컬렉션은 모든 쓰기가 껍데기를 버린다', async () => {
		const { afterChange } = wrap({})
		await afterChange(change({ id: 1 }, { id: 1 }, true))
		expect(revalidatePath).toHaveBeenCalledOnce()
	})

	// 🔴 autosave와 게시 해제는 둘 다 `draft ← published`다. 게시 목록에 남아 있는지로만 갈린다.
	it('autosave(초안 저장)는 건너뛴다 — 게시본이 아직 목록에 있다', async () => {
		const { afterChange } = wrap({})
		await afterChange(change({ id: 1, _status: 'draft' }, { _status: 'published' }, true))
		expect(revalidatePath).not.toHaveBeenCalled()
	})

	it('게시 해제는 껍데기를 버린다 — 목록에서 사라졌다', async () => {
		const { afterChange } = wrap({})
		await afterChange(change({ id: 1, _status: 'draft' }, { _status: 'published' }, false))
		expect(revalidatePath).toHaveBeenCalledOnce()
	})

	it('초안 연타는 조회조차 하지 않는다', async () => {
		const { afterChange } = wrap({})
		const args = change({ id: 1, _status: 'draft' }, { _status: 'draft' }, true)
		await afterChange(args)
		expect(revalidatePath).not.toHaveBeenCalled()
		expect(args.req.payload.count).not.toHaveBeenCalled()
	})

	it('삭제는 껍데기를 버린다', async () => {
		const { afterDelete } = wrap({})
		await afterDelete({ doc: { id: 1 }, req: req(false) })
		expect(revalidatePath).toHaveBeenCalledOnce()
	})

	it('disableRevalidate가 켜져 있으면 아무것도 하지 않는다', async () => {
		const { afterChange } = wrap({})
		await afterChange(
			change({ id: 1, _status: 'published' }, { _status: 'draft' }, true, {
				disableRevalidate: true,
			}),
		)
		expect(revalidatePath).not.toHaveBeenCalled()
	})
})
