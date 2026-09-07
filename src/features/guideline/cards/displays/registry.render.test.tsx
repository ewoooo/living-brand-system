import { describe, expect, it } from 'vitest'
import { DISPLAYS } from './registry'
import { DISPLAY_RENDERERS } from './registry.render'

describe('디스플레이 렌더 맵', () => {
	it('레지스트리의 모든 id에 렌더가 있다', () => {
		expect(Object.keys(DISPLAY_RENDERERS).sort()).toEqual(DISPLAYS.map((e) => e.id).sort())
	})
})
