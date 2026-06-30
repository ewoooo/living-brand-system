import { describe, expect, it } from 'vitest'
import type { AgentChatMessage } from '@/features/agent-chat/agent-chat-agent'
import {
	getAgentToolMarker,
	getAgentToolMarkerText,
} from '@/features/agent-chat/get-agent-tool-marker'
import { getAgentChatErrorMessage } from '@/features/agent-chat/hooks/use-agent-chat'

describe('agent chat errors', () => {
	it('uses JSON response messages', async () => {
		const response = Response.json({ message: 'Unauthorized' }, { status: 401 })

		await expect(getAgentChatErrorMessage(response)).resolves.toBe('Unauthorized')
	})

	it('falls back to status text', async () => {
		const response = new Response('nope', { status: 500, statusText: 'Internal Server Error' })

		await expect(getAgentChatErrorMessage(response)).resolves.toBe('Internal Server Error')
	})

	it('summarizes guideline search tool results as marker text', () => {
		const message = {
			id: '1',
			role: 'assistant',
			parts: [
				{
					type: 'tool-searchGuidelines',
					toolCallId: 'tool-1',
					state: 'output-available',
					input: { query: 'brand core' },
					output: [
						{ title: 'Brand Core', collection: 'guideline-pages', id: '1' },
						{ title: 'Identity', collection: 'guideline-pages', id: '2' },
					],
				},
			],
		} as AgentChatMessage

		expect(getAgentToolMarkerText(message)).toBe('가이드라인 결과 2개를 찾았습니다')
	})

	it('summarizes guideline page list tool results as marker text', () => {
		const message = {
			id: '1',
			role: 'assistant',
			parts: [
				{
					type: 'tool-listGuidelinePages',
					toolCallId: 'tool-1',
					state: 'output-available',
					input: {},
					output: [
						{ title: 'Core', pages: [{ id: '1', title: 'Narrative' }] },
						{ title: 'Name', pages: [] },
					],
				},
			],
		} as AgentChatMessage

		expect(getAgentToolMarkerText(message)).toBe('가이드라인 섹션 2개를 확인했습니다')
	})

	it('shimmers tool markers until output is available', () => {
		const message = {
			id: '1',
			role: 'assistant',
			parts: [
				{
					type: 'tool-searchGuidelines',
					toolCallId: 'tool-1',
					state: 'input-available',
					input: { query: 'brand core' },
				},
			],
		} as AgentChatMessage

		expect(getAgentToolMarker(message)).toEqual({
			isPending: true,
			text: '가이드라인을 찾고 있습니다',
		})
	})

	it('stops shimmering when tool output is available', () => {
		const message = {
			id: '1',
			role: 'assistant',
			parts: [
				{
					type: 'tool-searchGuidelines',
					toolCallId: 'tool-1',
					state: 'output-available',
					input: { query: 'brand core' },
					output: [],
				},
			],
		} as AgentChatMessage

		expect(getAgentToolMarker(message)).toEqual({
			isPending: false,
			text: '가이드라인 검색을 완료했습니다',
		})
	})
})
