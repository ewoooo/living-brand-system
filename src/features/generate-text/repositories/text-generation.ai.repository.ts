import { generateText } from 'ai'
import { anthropicTextModel } from '@/lib/anthropic-model'

interface GenerateTextCandidateInput {
	prompt: string
	system: string
}

/** Anthropic 텍스트 생성 I/O와 provider 응답 정규화를 소유한다. */
export async function generateTextCandidate(
	input: GenerateTextCandidateInput,
): Promise<string | null> {
	const model = anthropicTextModel()
	if (!model) return null

	const result = await generateText({
		model,
		system: input.system,
		prompt: input.prompt,
		temperature: 1,
	})
	const text = result.text.trim()

	return text || null
}
