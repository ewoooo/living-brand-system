import type { ModelMessage } from 'ai'
import type { AgentAnswerStream, AgentRepository } from '@/repositories/agent.repository'
import { AnthropicAiRepository } from '@/repositories/anthropic-ai.repository'

export interface GenerateAnswerInput {
	messages: ModelMessage[]
	pagePath?: string
	user?: unknown
}

/**
 * Chat route는 입력 검증만 맡고, 답변 스트림 생성은 이 서비스로 위임한다.
 * 실제 모델 호출과 guideline 검색은 AgentRepository 구현체가 담당한다.
 */
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
