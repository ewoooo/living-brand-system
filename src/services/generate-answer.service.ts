import type { ModelMessage } from 'ai'
import type { AgentAnswerStream, AgentRepository } from '@/repositories/agent.repository'
import { AnthropicAiRepository } from '@/repositories/anthropic-ai.repository'

export interface GenerateAnswerInput {
	messages: ModelMessage[]
	pagePath?: string
	user?: unknown
}

export class GenerateAnswerService {
	constructor(private readonly agentRepository: AgentRepository) {}

	async execute(input: GenerateAnswerInput): Promise<AgentAnswerStream> {
		if (input.messages.length === 0) {
			throw new Error('At least one message is required.')
		}

		return this.agentRepository.streamAnswer({
			messages: input.messages,
			context: input.pagePath ? `Current guideline page: ${input.pagePath}` : undefined,
			user: input.user,
		})
	}
}

export const generateAnswerService = new GenerateAnswerService(new AnthropicAiRepository())
