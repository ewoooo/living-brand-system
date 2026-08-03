/**
 * Essenherb 제품 이미지 프롬프트를 published 이미지 프로파일로 upsert한다.
 * 실행: pnpm payload run scripts/seed-essenherb-product-profile.ts
 */
import config from '@payload-config'
import { getPayload } from 'payload'

const candidates = (...values: string[]) => values.map((value) => ({ value }))

const data = {
	name: 'Essenherb Product',
	generateSlug: false,
	slug: 'essenherb-product',
	displayOrder: 0,
	imageModelPreset: 'google-nano-banana-2-lite' as const,
	aspectRatio: '2:3' as const,
	imageSize: '1K' as const,
	profilePrompt: [
		{
			key: 'style',
			value: 'minimalist editorial cosmetic photography with natural ingredient styling',
		},
		{
			key: 'lighting',
			value: 'single hard key light from upper-left at 45 degrees, minimal fill, high-contrast chiaroscuro-inspired lighting with crisp defined shadows, strong specular highlights on the product surface, pronounced cast shadow on the ground',
		},
		{
			key: 'background',
			value: 'pure solid white, seamless, no gradient',
		},
		{
			key: 'mood',
			value: 'clean, premium, editorial, organic yet intentionally arranged, confident',
		},
		{
			key: 'technical',
			value: 'deep depth of field with full sharpness across all elements, high-resolution with visible surface textures, commercial-grade retouching, high contrast ratio, rich blacks and bright highlights',
		},
	],
	userPromptNormalization: [
		{
			key: 'ingredient',
			candidates: candidates(
				'dried driftwood branch',
				'oversized spiral snail shells',
				'whole red pumpkin',
				'fresh asparagus stalks',
				'halved red fruit (pomegranate or red onion)',
				'massive red mineral stone, filling the entire lower half of the frame',
				'massive faceted red mineral rock, filling the entire lower half of the frame',
				'two to three dried red hibiscus flowers, compact cluster',
				'sliced red fruit (plum or red kiwi)',
				'sliced aloe vera leaves',
				'single fresh green leaf',
				'single translucent flower petal',
				'dark soil with oversized sprouting plants, thick stalks with round fruits or buds at the tips',
			),
		},
		{
			key: 'composition',
			candidates: candidates(
				'vertical frame, product floating at a slight tilt above a weathered driftwood branch, product elevated and hero-centered',
				'vertical frame, product sitting atop a vertical stack of three large spiral snail shells, centered',
				'vertical frame, product nestled diagonally against an oversized whole red pumpkin, product tilted and resting on the pumpkin curve, tight crop',
				'vertical frame, product centered and upright, surrounded by five to six asparagus stalks standing vertically like a natural cage',
				'vertical frame, product standing upright, a halved deep-red fruit balanced on the cap, centered',
				'vertical frame, product standing upright on a rough-textured red stone that dominates the bottom half of the image, slightly tilted back',
				'vertical frame, product standing upright on a single angular red rock that dominates the bottom half of the image, centered',
				'vertical frame, product floating diagonally in the center of frame filling upper two-thirds, suspended in mid-air, nozzle tip pointing down toward a small cluster of dried hibiscus below, tight crop',
				'vertical frame, product standing on a stack of three to four fruit slices arranged in a slight cascade, centered',
				'vertical frame, product centered with three to four thick aloe slices stacked and leaning against the base, translucent gel dripping down',
				'extreme vertical close-up, product tip filling lower two-thirds of frame, a single fresh leaf floating just above, centered',
				'extreme vertical close-up, product tip filling lower two-thirds of frame, a single translucent petal drifting above, centered',
				'vertical frame, a wide horizontal mound of dark soil across the lower third of the frame, product half-buried in the center of the soil mound, three to four thick oversized plant stalks rising above the product',
			),
		},
		{
			key: 'camera',
			candidates: candidates(
				'eye-level, deep depth of field, full sharpness across product and branch',
				'slightly low angle looking up, deep depth of field, sharp focus on shell texture and product',
				'eye-level, deep depth of field, sharp focus on pumpkin skin texture',
				'eye-level, moderate depth of field, sharp focus on product with asparagus tips slightly softer',
				'eye-level, deep depth of field, sharp focus on wet cross-section detail',
				'low angle looking up, deep depth of field, emphasizing product height and stone mass',
				'eye-level, deep depth of field, sharp highlight on rock facets',
				'eye-level, moderate depth of field, sharp focus on product with flowers slightly softer',
				'eye-level, deep depth of field, sharp focus on wet fruit cross-sections',
				'eye-level, deep depth of field, macro-level detail on gel transparency and drip',
				'macro close-up, shallow depth of field, razor-sharp focus on leaf veins with soft product blur beneath',
				'macro close-up, very shallow depth of field, petal edges sharp with dreamy falloff',
				'eye-level with the soil horizon line, deep depth of field, sharp focus across product and plants',
			),
		},
		{
			key: 'productIngredientRelationship',
			candidates: candidates(
				'product rests at the crook of a forked branch, branch extends from lower-right to upper-left as a natural pedestal',
				"shells form a sculptural tower base, product crowns the top, shells' spiral texture echoes organic origin",
				'product leans into the pumpkin natural curve, pumpkin dwarfs the product emphasizing raw ingredient potency',
				'asparagus stalks frame the product on both sides, their purple-green tips extend above creating a crown effect',
				'ingredient crowns the product, its wet cross-section faces camera revealing inner texture, juice slightly visible',
				'stone acts as a raw unpolished pedestal, product tip touches the stone surface creating a single contact point implying balance',
				'product sits on a geological base, rock faceted surface catches light emphasizing mineral origin',
				'product nozzle presses into the dried flowers as if dispensing, the flowers are a small accent at the contact point not scattered, product dominates the frame',
				'fruit slices form a layered pedestal, their wet cross-sections show vivid interior, slight juice pooling at base',
				'aloe gel visibly oozes from cut surfaces, pooling at the base, raw mucilage connects ingredient to product',
				'minimal contact — leaf hovers or barely touches the product surface, suggesting lightness and natural purity',
				'petal floats above with minimal distance, its translucency and soft form echo a gentle texture',
				'product is partially submerged in soil up to its lower third, roots visible at the soil surface, oversized plant stalks grow from the soil and tower over the product',
			),
		},
		{
			key: 'colorHarmony',
			candidates: candidates(
				'weathered driftwood brown, warm wood grain tones',
				'cream-brown shell striations, caramel swirl pattern',
				'deep crimson-red skin, orange flesh undertones',
				'vibrant forest green, purple asparagus tips',
				'deep crimson-magenta, translucent red flesh',
				'deep terracotta red, soft red-brown mineral grain',
				'copper-red mineral, dark iron-brown facets',
				'deep dried crimson, translucent papery petals',
				'deep red fruit skin, pale pink flesh, dark seed center',
				'translucent aloe gel, deep leaf green skin',
				'vivid leaf green, subtle vein detail',
				'translucent ivory-yellow, soft petal edge gradient',
				'dark rich soil, fresh green sprouts, exposed pale roots',
			),
		},
		{
			key: 'moodAccent',
			candidates: candidates(
				'luxurious and grounded',
				'sculptural and sophisticated',
				'bold and nourishing',
				'fresh and vibrant',
				'rich and concentrated',
				'earthy and potent',
				'grounded and raw',
				'botanical and therapeutic',
				'juicy and luminous',
				'hydrating and visceral',
				'delicate and pure',
				'ethereal and gentle',
				'rooted and alive',
			),
		},
	],
	_status: 'published' as const,
}

const payload = await getPayload({ config })
const existing = await payload.find({
	collection: 'image-profiles',
	where: { slug: { equals: data.slug } },
	limit: 1,
	draft: true,
})

if (existing.docs[0]) {
	await payload.update({
		collection: 'image-profiles',
		id: existing.docs[0].id,
		data,
		draft: false,
	})
	console.log(`updated: ${data.name}`)
} else {
	await payload.create({
		collection: 'image-profiles',
		data,
		draft: false,
	})
	console.log(`created: ${data.name}`)
}

process.exit(0)
