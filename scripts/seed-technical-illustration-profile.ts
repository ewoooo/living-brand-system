/**
 * HD Hyundai 기술 일러스트 프롬프트를 published 이미지 프로파일로 upsert한다.
 * 실행: pnpm payload run scripts/seed-technical-illustration-profile.ts
 */
import config from '@payload-config'
import { getPayload } from 'payload'

const data = {
	name: 'Technical Illustration',
	generateSlug: false,
	slug: 'technical-illustration',
	displayOrder: 10,
	outputSizePreset: 'landscape' as const,
	profilePrompt: [
		{
			key: 'identity',
			value: `Thousands of short horizontal dashed lines.
Follow the contours of the object.
Uniform dash spacing.
Consistent visual density.
Minimal engineering expression.`,
		},
		{
			key: 'style',
			value: `Professional technical illustration.
3D wireframe style.
CAD drawing aesthetic.
Minimalist line art.
High contrast.`,
		},
		{
			key: 'color',
			value: 'High contrast Black (#000000) dashed lines on a Solid White (#FFFFFF) background. Maximum line density.',
		},
		{
			key: 'composition',
			value: `ISO-metric view.
Centered composition.
Aspect ratio 16:9.
Single object.`,
		},
		{
			key: 'output',
			value: `Generate one illustration only.
Keep the object fully visible.
Maintain crisp edges.
High-resolution output.`,
		},
		{
			key: 'rules',
			value: `DO
- Preserve contour accuracy.
- Maintain consistent dash spacing.
- Prioritize style consistency over creativity.

DON'T
- No solid lines.
- No gradients.
- No shadows.
- No realistic textures.
- No background elements.
- No typography.
- No logos.
- No decorative graphics.`,
		},
	],
	userPromptNormalization: [],
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
