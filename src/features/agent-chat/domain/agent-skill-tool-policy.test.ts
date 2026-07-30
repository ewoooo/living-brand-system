import { describe, expect, it } from 'vitest'
import { decideAgentQueryTriage } from './agent-query-triage'
import { getAgentExecutionPolicy, getAllowedAgentTools } from './agent-skill-tool-policy'

describe('agent skill tool policy', () => {
	it('none 범위와 등록되지 않은 skill에는 도구를 허용하지 않는다', () => {
		expect(
			getAgentExecutionPolicy({
				name: 'generate-image',
				model: 'sonnet-5',
				toolScope: 'none',
			}),
		).toEqual({
			activeTools: [],
			modelId: 'claude-sonnet-5',
		})
		expect(getAllowedAgentTools('unknown-skill', 'action')).toEqual([])
	})

	it('read 범위에서는 skill의 조회 도구만 허용한다', () => {
		expect(getAllowedAgentTools('create-from-template', 'read')).toEqual([
			'findTemplatesForRequest',
		])
	})

	it('action 범위에서는 skill의 조회와 실행 도구를 허용한다', () => {
		expect(getAllowedAgentTools('generate-image', 'action')).toEqual([
			'listImageProfiles',
			'generateImage',
		])
	})

	it('고위험 action 요청은 실행 도구를 허용하지 않는다', () => {
		const decision = decideAgentQueryTriage({
			name: 'create-from-template',
			responseMode: 'action',
			risk: 'high',
			confidence: 90,
		})

		expect(getAgentExecutionPolicy(decision)).toEqual({
			activeTools: ['findTemplatesForRequest'],
			modelId: 'claude-opus-5',
		})
	})
})
