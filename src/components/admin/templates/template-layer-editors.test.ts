import { describe, expect, it, vi } from 'vitest'

// template-layer-editors.tsx가 끌어오는 @payloadcms/ui(toast)는 react-image-crop css를
// 전이 의존성으로 물고 있어 vitest에서 그대로 import하면 깨진다 — 순수 함수 하나만 검증하므로 목으로 비운다.
vi.mock('@payloadcms/ui', () => ({
	toast: { error: vi.fn(), success: vi.fn() },
}))

const { imageSlotAllowedProfileIds } = await import('./template-layer-editors')

describe('imageSlotAllowedProfileIds', () => {
	it('예전 고정 profileId를 허용 목록 한 개로 읽는다', () => {
		expect(imageSlotAllowedProfileIds({ profileId: 7, allowedProfileIds: [3, 4] })).toEqual([7])
	})

	it('고정이 없으면 저장된 허용 목록을 그대로 쓴다', () => {
		expect(imageSlotAllowedProfileIds({ allowedProfileIds: [3, 4] })).toEqual([3, 4])
		expect(imageSlotAllowedProfileIds({})).toBeUndefined()
	})
})
