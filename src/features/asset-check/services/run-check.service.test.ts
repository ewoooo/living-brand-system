import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { RuntimeCheck } from '@/features/asset-check/domain/runtime-check'
import { runAiCheck } from '@/features/asset-check/repositories/ai-check.agent.repository'
import { extractPixelGrid } from '@/features/asset-check/repositories/image-decoder.sharp.repository'
import { getCheckPalette } from '@/features/asset-check/services/get-check-palette.service'
import type { ImageContentFlags } from '@/features/asset-check/types'
import { runHeuristicCheck, runImmediateCheck } from './run-check.service'

vi.mock('@/features/asset-check/repositories/ai-check.agent.repository', () => ({
	runAiCheck: vi.fn(),
}))

vi.mock('@/features/asset-check/services/get-check-ruleset.service', () => ({
	getRuntimeChecks: vi.fn(),
}))

vi.mock('@/features/asset-check/services/get-check-palette.service', () => ({
	getCheckPalette: vi.fn(),
}))

vi.mock('@/features/asset-check/repositories/image-decoder.sharp.repository', () => ({
	extractPixelGrid: vi.fn(),
}))

const check: RuntimeCheck = {
	key: 'imagery-misuse',
	title: '이미지 오용 금지',
	checker: { key: 'model', type: 'heuristic' },
	executor: 'heuristic',
	model: 'model',
	prompt: '브랜드 사진의 자연광 기준을 우선 적용한다.',
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

const advisoryCheck: RuntimeCheck = {
	key: 'imagery.advice',
	title: '이미지 디자인 조언',
	checker: { key: 'design-advisor', type: 'manual' },
	executor: 'manual',
	model: 'model',
	prompt: '사진 무드 관점에서 디자이너처럼 조언한다.',
	implemented: true,
	evidence: '자연스러운 일상의 순간',
	referenceAssets: [],
}

const manualAdvisoryCheck: RuntimeCheck = {
	key: 'manual-advice',
	title: '수동 조언 체크',
	checker: { key: 'design-advisor', type: 'manual' },
	executor: 'manual',
	model: 'model',
	prompt: '사진 무드 관점에서 디자이너처럼 조언한다.',
	implemented: true,
	evidence: '자연스러운 일상의 순간',
	referenceAssets: [],
}

const manualNoModelCheck: RuntimeCheck = {
	...manualAdvisoryCheck,
	key: 'manual-review',
	model: undefined,
}

const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

describe('runHeuristicCheck', () => {
	beforeEach(() => vi.mocked(runAiCheck).mockReset())

	it('AI 관찰값은 서버 evaluator에서 최종 상태로 변환한다', async () => {
		vi.mocked(runAiCheck).mockResolvedValue({
			observations: {
				'imagery-misuse': {
					'artificial-redness': {
						value: 'present',
						confidence: 85,
						reason: '볼 주변에 인위적인 붉은 색조가 관찰됩니다.',
					},
				},
			},
			advices: {},
		})

		const result = await runHeuristicCheck(png, [check.key], [check])

		expect(result.results[check.key]?.rawResult).toMatchObject({
			status: 'fail',
			fulfillment: 0,
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
			advices: {},
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

	it('판정 기준이 없는 룰만 격리하고 유효한 룰은 AI로 검사한다', async () => {
		const invalidCheck = { ...check, key: 'imagery.style', heuristicCriteria: [] }
		vi.mocked(runAiCheck).mockResolvedValue({
			observations: {
				'imagery-misuse': {
					'artificial-redness': {
						value: 'absent',
						confidence: 90,
						reason: '인위적인 붉은 색조가 관찰되지 않습니다.',
					},
				},
			},
			advices: {},
		})

		const result = await runHeuristicCheck(
			png,
			[check.key, invalidCheck.key],
			[check, invalidCheck],
		)

		expect(runAiCheck).toHaveBeenCalledWith([check], expect.any(Object))
		expect(result.results[check.key]?.rawResult.status).toBe('pass')
		expect(result.results[invalidCheck.key]?.rawResult).toEqual({
			status: 'needs_review',
			fulfillment: null,
			detail: 'Heuristic 판정 기준 없음',
			reasonCode: 'invalid_criteria',
		})
	})

	it('판정 기준이 모두 없으면 AI를 호출하지 않는다', async () => {
		const invalidCheck = { ...check, heuristicCriteria: [] }

		const result = await runHeuristicCheck(png, [invalidCheck.key], [invalidCheck])

		expect(runAiCheck).not.toHaveBeenCalled()
		expect(result.results[invalidCheck.key]?.rawResult.reasonCode).toBe('invalid_criteria')
	})

	it('advisory 체크는 조언 문단을 advisory 상태로 반환한다', async () => {
		vi.mocked(runAiCheck).mockResolvedValue({
			observations: {},
			advices: { 'imagery.advice': '자연광을 더 살리면 무드가 개선됩니다.' },
		})

		const result = await runHeuristicCheck(png, [advisoryCheck.key], [advisoryCheck])

		expect(runAiCheck).toHaveBeenCalledWith([advisoryCheck], expect.any(Object))
		expect(result.results[advisoryCheck.key]?.rawResult).toMatchObject({
			status: 'advisory',
			fulfillment: null,
			detail: '자연광을 더 살리면 무드가 개선됩니다.',
		})
	})

	it('모델이 다른 체크는 모델별로 나눠 호출하고 usage를 합산한다', async () => {
		const otherModelCheck = { ...check, key: 'imagery.tone', model: 'other-model' }
		vi.mocked(runAiCheck)
			.mockResolvedValueOnce({
				observations: {
					'imagery-misuse': {
						'artificial-redness': { value: 'absent', confidence: 90, reason: '없음' },
					},
				},
				advices: {},
				aiUsage: { model: 'model', callCount: 1, totalTokens: 100 },
			})
			.mockResolvedValueOnce({
				observations: {
					'imagery.tone': {
						'artificial-redness': { value: 'absent', confidence: 90, reason: '없음' },
					},
				},
				advices: {},
				aiUsage: { model: 'other-model', callCount: 1, totalTokens: 50 },
			})

		const result = await runHeuristicCheck(
			png,
			[check.key, otherModelCheck.key],
			[check, otherModelCheck],
		)

		expect(runAiCheck).toHaveBeenCalledTimes(2)
		expect(runAiCheck).toHaveBeenCalledWith([check], expect.any(Object))
		expect(runAiCheck).toHaveBeenCalledWith([otherModelCheck], expect.any(Object))
		expect(result.results[check.key]?.rawResult.status).toBe('pass')
		expect(result.results[otherModelCheck.key]?.rawResult.status).toBe('pass')
		expect(result.aiUsage).toMatchObject({
			model: 'model, other-model',
			callCount: 2,
			totalTokens: 150,
		})
	})

	it('모델이 없는 manual 체크는 AI 대상에서 제외한다', async () => {
		const manualCheck = { ...advisoryCheck, model: undefined }

		const result = await runHeuristicCheck(png, [manualCheck.key], [manualCheck])

		expect(runAiCheck).not.toHaveBeenCalled()
		expect(result.results[manualCheck.key]).toBeUndefined()
	})

	it('모델이 없는 heuristic 체크는 설정 오류로 격리한다', async () => {
		const noModelCheck = { ...check, key: 'imagery.nomodel', model: undefined }

		const result = await runHeuristicCheck(png, [noModelCheck.key], [noModelCheck])

		expect(runAiCheck).not.toHaveBeenCalled()
		expect(result.results[noModelCheck.key]?.rawResult).toEqual({
			status: 'needs_review',
			fulfillment: null,
			detail: 'AI 검사 도구 설정 오류',
			reasonCode: 'ai_checker_invalid',
		})
	})
})

describe('runImmediateCheck', () => {
	const flags: ImageContentFlags = {
		logo: false,
		typography: false,
		illustration: false,
		photography: false,
	}

	beforeEach(() => {
		vi.mocked(extractPixelGrid).mockResolvedValue({
			width: 1,
			height: 1,
			pixels: [{ r: 0, g: 0, b: 0 }],
			alpha: new Uint8Array([255]),
		})
		vi.mocked(getCheckPalette).mockResolvedValue([])
	})

	it('model이 설정된 manual 체크는 즉시 판정하지 않고 pendingCheckKeys로 분리한다', async () => {
		const result = await runImmediateCheck(png, flags, [manualAdvisoryCheck])

		expect(result.pendingCheckKeys).toEqual([manualAdvisoryCheck.key])
		expect(result.results[manualAdvisoryCheck.key]).toBeUndefined()
	})

	it('model이 없는 manual 체크는 즉시 담당자 확인 필요로 판정한다', async () => {
		const result = await runImmediateCheck(png, flags, [manualNoModelCheck])

		expect(result.pendingCheckKeys).toEqual([])
		expect(result.results[manualNoModelCheck.key]?.rawResult).toMatchObject({
			status: 'needs_review',
			detail: '브랜드 담당자 확인 필요',
		})
	})
})
