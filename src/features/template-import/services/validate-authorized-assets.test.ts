import { describe, expect, it } from 'vitest'
import { findUnauthorizedTemplateImages } from './validate-authorized-assets'

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

describe('findUnauthorizedTemplateImages', () => {
	it('임포트 조각(template-assets)을 쓰는 이미지는 비인가로 보고한다', () => {
		expect(
			findUnauthorizedTemplateImages(buildTemplate({ assetCollection: 'template-assets' })),
		).toEqual(['로고'])
	})

	it('assetCollection이 없는 기존 데이터도 비인가로 간주한다', () => {
		expect(findUnauthorizedTemplateImages(buildTemplate({}))).toEqual(['로고'])
	})

	it('인가 컬렉션(brand-logos 등)을 참조하면 통과한다', () => {
		expect(
			findUnauthorizedTemplateImages(
				buildTemplate({
					assetCollection: 'brand-logos',
					src: '/api/brand-logos/file/logo.svg',
				}),
			),
		).toEqual([])
	})

	it('스키마가 깨진 값은 판단하지 않는다', () => {
		expect(findUnauthorizedTemplateImages({ width: 'broken' })).toEqual([])
		expect(findUnauthorizedTemplateImages(null)).toEqual([])
	})

	it('스택 안에 중첩된 비인가 이미지를 재귀로 찾아낸다', () => {
		const stackedTemplate = {
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

		expect(findUnauthorizedTemplateImages(stackedTemplate)).toEqual(['중첩 로고'])
	})
})
