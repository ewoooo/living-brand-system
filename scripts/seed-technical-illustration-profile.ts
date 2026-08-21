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
	imageModelPreset: 'google-nano-banana-2-lite' as const,
	aspectRatio: '16:9' as const,
	imageSize: '1K' as const,
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
			value: `Centered composition.
Aspect ratio 16:9.
Single object.`,
		},
		{
			key: 'camera',
			value: `Isometric three-quarter view.
Slightly elevated camera.
Orthographic projection.`,
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
	depth: 0,
	where: { slug: { equals: data.slug } },
	limit: 1,
	draft: true,
})

// 미리보기 이미지는 필수다. 이 시드가 고를 수 있는 정답이 없으므로 이미 붙어 있는 값을 지키고,
// 없을 때만 published 브랜드 이미지 중 첫 장을 임시로 붙인다 — 실제 이미지는 어드민이 바꾼다.
const current = existing.docs[0]?.previewImage
const previewImage =
	typeof current === 'object' && current !== null
		? current.id
		: (current ?? (await pickFallbackPreviewImage()))

async function pickFallbackPreviewImage() {
	const images = await payload.find({
		collection: 'application-images',
		depth: 0,
		limit: 1,
		select: { filename: true },
		sort: '-updatedAt',
		where: { _status: { equals: 'published' } },
	})
	const image = images.docs[0]
	if (!image) {
		throw new Error(
			'미리보기 이미지로 쓸 published 브랜드 이미지가 없습니다. 어드민에서 한 장 업로드한 뒤 다시 실행하세요.',
		)
	}
	console.log(`previewImage 임시 지정: application-images#${image.id} (${image.filename})`)
	return image.id
}

if (existing.docs[0]) {
	await payload.update({
		collection: 'image-profiles',
		id: existing.docs[0].id,
		data: { ...data, previewImage },
		draft: false,
	})
	console.log(`updated: ${data.name}`)
} else {
	await payload.create({
		collection: 'image-profiles',
		data: { ...data, previewImage },
		draft: false,
	})
	console.log(`created: ${data.name}`)
}

process.exit(0)
