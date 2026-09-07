import { describe, expect, it } from 'vitest'
import { cardFields } from '../schema'
import { DISPLAYS, displayBlocks } from './registry'

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
