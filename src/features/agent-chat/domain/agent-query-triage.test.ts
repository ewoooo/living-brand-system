import { describe, expect, it } from 'vitest'
import {
	agentQueryTriageSchema,
	agentSkillSelectionSchema,
	decideAgentQueryRouting,
	decideAgentQueryTriage,
} from './agent-query-triage'

describe('agent query triage', () => {
	it.each([
		['quick', 'sonnet-5', 'none'],
		['lookup', 'sonnet-5', 'read'],
		['research', 'opus-5.0', 'read'],
		['action', 'opus-5.0', 'action'],
	] as const)('%s 요청의 실행 수준을 결정한다', (responseMode, model, toolScope) => {
		expect(
			decideAgentQueryTriage({
				name: 'guideline-qa',
				responseMode,
				risk: 'low',
				confidence: 80,
			}),
		).toMatchObject({
			model,
			toolScope,
			reviewRequired: false,
		})
	})

	it('고위험 요청은 Opus와 사람 검토를 강제하고 action을 read로 제한한다', () => {
		expect(
			decideAgentQueryTriage({
				name: 'template-creation',
				responseMode: 'action',
				risk: 'high',
				confidence: 90,
			}),
		).toMatchObject({
			model: 'opus-5.0',
			toolScope: 'read',
			reviewRequired: true,
		})

		expect(
			decideAgentQueryTriage({
				name: 'guideline-qa',
				responseMode: 'quick',
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
			responseMode: 'quick',
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

	it('triage가 꺼지면 skill 이름만 받아 Sonnet과 해당 skill의 전체 도구 범위를 사용한다', () => {
		const proposal = agentSkillSelectionSchema.parse({ name: 'generate-image' })

		expect(decideAgentQueryRouting(proposal, false)).toEqual({
			name: 'generate-image',
			model: 'sonnet-5',
			toolScope: 'action',
		})
	})
})
