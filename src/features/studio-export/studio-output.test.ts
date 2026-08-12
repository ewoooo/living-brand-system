import { describe, expect, it } from 'vitest'
import {
	applyStudioOutputPolicy,
	parseStudioOutputCapability,
	projectPayloadStudioOutputPolicy,
	supportsStudioOutput,
} from './studio-output'

const runtimeCapability = { formats: ['svg', 'png'] as const }

describe('Studio output contract', () => {
	it('Admin policy는 Runtime 순서를 유지하며 출력 범위만 좁힌다', () => {
		expect(applyStudioOutputPolicy(runtimeCapability, { formats: ['png'] })).toEqual({
			formats: ['png'],
		})
		expect(applyStudioOutputPolicy(runtimeCapability, { formats: [] })).toEqual({ formats: [] })
	})

	it('Runtime에 없는 형식과 중복 형식으로 capability를 확장하지 못한다', () => {
		expect(() => applyStudioOutputPolicy(runtimeCapability, { formats: ['jpeg'] })).toThrow(
			'Runtime capability를 확장합니다: jpeg',
		)
		expect(() =>
			applyStudioOutputPolicy(runtimeCapability, { formats: ['png', 'png'] }),
		).toThrow('format이 중복되었습니다')
	})

	it('Effective capability에 포함된 요청만 지원한다', () => {
		const capability = applyStudioOutputPolicy(runtimeCapability, { formats: ['png'] })
		expect(supportsStudioOutput(capability, 'png')).toBe(true)
		expect(supportsStudioOutput(capability, 'svg')).toBe(false)
	})

	it('직렬화 계약과 Payload 저장형을 fail-closed로 검증한다', () => {
		expect(parseStudioOutputCapability(runtimeCapability, ['svg', 'png'])).toBe(
			runtimeCapability,
		)
		expect(() => parseStudioOutputCapability({ formats: ['pdf'] }, ['svg', 'png'])).toThrow(
			'지원하지 않습니다: pdf',
		)
		expect(projectPayloadStudioOutputPolicy({ formats: [] })).toBeNull()
		expect(projectPayloadStudioOutputPolicy({ formats: ['png'] })).toEqual({
			formats: ['png'],
		})
	})
})
