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
	it('캐리어 보유만 허용한다 — RECTANGLE 타입만으로는 거부, 텍스트·벡터도 거부', () => {
		const rows = parseLayers(
			'<div data-node-id="r" data-figma-type="RECTANGLE"></div>' +
				'<div data-node-id="s" data-figma-type="RECTANGLE" data-image-carrier=""></div>' +
				'<div data-node-id="f" data-figma-type="INSTANCE">' +
				'<div data-node-id="c" data-figma-type="RECTANGLE" data-image-carrier=""></div>' +
				'</div>' +
				'<p data-node-id="t" data-figma-type="TEXT">텍스트</p>' +
				'<img data-node-id="v" data-figma-type="VECTOR">',
		)
		const byId = new Map(rows.map((row) => [row.id, row]))
		const allows = (id: string) => canAssignImage(byId.get(id) as (typeof rows)[number])

		expect(allows('r')).toBe(false) // 마킹 없는 사각형 — 타입 추측으로 열지 않는다
		expect(allows('s')).toBe(true) // 자기 캐리어
		expect(allows('f')).toBe(true) // 직계 자식 캐리어 — 타입 무관
		expect(allows('t')).toBe(false)
		expect(allows('v')).toBe(false)
	})
})
