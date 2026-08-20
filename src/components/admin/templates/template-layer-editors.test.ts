import { describe, expect, it, vi } from 'vitest'

// template-layer-editors.tsx가 끌어오는 @payloadcms/ui(Popup·toast)는 react-image-crop css를
// 전이 의존성으로 물고 있어 vitest에서 그대로 import하면 깨진다 — 순수 함수 하나만 검증하므로 목으로 비운다.
vi.mock('@payloadcms/ui', () => ({
	Popup: () => null,
	toast: { error: vi.fn(), success: vi.fn() },
}))

const { applyImageSlotProfileSelection } = await import('./template-layer-editors')

describe('applyImageSlotProfileSelection', () => {
	it('스튜디오 선택으로 되돌려도 허용 프로파일과 창작자 변형 허용을 지우지 않는다', () => {
		const imageInput = {
			profileId: 7,
			allowedProfileIds: [3, 4],
			transform: { enabled: false },
		}

		expect(applyImageSlotProfileSelection(imageInput, 'studio')).toEqual({
			allowedProfileIds: [3, 4],
			transform: { enabled: false },
		})
	})

	it('프로파일을 고정해도 허용 프로파일과 창작자 변형 허용을 지우지 않는다', () => {
		const imageInput = { allowedProfileIds: [3, 4], transform: { enabled: false } }

		expect(applyImageSlotProfileSelection(imageInput, '7')).toEqual({
			profileId: 7,
			allowedProfileIds: [3, 4],
			transform: { enabled: false },
		})
	})
})
