// ponytail: essenherb R&D(2026-04-08, 이우성)에서 검증된 "Context Rules JSON" 방식의 데이터.
// 브랜드 레퍼런스를 사전에 base(브랜드 고정 스타일) + Scene(환경/구성)으로 JSON화해 두고,
// 생성 시 base⊕Scene⊕사용자 입력을 합쳐 프롬프트를 만든다. 데이터는 essenherb 원본 JSON을 그대로 옮긴 것.
// 브랜드별 데이터라 나중에 Brand Resource 컬렉션으로 이관 — 지금은 POC 하드코딩. [[brand-assets-hardcode-deferred]]

export type ImageSize = '1024x1024' | '1536x1024' | '1024x1536'

/** 브랜드 고정 스타일. 모든 Scene에 항상 얹힌다 (base_product.json). */
export const ESSENHERB_BASE = {
	style: 'minimalist editorial cosmetic photography with natural ingredient styling',
	lighting:
		'single hard key light from upper-left at 45 degrees, minimal fill, high-contrast chiaroscuro-inspired lighting with crisp defined shadows, strong specular highlights on the product surface, pronounced cast shadow on the ground',
	background: 'pure solid white, seamless, no gradient',
	mood: 'clean, premium, editorial, organic yet intentionally arranged, confident',
	technical:
		'deep depth of field with full sharpness across all elements, high-resolution with visible surface textures, commercial-grade retouching, high contrast ratio, rich blacks and bright highlights',
} as const

/** 환경/구성 컨텍스트. {product} 자리에 사용자가 입력한 대상이 들어간다. */
export type ImageScene = {
	id: string
	label: string
	ingredient: string
	composition: string
	camera: string
	relationship: string
	colorHarmony: string[]
	moodAccent: string
	size: ImageSize
}

