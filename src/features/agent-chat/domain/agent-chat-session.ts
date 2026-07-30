import {
	type AgentChatSessionUsageSnapshot,
	type AgentChatSessionUsageStep,
	createAgentChatSessionUsageCollector,
} from '@/features/agent-chat/domain/agent-chat-session-usage'
import type {
	AgentChatAiUsage,
	AgentChatSessionMessageInput,
	AgentChatSessionUsage,
	AgentChatTriage,
} from '@/features/agent-chat/types'

export type AgentChatSessionStatus = 'running' | 'completed' | 'failed'

/** 종결(completed/failed)된 세션에 전이를 시도했을 때의 방어선. 정상 경로에서는 나오지 않는다. */
export class AgentChatSessionStateError extends Error {}

export interface AgentChatSessionUpdateData {
	status: AgentChatSessionStatus
	messages: AgentChatSessionMessageInput[]
	messageCount: number
	usedTools: AgentChatSessionUsage[]
	usedSkills: AgentChatSessionUsage[]
	aiUsage?: AgentChatAiUsage
	triage?: AgentChatTriage
	errorMessage?: string
	completedAt?: string
}

/**
 * Agent 채팅 세션 Aggregate — running → completed/failed 전이와 스텝 누적을 소유한다.
 * 스텝 기록은 메모리에만 쌓고 DB 쓰기는 종결 전이 후 1회다. 저장 변환은 repository만 수행한다.
 * fromRecord(복원)는 두지 않는다 — 세션 생명주기가 한 요청 안에서 끝난다.
 */
export class AgentChatSession {
	private _status: AgentChatSessionStatus = 'running'
	private _assistantText = ''
	private _errorMessage: string | undefined
	private _completedAt: string | undefined
	private readonly _usage = createAgentChatSessionUsageCollector()

	private constructor(
		readonly id: number,
		readonly assistantMessageId: string,
		private readonly _requestMessages: AgentChatSessionMessageInput[],
	) {}

	static start(input: {
		id: number
		assistantMessageId: string
		requestMessages: AgentChatSessionMessageInput[]
	}): AgentChatSession {
		return new AgentChatSession(input.id, input.assistantMessageId, [...input.requestMessages])
	}

	get status() {
		return this._status
	}

	get isTerminal() {
		return this._status !== 'running'
	}

	/** 스트림 스텝 1회분을 메모리에 누적한다. DB 쓰기는 하지 않는다. */
	recordStep(input: { step: AgentChatSessionUsageStep; text?: string }): void {
		this.assertRunning('recordStep')
		if (input.text) this._assistantText = input.text
		this._usage.addStep(input.step)
	}

	complete(): void {
		this.assertRunning('complete')
		this._status = 'completed'
		this._completedAt = new Date().toISOString()
	}

	fail(errorMessage: string): void {
		this.assertRunning('fail')
		this._status = 'failed'
		this._errorMessage = errorMessage
		this._completedAt = new Date().toISOString()
	}

	/** Repository 전용 — 저장 필드만 뽑는다. assistant 메시지는 이 시점에 조건부 합성한다. */
	toUpdateData(): AgentChatSessionUpdateData {
		const usage = this._usage.snapshot()
		const messages = this.toMessages(usage)

		return {
			status: this._status,
			messages,
			messageCount: messages.length,
			usedTools: usage.usedTools,
			usedSkills: usage.usedSkills,
			aiUsage: usage.aiUsage,
			triage: usage.triage,
			errorMessage: this._errorMessage,
			completedAt: this._completedAt,
		}
	}

	private toMessages(usage: AgentChatSessionUsageSnapshot): AgentChatSessionMessageInput[] {
		if (
			!this._assistantText &&
			!usage.aiUsage &&
			usage.usedTools.length === 0 &&
			usage.usedSkills.length === 0
		) {
			return this._requestMessages
		}

		return [
			...this._requestMessages,
			{
				messageId: this.assistantMessageId,
				role: 'assistant',
				text: this._assistantText,
				usedTools: usage.usedTools,
				usedSkills: usage.usedSkills,
				aiUsage: usage.aiUsage,
			},
		]
	}

	private assertRunning(action: string): void {
		if (this._status !== 'running') {
			throw new AgentChatSessionStateError(
				`${action}: session is ${this._status}, not running`,
			)
		}
	}
}
