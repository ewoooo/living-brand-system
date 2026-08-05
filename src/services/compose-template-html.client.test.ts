import { describe, expect, it } from 'vitest'
import { composeTemplateHtml } from './compose-template-html.client'

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

describe('composeTemplateHtml image carrier', () => {
	const generated = '/api/generated-images/file/gen.png'

	it('캐리어 div의 이미지만 갈아끼우고 background-size·position을 보존한다', () => {
		const frameHtml =
			'<div data-node-id="frame-1" data-figma-type="FRAME" style="overflow:hidden">' +
			'<div data-node-id="rect-1" data-figma-type="RECTANGLE" data-image-carrier=""' +
			' data-asset-collection="application-images" data-asset-id="3"' +
			' style="background-image:url(/api/application-images/file/ph.png);background-size:contain;background-position:left top;background-repeat:no-repeat"></div>' +
			'</div>'
		const html = composeTemplateHtml(frameHtml, {
			'frame-1': { backgroundImage: generated, generatedImageId: 9 },
		})
		const doc = new DOMParser().parseFromString(html, 'text/html')
		const frame = doc.querySelector('[data-node-id="frame-1"]') as HTMLElement
		const carrier = doc.querySelector('[data-image-carrier]') as HTMLElement

		expect(frame.style.backgroundImage).toBe('')
		expect(carrier.style.backgroundImage).toContain(generated)
		expect(carrier.style.backgroundSize).toBe('contain')
		expect(carrier.style.backgroundPosition).toBe('left top')
		// 발행 검증이 요소의 data-asset-*와 URL 일치를 요구하므로 생성 이미지 참조로 바뀐다.
		expect(carrier.getAttribute('data-asset-collection')).toBe('generated-images')
		expect(carrier.getAttribute('data-asset-id')).toBe('9')
	})

	it('배경 스타일이 없는 캐리어 div에는 cover·center 기본값을 준다', () => {
		const frameHtml =
			'<div data-node-id="frame-1" data-figma-type="FRAME">' +
			'<div data-node-id="rect-1" data-figma-type="RECTANGLE" data-image-carrier=""></div>' +
			'</div>'
		const html = composeTemplateHtml(frameHtml, { 'frame-1': { backgroundImage: generated } })
		const carrier = new DOMParser()
			.parseFromString(html, 'text/html')
			.querySelector('[data-image-carrier]') as HTMLElement

		expect(carrier.style.backgroundSize).toBe('cover')
		expect(carrier.style.backgroundPosition).toBe('center center')
	})

	it('캐리어 img는 src를 갈아끼운다', () => {
		const frameHtml =
			'<div data-node-id="frame-1" data-figma-type="FRAME">' +
			'<img data-node-id="rect-1" data-figma-type="RECTANGLE" data-image-carrier=""' +
			' src="/api/application-images/file/baked.png" srcset="/x 2x" alt="">' +
			'</div>'
		const html = composeTemplateHtml(frameHtml, {
			'frame-1': { backgroundImage: generated, generatedImageId: 9 },
		})
		const image = new DOMParser().parseFromString(html, 'text/html').querySelector('img')

		expect(image?.getAttribute('src')).toBe(generated)
		expect(image?.hasAttribute('srcset')).toBe(false)
		expect(image?.getAttribute('data-asset-id')).toBe('9')
	})

	it('마커가 없으면 기존 프레임 배경 동작을 유지한다', () => {
		const frameHtml = '<div data-node-id="frame-1" data-figma-type="FRAME"></div>'
		const html = composeTemplateHtml(frameHtml, { 'frame-1': { backgroundImage: generated } })
		const frame = new DOMParser()
			.parseFromString(html, 'text/html')
			.querySelector('[data-node-id="frame-1"]') as HTMLElement

		expect(frame.style.backgroundImage).toContain(generated)
		expect(frame.style.backgroundSize).toBe('cover')
		expect(frame.style.backgroundPosition).toBe('center center')
		expect(frame.style.backgroundRepeat).toBe('no-repeat')
	})
})
