import { describe, expect, it } from 'vitest'
import { DISPLAYS } from './registry'
import { DISPLAY_COMPONENTS } from './registry.render'

describe('디스플레이 렌더 맵', () => {
	it('레지스트리의 모든 id에 컴포넌트가 있다', () => {
		expect(Object.keys(DISPLAY_COMPONENTS).sort()).toEqual(DISPLAYS.map((e) => e.id).sort())
	})
})
