// ponytail: essenherb 가이드라인(imagery.* 규칙 + 팔레트)에서 뽑은 샘플 프리셋.
// 브랜드별 데이터라 나중에 Brand Resource 컬렉션으로 이관 — 지금은 POC 하드코딩. [[brand-assets-hardcode-deferred]]

export type ImageSize = '1024x1024' | '1536x1024' | '1024x1536'

export type ImagePreset = {
	id: string
	label: string
	/** {input} 자리에 사용자 입력이 합성됨. */
	promptTemplate: string
	size: ImageSize
}

// imagery.background.tone(밝은 무채색) + imagery.composition(대담한 프레이밍)
// + imagery.treatment.spec(색보정·조명·배경톤) + 팔레트(coral #ea5343) 를 공통 스타일로.
const STYLE =
	'bright achromatic (white/light-neutral) background, bold framing, soft natural lighting, ' +
	'muted low-saturation palette with a coral accent (#ea5343), clean and airy mood'

// 카테고리는 imagery.*.classification(광고/SNS/사진/stationery)에 대응.
export const IMAGE_PRESETS: ImagePreset[] = [
	{
		id: 'sns',
		label: 'SNS 정사각',
		promptTemplate: `Social media square image. {input}. ${STYLE}.`,
		size: '1024x1024',
	},
	{
		id: 'advertisement',
		label: '광고 가로 배너',
		promptTemplate: `Wide advertising banner, top-aligned with copy space. {input}. ${STYLE}.`,
		size: '1536x1024',
	},
	{
		id: 'photography',
		label: '제품·라이프스타일 사진',
		promptTemplate: `Product and lifestyle photograph. {input}. ${STYLE}, diverse models with restrained natural expressions.`,
		size: '1024x1024',
	},
	{
		id: 'stationery',
		label: '세로 스테이셔너리',
		promptTemplate: `Portrait stationery/print visual. {input}. ${STYLE}.`,
		size: '1024x1536',
	},
]

const DEFAULT_SIZE: ImageSize = '1024x1024'

/** presetId + 사용자 입력 → 실제 생성 프롬프트와 size. preset 없으면 입력을 그대로 쓴다. */
export function composeImageRequest(
	userInput: string,
	presetId?: string,
): { prompt: string; size: ImageSize } {
	const preset = presetId ? IMAGE_PRESETS.find((p) => p.id === presetId) : undefined
	if (!preset) return { prompt: userInput, size: DEFAULT_SIZE }
	return { prompt: preset.promptTemplate.replace('{input}', userInput), size: preset.size }
}
