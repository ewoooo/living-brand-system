import { describe, expect, it } from 'vitest'
import { collectTemplateSlots } from './collect-template-slots.service'

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
})
