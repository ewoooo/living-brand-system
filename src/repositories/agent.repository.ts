import type { ModelMessage, streamText } from 'ai'

export interface AgentAnswerInput {
	messages: ModelMessage[]
	context?: string
	user?: unknown
}

export interface AgentAnswerStream {
	stream: ReturnType<typeof streamText>['stream']
}

export interface AgentRepository {
	streamAnswer(input: AgentAnswerInput): Promise<AgentAnswerStream>
}
