import { describe, expect, it } from 'vitest'
import { getCheckScenarioFlags } from './scenarios'

describe('getCheckScenarioFlags', () => {
	it('시나리오의 Rule key로 이미지 분석 범위를 정한다', () => {
		expect(
			getCheckScenarioFlags({
				key: 'image',
				title: '이미지 검수',
				checkKeys: ['logo.size', 'typography.usage', 'imagery.style'],
			}),
		).toEqual({
			logo: true,
			typography: true,
			illustration: false,
			photography: true,
		})
	})
})
