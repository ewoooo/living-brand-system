import { anthropic } from '@ai-sdk/anthropic'
import { generateText } from 'ai'
import { env } from '@/env'
import {
	composeScenePrompt,
	ESSENHERB_BASE,
	type ImageScene,
	type ImageSize,
	pickSceneByKeyword,
	resolveScene,
} from '@/features/image-generation/presets'

// essenherb R&D의 Text Decorator 단계. 짧고 추상적인 한국어 입력을 고정 브랜드 base + 선택 Scene과 합쳐
// 이미지 모델용 영어 프롬프트 한 개로 확장한다. 규격화된 Scene(사전 QA)만 쓰므로 생성이 안정적이다.
const DECORATOR_MODEL = 'claude-haiku-4-5'

const SYSTEM = [
	'You write ONE image-generation prompt for a branded cosmetic product photograph.',
	'Merge the fixed brand base style, the chosen scene, and the user subject into a single vivid English prompt of about 50-80 words.',
	'Keep the brand base style, lighting, and pure white seamless background exactly as given.',
	'Treat the user subject as the hero product (a branded cosmetic bottle). Translate Korean to English.',
	'Output only the prompt text — no quotes, labels, or preamble.',
].join(' ')

/**
 * 유스케이스 경계: 사용자 입력(+선택 Scene)을 받아 이미지 생성용 프롬프트와 size를 만든다.
 * 외부 I/O(Anthropic 호출)는 이 서비스가 소유하고, 하위 이미지 생성 서비스는 프로바이더 호출만 한다.
 * 키가 없거나 실패하면 결정론적 composeScenePrompt로 폴백한다.
 */
export async function buildImagePrompt({
	userInput,
	sceneId,
}: {
	userInput: string
	sceneId?: string
}): Promise<{ prompt: string; size: ImageSize; sceneId: string }> {
	// 자유 생성: 브랜드 base/Scene/제품 강제 없이 입력 프롬프트를 그대로 쓴다 (제품컷 외 이미지용).
	// ponytail: 우선 원문 그대로. 번역/보정이 필요해지면 여기서 가벼운 decorate만 추가.
	if (sceneId === 'free') {
		return { prompt: userInput.trim(), size: '1024x1024', sceneId: 'free' }
	}
	const scene = resolveScene(sceneId) ?? pickSceneByKeyword(userInput)
	const prompt = await decorate(scene, userInput)
	return { prompt, size: scene.size, sceneId: scene.id }
}

async function decorate(scene: ImageScene, userInput: string): Promise<string> {
	if (!env.ANTHROPIC_API_KEY) return composeScenePrompt(scene, userInput)
	try {
		const { text } = await generateText({
			model: anthropic(env.ANTHROPIC_MODEL || DECORATOR_MODEL),
			system: SYSTEM,
			prompt: [
				`Brand base:\n${JSON.stringify(ESSENHERB_BASE, null, 2)}`,
				`Scene:\n${JSON.stringify(sceneContext(scene), null, 2)}`,
				`User subject: ${userInput.trim()}`,
			].join('\n\n'),
		})
		return ensureBrandAnchors(text.trim() || composeScenePrompt(scene, userInput))
	} catch {
		return composeScenePrompt(scene, userInput)
	}
}

// base는 항상 얹혀야 한다(R&D). Decorator가 순백 배경 앵커를 빠뜨리면 값싸게 덧붙여 base drift를 막는다.
function ensureBrandAnchors(prompt: string): string {
	return /white/i.test(prompt) ? prompt : `${prompt} Background: ${ESSENHERB_BASE.background}.`
}

function sceneContext(scene: ImageScene) {
	const { id: _id, label: _label, size: _size, ...context } = scene
	return context
}
