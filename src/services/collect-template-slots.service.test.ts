import { describe, expect, it } from 'vitest'
import { collectTemplateImageSlots, collectTemplateSlots } from './collect-template-slots.service'

const html = [
	'<div data-node-id="1:1" data-figma-type="FRAME" data-name="Card">',
	'<p data-node-id="2:1" data-figma-type="TEXT" data-name="Korean Name">홍길동</p>',
	'<p data-node-id="2:2" data-figma-type="TEXT" data-name="English Name">Hong Gildong</p>',
	'<img data-node-id="3:1" data-figma-type="VECTOR" data-name="Vector" src="/logo.svg">',
	'</div>',
].join('')

describe('collectTemplateSlots', () => {
	it('input이 있는 텍스트 노드만 문서 순서로 모은다', () => {
		const slots = collectTemplateSlots(html, {
			'2:2': { input: { label: '영문 이름', aiInstruction: '영문 이름만' } },
			'2:1': { input: {} },
		})

		expect(slots).toEqual([
			{ nodeId: '2:1', name: 'Korean Name', text: '홍길동', input: {} },
			{
				nodeId: '2:2',
				name: 'English Name',
				text: 'Hong Gildong',
				input: { label: '영문 이름', aiInstruction: '영문 이름만' },
			},
		])
	})

	it('텍스트 노드가 아닌 노드의 input과 input 없는 오버라이드는 무시한다', () => {
		const slots = collectTemplateSlots(html, {
			'3:1': { input: { label: '벡터에 붙은 잘못된 스펙' } },
			'2:1': { text: '김철수' },
			'9:9': { input: {} }, // base에 없는 고아 노드
		})

		expect(slots).toEqual([])
	})

	it('imageInput 오버라이드는 텍스트 슬롯에 영향을 주지 않는다', () => {
		const slots = collectTemplateSlots(html, {
			'1:1': { imageInput: {} },
			'2:1': { input: {} },
		})

		expect(slots).toEqual([{ nodeId: '2:1', name: 'Korean Name', text: '홍길동', input: {} }])
	})
})

describe('collectTemplateImageSlots', () => {
	it('imageInput이 있는 노드만 문서 순서로 모은다', () => {
		const slots = collectTemplateImageSlots(html, {
			'1:1': { imageInput: { profileId: 7 } },
		})

		expect(slots).toEqual([{ nodeId: '1:1', name: 'Card', profileId: 7 }])
	})

	it('profileId가 없으면 개방만 표시한다', () => {
		const slots = collectTemplateImageSlots(html, {
			'1:1': { imageInput: {} },
		})

		expect(slots).toEqual([{ nodeId: '1:1', name: 'Card' }])
	})

	it('슬롯 요소 자신의 inline width/height(px)를 박스로 읽는다 — emit의 여러 줄 style 그대로', () => {
		const boxedHtml = [
			'<div data-node-id="1:1" data-figma-type="FRAME" data-name="Image Area" style="',
			'\tbox-sizing:border-box;',
			'\tmin-width:100px;',
			'\twidth:911.5px;',
			'\theight:492px;',
			'">',
			'<div data-node-id="1:2" data-image-carrier="" style="width:2000px;height:2000px;"></div>',
			'</div>',
		].join('\n')

		const slots = collectTemplateImageSlots(boxedHtml, { '1:1': { imageInput: {} } })

		expect(slots).toEqual([
			{ nodeId: '1:1', name: 'Image Area', boxWidth: 911.5, boxHeight: 492 },
		])
	})

	it('inline px 치수가 없으면 박스를 남기지 않는다', () => {
		const slots = collectTemplateImageSlots(
			'<div data-node-id="1:1" data-name="Fluid" style="width:100%;height:auto;"></div>',
			{ '1:1': { imageInput: {} } },
		)

		expect(slots).toEqual([{ nodeId: '1:1', name: 'Fluid' }])
	})

	it('텍스트 노드의 imageInput·고아 노드·imageInput 없는 오버라이드는 무시한다', () => {
		const slots = collectTemplateImageSlots(html, {
			'2:1': { imageInput: {} }, // 텍스트 노드에 붙은 잘못된 스펙
			'1:1': { backgroundImage: '/bg.png' },
			'9:9': { imageInput: {} }, // base에 없는 고아 노드
		})

		expect(slots).toEqual([])
	})
})
