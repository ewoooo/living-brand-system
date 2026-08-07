import { describe, expect, it, vi } from 'vitest'
import { canAssignImage, parseLayers } from './template-layers-field'

// 컴포넌트 렌더 없이 parseLayers·canAssignImage만 검증한다 — Admin 런타임 의존성은 스텁.
vi.mock('@payloadcms/ui', () => ({
	Popup: () => null,
	toast: { error: vi.fn() },
	useForm: () => ({}),
	useFormFields: () => undefined,
}))

describe('parseLayers', () => {
	it('compose가 만든 -colorize 합성 오버레이 레이어를 숨긴다', () => {
		const rows = parseLayers(
			'<div data-node-id="1:1" data-figma-type="FRAME"><div data-node-id="1:1-colorize"></div></div>',
		)
		expect(rows.map((row) => row.id)).toEqual(['1:1'])
	})

	it('캐리어가 자신·직계 자식일 때만 hasImageCarrier로 판정한다', () => {
		const rows = parseLayers(
			'<div data-node-id="direct"><div data-image-carrier data-node-id="carrier"></div></div>' +
				'<div data-node-id="grand"><div data-node-id="mid"><div data-image-carrier data-node-id="deep"></div></div></div>',
		)
		const byId = new Map(rows.map((row) => [row.id, row]))
		expect(byId.get('direct')?.hasImageCarrier).toBe(true)
		expect(byId.get('grand')?.hasImageCarrier).toBe(false)
	})

	it('<p>만 텍스트 편집 대상으로 textContent를 담는다', () => {
		const rows = parseLayers('<p data-node-id="t" data-figma-type="TEXT">안녕</p>')
		expect(rows[0]).toMatchObject({ isText: true, text: '안녕' })
	})
})

describe('canAssignImage', () => {
	it('RECTANGLE은 허용하고 텍스트·벡터는 거부한다', () => {
		const [rect, text, vector] = parseLayers(
			'<div data-node-id="r" data-figma-type="RECTANGLE"></div>' +
				'<p data-node-id="t" data-figma-type="TEXT">텍스트</p>' +
				'<img data-node-id="v" data-figma-type="VECTOR">',
		)
		expect(canAssignImage(rect)).toBe(true)
		expect(canAssignImage(text)).toBe(false)
		expect(canAssignImage(vector)).toBe(false)
	})
})
