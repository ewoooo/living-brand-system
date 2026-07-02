import type { AgentChatMessage } from '../services/create-agent-chat-response.service'

export function getAgentMessageText(message: AgentChatMessage) {
	const text = message.parts.reduce(
		(text, part) => (part.type === 'text' ? text + part.text : text),
		'',
	)

	return message.role === 'assistant' ? (getStructuredAnswer(text) ?? text) : text
}

function getStructuredAnswer(text: string): string | null {
	if (!text.trim().startsWith('{')) {
		return null
	}

	try {
		const output = JSON.parse(text) as { answer?: unknown }
		return typeof output.answer === 'string' ? output.answer : null
	} catch {
		return getPartialStructuredAnswer(text)
	}
}

function getPartialStructuredAnswer(text: string): string | null {
	const match = /"answer"\s*:\s*"/.exec(text)
	if (!match) {
		return null
	}

	const start = match.index + match[0].length
	let answer = ''
	let escaped = false

	for (let i = start; i < text.length; i++) {
		const char = text[i]

		if (escaped) {
			answer += char === 'n' ? '\n' : char
			escaped = false
			continue
		}

		if (char === '\\') {
			escaped = true
			continue
		}

		if (char === '"') {
			break
		}

		answer += char
	}

	return answer
}
