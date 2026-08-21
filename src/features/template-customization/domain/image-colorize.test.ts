import { describe, expect, it } from 'vitest'
import {
	deriveImageStudioConfig,
	type PublishedImageProfileDefinition,
} from '@/features/image-generation/domain/image-studio-config'
import { resolveTemplateImageColorControls } from './image-colorize'

const config = deriveImageStudioConfig({
	id: 5,
	name: '브랜드 제품컷',
	slug: 'brand-product',
	imageModelPreset: 'openai-gpt-image-2',
	features: [{ id: 'feature-color', blockType: 'colorAdjustment', background: true }],
} satisfies PublishedImageProfileDefinition)

const sample = {
	kind: 'sample',
	url: '/api/sample-images/file/hook.png',
	sampleImageId: 12,
	name: '후크',
	alt: '후크 선화',
	thumbnailUrl: '/api/sample-images/file/hook-320x240.png',
} as const

describe('resolveTemplateImageColorControls', () => {
	it('선화로 표시된 샘플에는 색 컨트롤을 연다', () => {
		expect(
			resolveTemplateImageColorControls(
				{ profileId: 5, image: { ...sample, lineArt: true } },
				config,
			),
		).toMatchObject({ line: { id: 'lineColor' }, background: { id: 'backgroundColor' } })
	})

	it('선화가 아닌 샘플에는 닫는다 — 사진에 걸면 두 색으로 뭉개진다', () => {
		expect(
			resolveTemplateImageColorControls(
				{ profileId: 5, image: { ...sample, lineArt: false } },
				config,
			),
		).toBeNull()
	})

	it('배정된 이미지가 없으면 저작 이미지가 대상이므로 연다', () => {
		expect(resolveTemplateImageColorControls({ profileId: 5 }, config)).not.toBeNull()
	})

	it('생성물은 그것을 만든 프로파일이 고른 상태일 때만 연다', () => {
		const generated = { kind: 'generated', url: '/x.png', generatedImageId: 1 } as const
		expect(
			resolveTemplateImageColorControls(
				{ profileId: 5, image: { ...generated, profileId: 5 } },
				config,
			),
		).not.toBeNull()
		expect(
			resolveTemplateImageColorControls(
				{ profileId: 5, image: { ...generated, profileId: 9 } },
				config,
			),
		).toBeNull()
	})
})
