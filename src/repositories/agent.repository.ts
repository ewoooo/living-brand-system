import type { ModelMessage, streamText } from 'ai'

export interface AgentAnswerInput {
	messages: ModelMessage[]
	context?: string
}

export type AgentAnswerStream = ReturnType<typeof streamText>

export interface AgentRepository {
	streamAnswer(input: AgentAnswerInput): AgentAnswerStream
}
