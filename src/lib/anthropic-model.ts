import { anthropic } from '@ai-sdk/anthropic'
import { env } from '@/env'

const DEFAULT_MODEL = 'claude-haiku-4-5'

/** API 키가 없으면 null, 있으면 설정된 Anthropic 모델(기본 claude-haiku-4-5)을 돌려준다. */
export function anthropicTextModel() {
	if (!env.ANTHROPIC_API_KEY) return null
	return anthropic(env.ANTHROPIC_MODEL || DEFAULT_MODEL)
}