// product_ingredient_scenes.json(QA 완료본)을 그대로 옮긴 12종. 전부 세로 프레임(1024x1536).
export const IMAGE_SCENES: ImageScene[] = [
	{
		id: 'driftwood',
		label: '유목 가지',
		ingredient: 'dried driftwood branch',
		composition:
			'vertical frame, product floating at a slight tilt above a weathered driftwood branch, product elevated and hero-centered',
		camera: 'eye-level, deep depth of field, full sharpness across product and branch',
		relationship:
			'product rests at the crook of a forked branch, branch extends from lower-right to upper-left as a natural pedestal',
		colorHarmony: ['weathered driftwood brown', 'warm wood grain tones'],
		moodAccent: 'luxurious and grounded',
		size: '1024x1536',
	},
	{
		id: 'snail-shells',
		label: '달팽이 껍데기',
		ingredient: 'oversized spiral snail shells',
		composition:
			'vertical frame, product sitting atop a vertical stack of three large spiral snail shells, centered',
		camera: 'slightly low angle looking up, deep depth of field, sharp focus on shell texture and product',
		relationship:
			"shells form a sculptural tower base, product crowns the top, shells' spiral texture echoes organic origin",
		colorHarmony: ['cream-brown shell striations', 'caramel swirl pattern'],
		moodAccent: 'sculptural and sophisticated',
		size: '1024x1536',
	},
	{
		id: 'red-pumpkin',
		label: '빨간 호박',
		ingredient: 'whole red pumpkin',
		composition:
			'vertical frame, product nestled diagonally against an oversized whole red pumpkin, product tilted and resting on the pumpkin curve, tight crop',
		camera: 'eye-level, deep depth of field, sharp focus on pumpkin skin texture',
		relationship:
			'product leans into the pumpkin natural curve, pumpkin dwarfs the product emphasizing raw ingredient potency',
		colorHarmony: ['deep crimson-red skin', 'orange flesh undertones'],
		moodAccent: 'bold and nourishing',
		size: '1024x1536',
	},
	{
		id: 'asparagus',
		label: '아스파라거스',
		ingredient: 'fresh asparagus stalks',
		composition:
			'vertical frame, product centered and upright, surrounded by five to six asparagus stalks standing vertically like a natural cage',
		camera: 'eye-level, moderate depth of field, sharp focus on product with asparagus tips slightly softer',
		relationship:
			'asparagus stalks frame the product on both sides, their purple-green tips extend above creating a crown effect',
		colorHarmony: ['vibrant forest green', 'purple asparagus tips'],
		moodAccent: 'fresh and vibrant',
		size: '1024x1536',
	},
	{
		id: 'halved-red-fruit',
		label: '반 자른 붉은 과일',
		ingredient: 'halved red fruit (pomegranate or red onion)',
		composition:
			'vertical frame, product standing upright, a halved deep-red fruit balanced on the cap, centered',
		camera: 'eye-level, deep depth of field, sharp focus on wet cross-section detail',
		relationship:
			'ingredient crowns the product, its wet cross-section faces camera revealing inner texture, juice slightly visible',
		colorHarmony: ['deep crimson-magenta', 'translucent red flesh'],
		moodAccent: 'rich and concentrated',
		size: '1024x1536',
	},
	{
		id: 'red-mineral-stone',
		label: '붉은 광물석',
		ingredient: 'massive red mineral stone, filling the entire lower half of the frame',
		composition:
			'vertical frame, product standing upright on a rough-textured red stone that dominates the bottom half of the image, slightly tilted back',
		camera: 'low angle looking up, deep depth of field, emphasizing product height and stone mass',
		relationship:
			'stone acts as a raw unpolished pedestal, product tip touches the stone surface creating a single contact point implying balance',
		colorHarmony: ['deep terracotta red', 'soft red-brown mineral grain'],
		moodAccent: 'earthy and potent',
		size: '1024x1536',
	},
	{
		id: 'faceted-red-rock',
		label: '각진 붉은 암석',
		ingredient: 'massive faceted red mineral rock, filling the entire lower half of the frame',
		composition:
			'vertical frame, product standing upright on a single angular red rock that dominates the bottom half of the image, centered',
		camera: 'eye-level, deep depth of field, sharp highlight on rock facets',
		relationship:
			'product sits on a geological base, rock faceted surface catches light emphasizing mineral origin',
		colorHarmony: ['copper-red mineral', 'dark iron-brown facets'],
		moodAccent: 'grounded and raw',
		size: '1024x1536',
	},
	{
		id: 'dried-hibiscus',
		label: '말린 히비스커스',
		ingredient: 'two to three dried red hibiscus flowers, compact cluster',
		composition:
			'vertical frame, product floating diagonally in the center of frame filling upper two-thirds, suspended in mid-air, nozzle tip pointing down toward a small cluster of dried hibiscus below, tight crop',
		camera: 'eye-level, moderate depth of field, sharp focus on product with flowers slightly softer',
		relationship:
			'product nozzle presses into the dried flowers as if dispensing, the flowers are a small accent at the contact point not scattered, product dominates the frame',
		colorHarmony: ['deep dried crimson', 'translucent papery petals'],
		moodAccent: 'botanical and therapeutic',
		size: '1024x1536',
	},
	{
		id: 'sliced-red-fruit',
		label: '붉은 과일 슬라이스',
		ingredient: 'sliced red fruit (plum or red kiwi)',
		composition:
			'vertical frame, product standing on a stack of three to four fruit slices arranged in a slight cascade, centered',
		camera: 'eye-level, deep depth of field, sharp focus on wet fruit cross-sections',
		relationship:
			'fruit slices form a layered pedestal, their wet cross-sections show vivid interior, slight juice pooling at base',
		colorHarmony: ['deep red fruit skin', 'pale pink flesh', 'dark seed center'],
		moodAccent: 'juicy and luminous',
		size: '1024x1536',
	},
	{
		id: 'aloe',
		label: '알로에',
		ingredient: 'sliced aloe vera leaves',
		composition:
			'vertical frame, product centered with three to four thick aloe slices stacked and leaning against the base, translucent gel dripping down',
		camera: 'eye-level, deep depth of field, macro-level detail on gel transparency and drip',
		relationship:
			'aloe gel visibly oozes from cut surfaces, pooling at the base, raw mucilage connects ingredient to product',
		colorHarmony: ['translucent aloe gel', 'deep leaf green skin'],
		moodAccent: 'hydrating and visceral',
		size: '1024x1536',
	},
	{
		id: 'green-leaf',
		label: '초록 잎 (매크로)',
		ingredient: 'single fresh green leaf',
		composition:
			'extreme vertical close-up, product tip filling lower two-thirds of frame, a single fresh leaf floating just above, centered',
		camera: 'macro close-up, shallow depth of field, razor-sharp focus on leaf veins with soft product blur beneath',
		relationship:
			'minimal contact — leaf hovers or barely touches the product surface, suggesting lightness and natural purity',
		colorHarmony: ['vivid leaf green', 'subtle vein detail'],
		moodAccent: 'delicate and pure',
		size: '1024x1536',
	},
	{
		id: 'translucent-petal',
		label: '반투명 꽃잎 (매크로)',
		ingredient: 'single translucent flower petal',
		composition:
			'extreme vertical close-up, product tip filling lower two-thirds of frame, a single translucent petal drifting above, centered',
		camera: 'macro close-up, very shallow depth of field, petal edges sharp with dreamy falloff',
		relationship:
			'petal floats above with minimal distance, its translucency and soft form echo a gentle texture',
		colorHarmony: ['translucent ivory-yellow', 'soft petal edge gradient'],
		moodAccent: 'ethereal and gentle',
		size: '1024x1536',
	},
	{
		id: 'soil-sprouts',
		label: '흙과 새싹',
		ingredient:
			'dark soil with oversized sprouting plants, thick stalks with round fruits or buds at the tips',
		composition:
			'vertical frame, a wide horizontal mound of dark soil across the lower third of the frame, product half-buried in the center of the soil mound, three to four thick oversized plant stalks rising above the product',
		camera: 'eye-level with the soil horizon line, deep depth of field, sharp focus across product and plants',
		relationship:
			'product is partially submerged in soil up to its lower third, roots visible at the soil surface, oversized plant stalks grow from the soil and tower over the product',
		colorHarmony: ['dark rich soil', 'fresh green sprouts', 'exposed pale roots'],
		moodAccent: 'rooted and alive',
		size: '1024x1536',
	},
]

