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

	streamAnswer(input: AgentAnswerInput): AgentAnswerStream {
		this.input = input

		return {} as AgentAnswerStream
	}
}

describe('GenerateAnswerService', () => {
	it('rejects empty messages', () => {
		const service = new GenerateAnswerService(new FakeAgentRepository())

		expect(() => service.execute({ messages: [] })).toThrow('At least one message is required.')
	})

	it('passes page context to the agent repository', () => {
		const repository = new FakeAgentRepository()
		const service = new GenerateAnswerService(repository)
		const messages = [{ role: 'user', content: 'How do I use this?' }] as ModelMessage[]

		service.execute({ messages, pagePath: '/guideline/logo' })

		expect(repository.input).toEqual({
			messages,
			context: 'Current guideline page: /guideline/logo',
		})
	})
})
