import { anthropic } from '@ai-sdk/anthropic'
import { generateText } from 'ai'
import { env } from '@/env'

const DEFAULT_MODEL = 'claude-haiku-4-5'

interface GenerateTextCandidateInput {
	prompt: string
	system: string
}

/** Anthropic 텍스트 생성 I/O와 provider 응답 정규화를 소유한다. */
export async function generateTextCandidate(
	input: GenerateTextCandidateInput,
): Promise<string | null> {
	if (!env.ANTHROPIC_API_KEY) return null

	const result = await generateText({
		model: anthropic(env.ANTHROPIC_MODEL || DEFAULT_MODEL),
		system: input.system,
		prompt: input.prompt,
		temperature: 1,
	})
	const text = result.text.trim()

	return text || null
}