const DEFAULT_SCENE = IMAGE_SCENES[0]

/** sceneId로 Scene을 찾는다. 'auto'/미지정/미매칭이면 null (상위에서 자동 선택). */
export function resolveScene(sceneId?: string): ImageScene | null {
	if (!sceneId || sceneId === 'auto') return null
	return IMAGE_SCENES.find((scene) => scene.id === sceneId) ?? null
}

/** LLM 없이 사용자 입력의 키워드를 Scene id/label/ingredient에 매칭. 없으면 첫 Scene. */
export function pickSceneByKeyword(userInput: string): ImageScene {
	const text = userInput.toLowerCase()
	return (
		IMAGE_SCENES.find(
			(scene) =>
				text.includes(scene.label.toLowerCase()) ||
				scene.id.split('-').some((word) => text.includes(word)) ||
				scene.ingredient
					.toLowerCase()
					.split(/[^a-z]+/)
					.some((word) => word.length > 3 && text.includes(word)),
		) ?? DEFAULT_SCENE
	)
}

/**
 * 사용자 입력(+선택 Scene) → 이미지 생성 요청(프롬프트·size·적용 씬). LLM 없이 결정론으로 합성한다.
 * - free: 브랜드 base/Scene 없이 입력 프롬프트 원문(제품컷 외 이미지용).
 * - 그 외: sceneId로 Scene을 찾거나(auto/미매칭은 키워드 자동 선택) base⊕Scene⊕입력을 합친다.
 */
export function composeImageRequest(
	userInput: string,
	sceneId?: string,
): { prompt: string; size: ImageSize; sceneId: string } {
	if (sceneId === 'free') {
		return { prompt: userInput.trim(), size: '1024x1024', sceneId: 'free' }
	}
	const scene = resolveScene(sceneId) ?? pickSceneByKeyword(userInput)
	return { prompt: composeScenePrompt(scene, userInput), size: scene.size, sceneId: scene.id }
}

/**
 * base⊕Scene⊕사용자 입력 → 결정론적 생성 프롬프트.
 * 사용자 입력은 hero product 자리에 들어가고, Scene이 환경/구성을 씌운다.
 */
export function composeScenePrompt(scene: ImageScene, subject: string): string {
	return [
		`${ESSENHERB_BASE.style}.`,
		`The hero product is ${subject.trim()}, rendered as a branded cosmetic bottle.`,
		`${scene.composition}.`,
		`${scene.relationship}.`,
		`${scene.camera}.`,
		`${ESSENHERB_BASE.lighting}.`,
		`Background: ${ESSENHERB_BASE.background}.`,
		`Color harmony: ${scene.colorHarmony.join(', ')}, limited to a few hues plus white.`,
		`Mood: ${ESSENHERB_BASE.mood}, ${scene.moodAccent}.`,
		`${ESSENHERB_BASE.technical}.`,
	].join(' ')
}
