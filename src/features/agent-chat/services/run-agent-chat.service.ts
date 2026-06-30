import type { ModelMessage, streamText, ToolSet } from 'ai'
import {
	type GetAgentGuidelineContext,
	GetAgentGuidelineContextService,
} from './get-agent-guideline-context.service'
import { getAgentTools } from './get-agent-tools.service'
import { StreamAgentAnswerService } from './stream-agent-answer.service'

export interface AgentAnswerInput {
	messages: ModelMessage[]
	context?: string
	tools: ToolSet
}

export interface AgentAnswerStream {
	stream: ReturnType<typeof streamText>['stream']
}

export interface AgentAnswerService {
	streamAnswer(input: AgentAnswerInput): Promise<AgentAnswerStream>
}

export interface RunAgentChatInput {
	messages: ModelMessage[]
	pagePath?: string
	user?: unknown
}

/**
 * Chat route는 입력 검증만 맡고, 답변 스트림 생성은 이 서비스로 위임한다.
 * 모델 호출은 AgentAnswerService가, guideline 저장소 접근은 주입된 context service가 담당한다.
 */
export class RunAgentChatService {
	constructor(private readonly agentAnswerService: AgentAnswerService) {}

	async execute(input: RunAgentChatInput): Promise<AgentAnswerStream> {
		if (input.messages.length === 0) {
			throw new Error('At least one message is required.')
		}

		return this.agentAnswerService.streamAnswer({
			messages: input.messages,
			context: input.pagePath ? `Current guideline page: ${input.pagePath}` : undefined,
			tools: getAgentTools({
				getAgentGuidelineContextService: createPayloadAgentGuidelineContext(input.user),
			}),
		})
	}
}

function createPayloadAgentGuidelineContext(user: unknown): GetAgentGuidelineContext {
	return new GetAgentGuidelineContextService(user)
}

export const runAgentChatService = new RunAgentChatService(new StreamAgentAnswerService())
