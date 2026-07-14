import { beforeEach, describe, expect, it, vi } from 'vitest'
import { runAiCheck } from '@/features/asset-check/repositories/ai-check.agent.repository'
import type { RuntimeCheck } from '@/features/asset-check/services/get-check-ruleset.service'
import { runHeuristicCheck } from './run-check.service'

vi.mock('@/features/asset-check/repositories/ai-check.agent.repository', () => ({
	runAiCheck: vi.fn(),
}))

vi.mock('@/features/asset-check/services/get-check-ruleset.service', () => ({
	getRuntimeChecks: vi.fn(),
}))

vi.mock('@/features/asset-check/services/get-check-palette.service', () => ({
	getCheckPalette: vi.fn(),
}))

const check: RuntimeCheck = {
	key: 'imagery.misuse',
	title: '이미지 오용 금지',
	executor: 'heuristic',
	model: 'model',
	promptKey: 'asset-check.brand-guideline.v1',
	heuristicCriteria: [
		{
			id: 'artificial-redness',
			question: '인위적인 홍조 표현이 있는가?',
			expected: 'absent',
		},
	],
	implemented: true,
	evidence: '과도한 색조 보정을 금지합니다.',
	referenceAssets: [],
}

const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

describe('runHeuristicCheck', () => {
	beforeEach(() => vi.mocked(runAiCheck).mockReset())

	it('AI 관찰값은 서버 evaluator에서 최종 상태로 변환한다', async () => {
		vi.mocked(runAiCheck).mockResolvedValue({
			observations: {
				'imagery.misuse': {
					'artificial-redness': {
						value: 'present',
						confidence: 85,
						reason: '볼 주변에 인위적인 붉은 색조가 관찰됩니다.',
					},
				},
			},
		})

		const result = await runHeuristicCheck(png, [check.key], [check])

		expect(result.results[check.key]?.rawResult).toMatchObject({
			status: 'fail',
			fulfillment: null,
			observations: [
				{
					criterionId: 'artificial-redness',
					expected: 'absent',
					actual: 'present',
					satisfied: false,
				},
			],
		})
	})

	it('AI 실행 실패는 판정을 만들지 않고 needs_review로 연결한다', async () => {
		vi.mocked(runAiCheck).mockResolvedValue({
			observations: {},
			failure: { detail: 'AI 관측값 형식 오류', reasonCode: 'ai_output_invalid' },
		})

		const result = await runHeuristicCheck(png, [check.key], [check])

		expect(result.results[check.key]?.rawResult).toEqual({
			status: 'needs_review',
			fulfillment: null,
			detail: 'AI 관측값 형식 오류',
			reasonCode: 'ai_output_invalid',
		})
	})
})
