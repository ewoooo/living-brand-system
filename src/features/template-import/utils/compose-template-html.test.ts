import { describe, expect, it } from 'vitest'
import { composeTemplateHtml } from './compose-template-html'

const baseHtml =
	'<img data-node-id="vector-1" data-figma-type="VECTOR" src="/api/template-assets/file/original.svg" style="width:120px;height:40px">'

describe('composeTemplateHtml vector override', () => {
	it('인가 자산·contain·브랜드 컬러를 벡터에 함께 적용한다', () => {
		const html = composeTemplateHtml(baseHtml, {
			'vector-1': {
				vectorAsset: {
					collection: 'brand-logos',
					id: 7,
					src: '/api/brand-logos/file/logo.svg',
				},
				vectorFit: 'contain',
				vectorColor: '#112233',
			},
		})
		const element = new DOMParser().parseFromString(html, 'text/html').body.firstElementChild

		expect(element?.tagName).toBe('DIV')
		expect(element?.getAttribute('data-asset-collection')).toBe('brand-logos')
		expect(element?.getAttribute('data-asset-id')).toBe('7')
		expect((element as HTMLElement).style.maskImage).toContain('/api/brand-logos/file/logo.svg')
		expect((element as HTMLElement).style.maskSize).toBe('contain')
		expect((element as HTMLElement).style.backgroundColor).toBe('rgb(17, 34, 51)')
	})

	it('색상이 없으면 img와 fill 맞춤을 유지한다', () => {
		const html = composeTemplateHtml(baseHtml, {
			'vector-1': { vectorFit: 'fill' },
		})
		const image = new DOMParser().parseFromString(html, 'text/html').querySelector('img')

		expect(image?.style.objectFit).toBe('fill')
	})
})
