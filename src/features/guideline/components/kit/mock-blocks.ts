import type { ApplicationImage, BrandColor, GuidelineDocument } from '@/payload-types'

// 갤러리 전용 mock 빌더 — 실제 블록 renderer가 요구하는 Payload 타입을 그대로 강제해,
// 스키마가 바뀌면 갤러리가 컴파일 에러로 먼저 깨지게 한다. 제품 코드에서 import하지 않는다.
export type GuidelineBlock = NonNullable<GuidelineDocument['blocks']>[number]

export function placeholderImage(label: string, id = 1): ApplicationImage {
	return {
		id,
		alt: label,
		url: `data:image/svg+xml,${encodeURIComponent(
			`<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="640" height="360" fill="#d4d4d4"/><text x="320" y="188" font-family="sans-serif" font-size="28" fill="#737373" text-anchor="middle">${label}</text></svg>`,
		)}`,
		updatedAt: '',
		createdAt: '',
	} as ApplicationImage
}

type RichTextBody = NonNullable<
	NonNullable<Extract<GuidelineBlock, { blockType: 'contentColumns' }>['columns']>[number]['body']
>

export function richTextBody(text: string): RichTextBody {
	return {
		root: {
			type: 'root',
			version: 1,
			direction: 'ltr',
			format: '',
			indent: 0,
			children: [
				{
					type: 'paragraph',
					version: 1,
					direction: 'ltr',
					format: '',
					indent: 0,
					children: [
						{
							type: 'text',
							version: 1,
							text,
							format: 0,
							detail: 0,
							mode: 'normal',
							style: '',
						},
					],
				},
			],
		},
	}
}

export function brandColor(name: string, hex: string, pantone?: string, id = 1): BrandColor {
	return { id, name, hex, pantone: pantone ?? null, updatedAt: '', createdAt: '' } as BrandColor
}
