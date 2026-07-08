import { describe, expect, it } from 'vitest'
import { jsonTemplateSchema } from '@/types/json-template'
import { countUnauthorizedImages, validateTemplateImages } from './validate-authorized-assets'

function buildTemplate(imageOverrides: Record<string, unknown>) {
	return {
		width: 1080,
		height: 1350,
		background: '#ffffff',
		elements: [
			{
				id: 'image_1',
				type: 'image',
				x: 0,
				y: 0,
				width: 100,
				height: 100,
				zIndex: 1,
				locked: false,
				slotLabel: '로고',
				assetId: 1,
				src: '/api/template-assets/file/logo.png',
				objectFit: 'cover',
				borderRadius: 0,
				...imageOverrides,
			},
		],
	}
}

// 스택(2단) 안에 비인가 이미지 1개 + 인가 이미지 1개 — 재귀 탐색 검증용
const STACKED_TEMPLATE = {
	width: 1080,
	height: 1350,
	background: '#ffffff',
	elements: [
		{
			id: 'stack_1',
			type: 'stack',
			x: 0,
			y: 0,
			width: 1080,
			height: 500,
			zIndex: 1,
			locked: true,
			direction: 'vertical',
			gap: 10,
			padding: { top: 0, right: 0, bottom: 0, left: 0 },
			children: [
				{
					id: 'stack_2',
					type: 'stack',
					locked: true,
					width: 500,
					height: 200,
					direction: 'horizontal',
					gap: 0,
					padding: { top: 0, right: 0, bottom: 0, left: 0 },
					children: [
						{
							id: 'image_nested',
							type: 'image',
							locked: false,
							slotLabel: '중첩 로고',
							width: 100,
							height: 100,
							assetCollection: 'template-assets',
							assetId: 2,
							src: '/api/template-assets/file/nested.png',
							objectFit: 'cover',
							borderRadius: 0,
						},
						{
							id: 'image_authorized',
							type: 'image',
							locked: false,
							width: 100,
							height: 100,
							assetCollection: 'brand-logos',
							assetId: 3,
							src: '/api/brand-logos/file/ok.svg',
							objectFit: 'contain',
							borderRadius: 0,
						},
					],
				},
			],
		},
	],
}

describe('validateTemplateImages', () => {
	it('임포트 조각(template-assets)을 쓰는 이미지는 비인가로 보고한다', () => {
		const validation = validateTemplateImages(
			buildTemplate({ assetCollection: 'template-assets' }),
		)

		expect(validation.status).toBe('ok')
		expect(validation.unauthorizedLabels).toEqual(['로고'])
	})

	it('assetCollection이 없는 기존 데이터도 비인가로 간주한다', () => {
		expect(validateTemplateImages(buildTemplate({})).unauthorizedLabels).toEqual(['로고'])
	})

	it('인가 컬렉션 참조는 통과시키되 실검증용 참조 목록으로 모은다', () => {
		const validation = validateTemplateImages(
			buildTemplate({
				assetCollection: 'brand-logos',
				assetId: 7,
				src: '/api/brand-logos/file/logo.svg',
			}),
		)

		expect(validation.unauthorizedLabels).toEqual([])
		expect(validation.authorizedRefs).toEqual([
			{
				collection: 'brand-logos',
				assetId: 7,
				src: '/api/brand-logos/file/logo.svg',
				label: '로고',
			},
		])
	})

	it('jsonTemplate이 없으면 empty로 허용한다', () => {
		expect(validateTemplateImages(null).status).toBe('empty')
		expect(validateTemplateImages(undefined).status).toBe('empty')
	})

	it('스키마가 깨진 값은 invalid로 보고한다 — 보안 게이트는 fail-closed', () => {
		expect(validateTemplateImages({ width: 'broken' }).status).toBe('invalid')
	})

	it('스택 안에 중첩된 비인가 이미지를 재귀로 찾아낸다', () => {
		const validation = validateTemplateImages(STACKED_TEMPLATE)

		expect(validation.unauthorizedLabels).toEqual(['중첩 로고'])
		expect(validation.authorizedRefs.map((ref) => ref.assetId)).toEqual([3])
	})
})

describe('countUnauthorizedImages', () => {
	it('최상위 비인가 이미지를 센다', () => {
		const template = jsonTemplateSchema.parse(
			buildTemplate({ assetCollection: 'template-assets' }),
		)
		expect(countUnauthorizedImages(template.elements)).toBe(1)
	})

	it('인가 이미지는 세지 않는다', () => {
		const template = jsonTemplateSchema.parse(
			buildTemplate({
				assetCollection: 'brand-logos',
				src: '/api/brand-logos/file/logo.svg',
			}),
		)
		expect(countUnauthorizedImages(template.elements)).toBe(0)
	})

	it('스택 하위에 중첩된 비인가 이미지만 재귀로 센다', () => {
		const template = jsonTemplateSchema.parse(STACKED_TEMPLATE)
		expect(countUnauthorizedImages(template.elements)).toBe(1)
	})
})
