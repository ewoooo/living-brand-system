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
})
