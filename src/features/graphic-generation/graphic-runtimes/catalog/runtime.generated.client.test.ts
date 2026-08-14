import { describe, expect, it } from 'vitest'
import { graphicRuntimeCatalog } from './runtime.generated.client'

describe('Graphic runtime client catalog', () => {
	it('브라우저 전용 runtime을 module evaluation 중 실행하지 않는다', () => {
		expect(
			Object.values(graphicRuntimeCatalog).every((load) => typeof load === 'function'),
		).toBe(true)
	})
})
