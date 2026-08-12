import { describe, expect, it } from 'vitest'
import { resolveStudioOutputFormats } from './studio-output'

describe('resolveStudioOutputFormats', () => {
	it('Admin 제한이 없으면 Runtime 순서를 유지한다', () => {
		expect(resolveStudioOutputFormats(['svg', 'png'] as const, undefined)).toEqual([
			'svg',
			'png',
		])
	})

	it('Admin이 허용한 부분집합만 Runtime 순서로 남긴다', () => {
		expect(resolveStudioOutputFormats(['svg', 'png'] as const, ['png'])).toEqual(['png'])
		expect(resolveStudioOutputFormats(['svg'] as const, [])).toEqual([])
	})

	it('지원하지 않는 형식과 중복을 거부한다', () => {
		expect(() => resolveStudioOutputFormats(['svg'] as const, ['png'])).toThrow(
			'지원하지 않는 output format',
		)
		expect(() => resolveStudioOutputFormats(['svg'] as const, ['svg', 'svg'])).toThrow('중복')
	})
})
