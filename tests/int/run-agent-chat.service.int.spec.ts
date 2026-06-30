import type { ModelMessage } from 'ai'
import { describe, expect, it } from 'vitest'
import type {
	AgentAnswerInput,
	AgentAnswerService,
	AgentAnswerStream,
} from '@/features/agent-chat/services/run-agent-chat.service'
import { RunAgentChatService } from '@/features/agent-chat/services/run-agent-chat.service'

class FakeAgentAnswerService implements AgentAnswerService {
	input?: AgentAnswerInput

	async streamAnswer(input: AgentAnswerInput): Promise<AgentAnswerStream> {
		this.input = input

		return {} as AgentAnswerStream
	}
}

describe('RunAgentChatService', () => {
	it('rejects empty messages', async () => {
		const service = new RunAgentChatService(new FakeAgentAnswerService())

		await expect(service.execute({ messages: [] })).rejects.toThrow(
			'At least one message is required.',
		)
	})

	it('passes page context to the answer service', async () => {
		const answerService = new FakeAgentAnswerService()
		const service = new RunAgentChatService(answerService)
		const messages = [{ role: 'user', content: 'How do I use this?' }] as ModelMessage[]

		await service.execute({ messages, pagePath: '/guideline/logo' })

		expect(answerService.input).toMatchObject({
			messages,
			context: 'Current guideline page: /guideline/logo',
		})
		expect(answerService.input).not.toHaveProperty('user')
		expect(answerService.input?.tools).toHaveProperty('searchGuidelines')
	})

	it('passes user context to the answer service', async () => {
		const answerService = new FakeAgentAnswerService()
		const service = new RunAgentChatService(answerService)
		const messages = [{ role: 'user', content: 'Find logo rules.' }] as ModelMessage[]
		const user = { id: 1, collection: 'users' }

		await service.execute({ messages, user })

		expect(answerService.input).toMatchObject({
			messages,
			context: undefined,
		})
		expect(answerService.input).not.toHaveProperty('user')
		expect(answerService.input?.tools).toHaveProperty('readGuidelineDocument')
	})
})
