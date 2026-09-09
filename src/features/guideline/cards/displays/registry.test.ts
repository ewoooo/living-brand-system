import { describe, expect, it } from 'vitest'
import { cardFields } from '../schema'
import { DISPLAYS, displayBlocks, displayDefinition } from './registry'

describe('디스플레이 레지스트리', () => {
	it('id가 유일하고 스키마 slug와 같다', () => {
		const ids = DISPLAYS.map((entry) => entry.id)
		expect(new Set(ids).size).toBe(ids.length)
		expect(displayBlocks.map((block) => block.slug)).toEqual(ids)
	})

	// 🔴 카드 display 필드는 레지스트리 배열 그대로다 — 다른 곳에서 디스플레이를 끼워 넣지 않는다.
	it('카드 display 필드가 레지스트리를 그대로 받는다', () => {
		const display = cardFields().find((field) => 'name' in field && field.name === 'display')
		if (display?.type !== 'blocks') throw new Error('display 필드가 없다')
		expect(display.blocks).toBe(displayBlocks)
		expect(display.maxRows).toBe(1)
	})
})

it('분류와 기능 메타데이터는 저장 필드에 추가하지 않고 기존 id로 조회한다', () => {
	for (const definition of DISPLAYS) {
		expect(displayDefinition(definition.id)).toBe(definition)
		expect(['identity', 'typography', 'layout', 'color', 'iconography', 'media']).toContain(
			definition.category,
		)
		const block = displayBlocks.find((block) => block.slug === definition.id)
		expect(block?.fields).toBe(definition.fields)
	}
	expect(displayDefinition('ciLockupWidget')).toMatchObject({
		type: 'dynamic',
		category: 'identity',
		sizing: 'contain',
		downloads: ['svg'],
	})
	expect(displayDefinition('typeLanguageWidget')).toMatchObject({
		sizing: 'responsive',
		ratio: '5:7',
	})
	expect(displayDefinition('layoutGridOverlayWidget')).toMatchObject({
		sizing: 'responsive',
		ratio: '3:2',
		inset: '10%',
	})
})
