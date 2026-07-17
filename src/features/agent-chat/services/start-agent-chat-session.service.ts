import type { AgentChatMessage } from '@/agents/agent-chat.agent'
import { AgentChatSession } from '@/features/agent-chat/domain/agent-chat-session'
import type { AgentChatSessionUsageStep } from '@/features/agent-chat/domain/agent-chat-session-usage'
import {
	createAgentChatSessionRecord,
	saveAgentChatSessionRecord,
} from '@/features/agent-chat/repositories/agent-chat-session.payload.repository'
import { backfillAgentChatSessionMessages } from '@/features/agent-chat/services/backfill-agent-chat-session-messages.service'
import type { AgentChatSessionMessageInput } from '@/features/agent-chat/types'
import { getAgentMessageText } from '@/features/agent-chat/utils/get-agent-message-parts'
import type { User } from '@/payload-types'

export interface StartAgentChatSessionInput {
	messages: AgentChatMessage[]
	pagePath?: string
	user: User
}

/**
 * Agent 채팅 세션을 시작하고 스트림 실행 기록을 저장하는 유스케이스.
 * 생성 전에 히스토리 assistant 메시지의 실행 메타데이터를 직전 레코드에서 백필한다(합본 체인).
 * 전이와 스텝 누적은 AgentChatSession Aggregate가 소유한다. 스트림 스텝은 메모리에만
 * 누적하고 DB에는 생성 1회와 종결(completed/failed) 후 정상 경로 1회만 저장한다.
 * 저장 I/O는 agent-chat-session repository가 소유한다.
 * 종결 후 recordStep은 no-op이며, fail/finalize는 미저장 terminal 상태만 같은 값으로 재시도한다.
 * 완료된 세션을 뒤집지 않으면서 일시적인 종결 저장 실패가 running 레코드를 남기지 않게 한다.
 * 스텝 상한처럼 completed 신호 없이 끝나는 턴은 finalize()가 스트림 종료 시점에 종결 저장한다.
 */
export async function startAgentChatSession(input: StartAgentChatSessionInput) {
	const assistantMessageId = crypto.randomUUID()
	const requestMessages = await backfillAgentChatSessionMessages(
		toSessionMessages(input.messages),
		input.user,
	)
	const record = await createAgentChatSessionRecord({
		status: 'running',
		pagePath: input.pagePath,
		messageCount: requestMessages.length,
		messages: requestMessages,
		user: input.user,
	})
	const session = AgentChatSession.start({
		id: record.id,
		assistantMessageId,
		requestMessages,
	})
	let terminalPersisted = false
	let terminalSavePromise: Promise<void> | undefined
	const persistTerminal = async () => {
		if (terminalPersisted) return
		terminalSavePromise ??= saveTerminalWithRetry(session, input.user).then(() => {
			terminalPersisted = true
		})
		try {
			await terminalSavePromise
		} finally {
			if (!terminalPersisted) terminalSavePromise = undefined
		}
	}

	return {
		assistantMessageId,
		id: session.id,
		fail: async (errorMessage: string) => {
			if (!session.isTerminal) session.fail(errorMessage)
			await persistTerminal()
		},
		/** 스트림 종료 안전망 — 스텝 상한 등으로 completed 신호 없이 끝난 턴을 종결 저장한다. */
		finalize: async () => {
			if (!session.isTerminal) session.complete()
			await persistTerminal()
		},
		recordStep: async ({ step, text }: { step: AgentChatSessionUsageStep; text?: string }) => {
			if (session.isTerminal) return
			session.recordStep({ step, text })
		},
	}
}

async function saveTerminalWithRetry(session: AgentChatSession, user: User): Promise<void> {
	try {
		await saveAgentChatSessionRecord(session, user)
	} catch (error) {
		try {
			await saveAgentChatSessionRecord(session, user)
		} catch (retryError) {
			attachRetryCause(error, retryError)
			throw error
		}
	}
}

function attachRetryCause(error: unknown, retryError: unknown): void {
	if (!(error instanceof Error) || !Object.isExtensible(error)) return
	error.cause = retryError
}

function toSessionMessages(messages: AgentChatMessage[]): AgentChatSessionMessageInput[] {
	return messages.map((message) => ({
		messageId: message.metadata?.agentChatMessageId ?? message.id,
		role: message.role,
		text: getAgentMessageText(message),
		reaction: message.metadata?.reaction,
	}))
}
