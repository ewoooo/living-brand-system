import type { ModelMessage } from 'ai'

import type { AgentAnswerStream, AgentRepository } from '@/repositories/agent.repository'

export interface GenerateAnswerInput {
	messages: ModelMessage[]
	pagePath?: string
}

export class GenerateAnswerService {
	constructor(private readonly agentRepository: AgentRepository) {}

	execute(input: GenerateAnswerInput): AgentAnswerStream {
		if (input.messages.length === 0) {
			throw new Error('At least one message is required.')
		}

		return this.agentRepository.streamAnswer({
			messages: input.messages,
			context: input.pagePath ? `Current guideline page: ${input.pagePath}` : undefined,
		})
	}
}
