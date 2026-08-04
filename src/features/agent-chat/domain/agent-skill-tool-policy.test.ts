import { describe, expect, it } from 'vitest'
import {
	agentSkillSelectionSchema,
	getAgentExecutionPolicy,
	readSkillName,
} from './agent-skill-tool-policy'

describe('agent skill tool policy', () => {
	it('등록된 skill에는 해당 skill의 도구 전체를 허용한다', () => {
		expect(getAgentExecutionPolicy({ name: 'generate-image' })).toEqual({
			activeTools: ['listImageProfiles', 'generateImage'],
			modelId: 'claude-sonnet-5',
		})
		expect(getAgentExecutionPolicy({ name: 'answer-guideline' }).activeTools).toEqual([
			'listGuidelineDocuments',
			'searchGuidelines',
			'readGuidelineDocument',
			'getCheckCatalog',
		])
	})

	it('등록되지 않은 skill에는 도구를 허용하지 않는다', () => {
		expect(getAgentExecutionPolicy({ name: 'unknown-skill' })).toEqual({
			activeTools: [],
			modelId: 'claude-sonnet-5',
		})
	})
})

describe('agentSkillSelectionSchema', () => {
	it('skill 이름만 허용하고 추가 필드는 거부한다', () => {
		expect(agentSkillSelectionSchema.parse({ name: ' generate-image ' })).toEqual({
			name: 'generate-image',
		})
		expect(agentSkillSelectionSchema.safeParse({ name: '' }).success).toBe(false)
		expect(
			agentSkillSelectionSchema.safeParse({ name: 'generate-image', extra: true }).success,
		).toBe(false)
	})
})

describe('readSkillName', () => {
	it('문자열 name이 있는 객체에서만 이름을 읽는다', () => {
		expect(readSkillName({ name: 'generate-image', description: '설명' })).toBe(
			'generate-image',
		)
		expect(readSkillName({ name: 7 })).toBeNull()
		expect(readSkillName({})).toBeNull()
		expect(readSkillName(null)).toBeNull()
		expect(readSkillName('generate-image')).toBeNull()
	})
})
