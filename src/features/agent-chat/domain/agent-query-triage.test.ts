import { describe, expect, it } from 'vitest'
import {
	agentQueryTriageSchema,
	agentSkillSelectionSchema,
	decideAgentQueryRouting,
	decideAgentQueryTriage,
} from './agent-query-triage'

describe('agent query triage', () => {
	it.each([
		['fast', 'haiku-4.5'],
		['standard', 'sonnet-5'],
		['deep', 'opus-5.0'],
	] as const)('%s 응답 수준의 모델을 결정한다', (responseLevel, model) => {
		expect(
			decideAgentQueryTriage({
				name: 'guideline-qa',
				responseLevel,
				taskType: 'answer',
				risk: 'low',
				confidence: 80,
			}),
		).toMatchObject({
			model,
			reviewRequired: false,
			clarificationRequired: false,
		})
	})

	it.each([
		['answer', 'none'],
		['lookup', 'read'],
		['action', 'action'],
	] as const)('%s 작업 유형의 도구 범위를 결정한다', (taskType, toolScope) => {
		expect(
			decideAgentQueryTriage({
				name: 'guideline-qa',
				responseLevel: 'standard',
				taskType,
				risk: 'low',
				confidence: 80,
			}),
		).toMatchObject({ toolScope })
	})

	it('고위험 요청은 Opus와 사람 검토를 강제하고 action을 read로 제한한다', () => {
		expect(
			decideAgentQueryTriage({
				name: 'template-creation',
				responseLevel: 'fast',
				taskType: 'action',
				risk: 'high',
				confidence: 90,
			}),
		).toMatchObject({
			responseLevel: 'deep',
			model: 'opus-5.0',
			toolScope: 'read',
			reviewRequired: true,
		})

		expect(
			decideAgentQueryTriage({
				name: 'guideline-qa',
				responseLevel: 'fast',
				taskType: 'answer',
				risk: 'high',
				confidence: 70,
			}),
		).toMatchObject({
			model: 'opus-5.0',
			toolScope: 'none',
			reviewRequired: true,
		})
	})

	it('계약 밖 필드와 confidence 범위를 거부한다', () => {
		const validProposal = {
			name: 'guideline-qa',
			responseLevel: 'fast',
			taskType: 'answer',
			risk: 'low',
			confidence: 80,
		} as const

		expect(
			agentQueryTriageSchema.safeParse({
				...validProposal,
				confidence: 101,
			}).success,
		).toBe(false)
		expect(
			agentQueryTriageSchema.safeParse({
				...validProposal,
				reason: 'extra',
			}).success,
		).toBe(false)
	})

	it('confidence가 70 미만이면 한 번의 재분류를 요청한다', () => {
		expect(
			decideAgentQueryRouting(
				{
					name: 'answer-guideline',
					responseLevel: 'fast',
					taskType: 'answer',
					risk: 'low',
					confidence: 69,
				},
				true,
			),
		).toEqual({ verificationRequired: true })
	})

	it('재분류 결과가 계속 낮거나 핵심 분류와 충돌하면 확인 질문만 허용한다', () => {
		const firstProposal = {
			name: 'answer-guideline',
			responseLevel: 'fast',
			taskType: 'answer',
			risk: 'low',
			confidence: 60,
		} as const

		expect(
			decideAgentQueryRouting({ ...firstProposal, confidence: 65 }, true, firstProposal),
		).toMatchObject({
			clarificationRequired: true,
			toolScope: 'none',
		})
		expect(
			decideAgentQueryRouting(
				{
					...firstProposal,
					name: 'generate-text',
					taskType: 'action',
					confidence: 90,
				},
				true,
				firstProposal,
			),
		).toMatchObject({
			clarificationRequired: true,
			toolScope: 'none',
		})
	})

	it('재분류가 일치하면 더 깊은 응답 수준과 더 높은 위험을 보수적으로 적용한다', () => {
		expect(
			decideAgentQueryRouting(
				{
					name: 'answer-guideline',
					responseLevel: 'standard',
					taskType: 'lookup',
					risk: 'low',
					confidence: 90,
				},
				true,
				{
					name: 'answer-guideline',
					responseLevel: 'deep',
					taskType: 'lookup',
					risk: 'high',
					confidence: 60,
				},
			),
		).toMatchObject({
			responseLevel: 'deep',
			risk: 'high',
			model: 'opus-5.0',
			reviewRequired: true,
			clarificationRequired: false,
		})
	})

	it('triage가 꺼지면 skill 이름만 받아 Sonnet과 해당 skill의 전체 도구 범위를 사용한다', () => {
		const proposal = agentSkillSelectionSchema.parse({ name: 'generate-image' })

		expect(decideAgentQueryRouting(proposal, false)).toEqual({
			name: 'generate-image',
			model: 'sonnet-5',
			toolScope: 'action',
		})
	})
})
