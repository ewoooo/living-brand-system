import type { ModelMessage } from 'ai'
import { describe, expect, it } from 'vitest'
import type {
	AgentAnswerInput,
	AgentAnswerStream,
	AgentRepository,
} from '@/repositories/agent.repository'
import { GenerateAnswerService } from '@/services/generate-answer.service'

class FakeAgentRepository implements AgentRepository {
	input?: AgentAnswerInput

	async streamAnswer(input: AgentAnswerInput): Promise<AgentAnswerStream> {
		this.input = input

		return {} as AgentAnswerStream
	}
}

describe('GenerateAnswerService', () => {
	it('rejects empty messages', async () => {
		const service = new GenerateAnswerService(new FakeAgentRepository())

		await expect(service.execute({ messages: [] })).rejects.toThrow(
			'At least one message is required.',
		)
	})

	it('passes page context to the agent repository', async () => {
		const repository = new FakeAgentRepository()
		const service = new GenerateAnswerService(repository)
		const messages = [{ role: 'user', content: 'How do I use this?' }] as ModelMessage[]

		await service.execute({ messages, pagePath: '/guideline/logo' })

		expect(repository.input).toEqual({
			messages,
			context: 'Current guideline page: /guideline/logo',
			user: undefined,
		})
	})

	it('passes user context to the agent repository', async () => {
		const repository = new FakeAgentRepository()
		const service = new GenerateAnswerService(repository)
		const messages = [{ role: 'user', content: 'Find logo rules.' }] as ModelMessage[]
		const user = { id: 1, collection: 'users' }

		await service.execute({ messages, user })

		expect(repository.input).toEqual({
			messages,
			context: undefined,
			user,
		})
	})
})
