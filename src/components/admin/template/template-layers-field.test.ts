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

	it('주소가 프레임이면 carrierChildId에 해석된 캐리어 자식을 담는다', () => {
		const rows = parseLayers(
			'<div data-node-id="root">' +
				'<div data-node-id="clip" style="overflow:hidden">' +
				'<div data-node-id="clip-child" data-image-carrier=""></div>' +
				'</div>' +
				'</div>',
		)
		const byId = new Map(rows.map((row) => [row.id, row]))
		expect(byId.get('clip')?.carrierChildId).toBe('clip-child')
		expect(byId.get('clip-child')?.imageAddress).toBe('parent')
	})

	it('<p>만 텍스트 편집 대상으로 textContent를 담는다', () => {
		const rows = parseLayers('<p data-node-id="t" data-figma-type="TEXT">안녕</p>')
		expect(rows[0]).toMatchObject({ isText: true, text: '안녕' })
	})
})

describe('canAssignImage — 주소 매트릭스', () => {
	it('배정 주소는 가시 창 하나 — 클립 프레임 또는 캐리어 자신, 둘 다는 아니다', () => {
		const rows = parseLayers(
			'<div data-node-id="root">' +
				// 클립 프레임 + 마킹 자식 1 → 주소는 프레임, 자식은 숨김.
				'<div data-node-id="clip" style="overflow:hidden">' +
				'<div data-node-id="clip-child" data-image-carrier=""></div>' +
				'</div>' +
				// 스탠드얼론 캐리어 → 자신이 주소.
				'<div data-node-id="standalone" data-image-carrier=""></div>' +
				// 비클립 GROUP 부모 → 부모는 주소가 아니고 마킹 자식이 주소.
				'<div data-node-id="group" data-figma-type="GROUP">' +
				'<div data-node-id="group-child" data-image-carrier=""></div>' +
				'</div>' +
				// 형제 캐리어 2개 → 프레임은 주소가 아니고 각 자식이 자기 주소.
				'<div data-node-id="twins" style="overflow:hidden">' +
				'<div data-node-id="twin-a" data-image-carrier=""></div>' +
				'<div data-node-id="twin-b" data-image-carrier=""></div>' +
				'</div>' +
				'</div>' +
				// 루트 클립 프레임은 주소가 될 수 없다(캔버스) — 캐리어 자식이 주소.
				'<div data-node-id="root-clip" style="overflow:hidden">' +
				'<div data-node-id="root-clip-child" data-image-carrier=""></div>' +
				'</div>' +
				'<p data-node-id="text" data-figma-type="TEXT">텍스트</p>' +
				'<img data-node-id="vector" data-figma-type="VECTOR">',
		)
		const byId = new Map(rows.map((row) => [row.id, row]))
		const allows = (id: string) => canAssignImage(byId.get(id) as (typeof rows)[number])

		expect(allows('clip')).toBe(true)
		expect(allows('clip-child')).toBe(false)
		expect(allows('standalone')).toBe(true)
		expect(allows('group')).toBe(false)
		expect(allows('group-child')).toBe(true)
		expect(allows('twins')).toBe(false)
		expect(allows('twin-a')).toBe(true)
		expect(allows('twin-b')).toBe(true)
		expect(allows('root-clip')).toBe(false)
		expect(allows('root-clip-child')).toBe(true)
		expect(allows('text')).toBe(false)
		expect(allows('vector')).toBe(false)
	})
})
