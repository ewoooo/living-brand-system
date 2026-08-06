import { describe, expect, it } from 'vitest'
import { composeTemplateHtml, formatImageEditTransform } from './compose-template-html.client'

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

	it('요소 자신이 캐리어면(사각형 직접 선택) 그 요소에서 교체·재바인딩한다', () => {
		const frameHtml =
			'<div data-node-id="frame-1" data-figma-type="FRAME" style="overflow:hidden">' +
			'<div data-node-id="rect-1" data-figma-type="RECTANGLE" data-image-carrier=""' +
			' data-asset-collection="application-images" data-asset-id="3"' +
			' style="background-image:url(/api/application-images/file/ph.png);background-size:contain"></div>' +
			'</div>'
		const html = composeTemplateHtml(frameHtml, {
			'rect-1': { backgroundImage: generated, generatedImageId: 9 },
		})
		const carrier = new DOMParser()
			.parseFromString(html, 'text/html')
			.querySelector('[data-node-id="rect-1"]') as HTMLElement

		expect(carrier.style.backgroundImage).toContain(generated)
		expect(carrier.style.backgroundSize).toBe('contain')
		expect(carrier.getAttribute('data-asset-collection')).toBe('generated-images')
		expect(carrier.getAttribute('data-asset-id')).toBe('9')
	})

	it('캐리어 아닌 IMAGE fill 요소(placeholder 참조 보유)도 생성 이미지 참조로 재바인딩한다', () => {
		const html = composeTemplateHtml(
			'<div data-node-id="rect-1" data-figma-type="RECTANGLE"' +
				' data-asset-collection="application-images" data-asset-id="3"' +
				' style="background-image:url(/api/application-images/file/ph.png)"></div>',
			{ 'rect-1': { backgroundImage: generated, generatedImageId: 9 } },
		)
		const rect = new DOMParser()
			.parseFromString(html, 'text/html')
			.querySelector('[data-node-id="rect-1"]') as HTMLElement

		expect(rect.style.backgroundImage).toContain(generated)
		expect(rect.getAttribute('data-asset-collection')).toBe('generated-images')
		expect(rect.getAttribute('data-asset-id')).toBe('9')
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

	it('imageColorize가 캐리어 div를 luminance 마스크 2겹으로 재구성한다', () => {
		const frameHtml =
			'<div data-node-id="frame-1" data-figma-type="FRAME" style="overflow:hidden">' +
			'<div data-node-id="rect-1" data-figma-type="RECTANGLE" data-image-carrier=""' +
			' data-asset-collection="application-images" data-asset-id="3"' +
			' style="background-image:url(/api/application-images/file/ph.png);background-size:contain;background-position:left top;background-repeat:no-repeat"></div>' +
			'</div>'
		const html = composeTemplateHtml(frameHtml, {
			'frame-1': {
				backgroundImage: generated,
				generatedImageId: 9,
				imageColorize: { line: '#112233', background: '#aabbcc' },
			},
		})
		const carrier = new DOMParser()
			.parseFromString(html, 'text/html')
			.querySelector('[data-image-carrier]') as HTMLElement
		const overlay = carrier.firstElementChild as HTMLElement

		// 바닥(캐리어) = 라인색. 이미지 URL과 에셋 참조는 마스크를 가진 오버레이로 옮겨진다.
		expect(carrier.style.backgroundImage).toBe('')
		expect(carrier.style.backgroundColor).toBe('rgb(17, 34, 51)')
		expect(carrier.hasAttribute('data-asset-collection')).toBe(false)
		expect(carrier.hasAttribute('data-asset-id')).toBe(false)
		// 오버레이 = 배경색 + 생성 이미지 luminance 마스크. 프레이밍은 기존 background-*를 물려받는다.
		expect(overlay.getAttribute('data-node-id')).toBe('rect-1-colorize')
		expect(overlay.style.backgroundColor).toBe('rgb(170, 187, 204)')
		expect(overlay.style.maskImage).toContain(generated)
		expect(overlay.style.getPropertyValue('mask-mode')).toBe('luminance')
		expect(overlay.style.maskSize).toBe('contain')
		expect(overlay.style.maskPosition).toBe('left top')
		expect(overlay.getAttribute('data-asset-collection')).toBe('generated-images')
		expect(overlay.getAttribute('data-asset-id')).toBe('9')
	})

	it('imageColorize와 imageTransform이 함께 적용된다 — transform은 캐리어, 마스크는 자식', () => {
		const frameHtml =
			'<div data-node-id="frame-1" data-figma-type="FRAME">' +
			'<div data-node-id="rect-1" data-figma-type="RECTANGLE" data-image-carrier=""></div>' +
			'</div>'
		const html = composeTemplateHtml(frameHtml, {
			'frame-1': {
				backgroundImage: generated,
				imageColorize: { line: '#112233', background: '#aabbcc' },
				imageTransform: { x: 12, y: -30, scale: 1.5, rotate: 15 },
			},
		})
		const carrier = new DOMParser()
			.parseFromString(html, 'text/html')
			.querySelector('[data-image-carrier]') as HTMLElement

		expect(carrier.style.transform).toBe('translate(12px, -30px) scale(1.5) rotate(15deg)')
		expect((carrier.firstElementChild as HTMLElement).style.maskImage).toContain(generated)
	})

	it('background 생략 시 단일 레이어 반전 마스크 — 배경은 칠하지 않고 선만 line 색', () => {
		const frameHtml =
			'<div data-node-id="frame-1" data-figma-type="FRAME" style="overflow:hidden;background-color:rgb(255,255,255)">' +
			'<div data-node-id="rect-1" data-figma-type="RECTANGLE" data-image-carrier=""' +
			' style="background-size:contain"></div>' +
			'</div>'
		const html = composeTemplateHtml(frameHtml, {
			'frame-1': { backgroundImage: generated, imageColorize: { line: '#112233' } },
		})
		const carrier = new DOMParser()
			.parseFromString(html, 'text/html')
			.querySelector('[data-image-carrier]') as HTMLElement
		const overlay = carrier.firstElementChild as HTMLElement

		// 바닥은 아무것도 칠하지 않는다 — 배경이 투명해야 캔버스가 그대로 비친다.
		expect(carrier.style.backgroundColor).toBe('')
		// 오버레이 = line 색 + 반전 마스크(백색 기준층에서 이미지 luminance를 빼 선만 불투명).
		expect(overlay.style.backgroundColor).toBe('rgb(17, 34, 51)')
		expect(overlay.style.maskImage).toContain('linear-gradient')
		expect(overlay.style.maskImage).toContain(generated)
		expect(overlay.style.getPropertyValue('mask-mode')).toBe('alpha, luminance')
		expect(overlay.style.getPropertyValue('mask-composite')).toBe('subtract')
		// 기준층은 4px 인셋(가장자리 AA 잔선 방지), 이미지 레이어는 기존 background-size 승계.
		expect(overlay.style.maskSize).toBe('calc(100% - 4px) calc(100% - 4px), contain')
	})

	it('부모 clip 프레임의 fill을 투명화한다 — 캐리어가 못 덮는 노출 영역으로 새는 것 방지', () => {
		const frameHtml =
			'<div data-node-id="root-1" data-figma-type="FRAME" style="background-color:rgb(0,40,10)">' +
			'<div data-node-id="frame-1" data-figma-type="FRAME" style="overflow:hidden;background-color:rgb(255,255,255)">' +
			'<div data-node-id="rect-1" data-figma-type="RECTANGLE" data-image-carrier=""></div>' +
			'</div>' +
			'</div>'
		const html = composeTemplateHtml(frameHtml, {
			'frame-1': {
				backgroundImage: generated,
				imageColorize: { line: '#112233', background: '#aabbcc' },
			},
		})
		const frame = new DOMParser()
			.parseFromString(html, 'text/html')
			.querySelector('[data-node-id="frame-1"]') as HTMLElement

		expect(frame.style.backgroundColor).toBe('transparent')
	})

	it('프레임에 url( 배경이 있으면 fill을 건드리지 않는다', () => {
		const frameHtml =
			'<div data-node-id="root-1" data-figma-type="FRAME" style="background-color:rgb(0,40,10)">' +
			'<div data-node-id="frame-1" data-figma-type="FRAME"' +
			' style="overflow:hidden;background-image:url(/api/application-images/file/bg.png);background-color:rgb(255,255,255)">' +
			'<div data-node-id="rect-1" data-figma-type="RECTANGLE" data-image-carrier=""></div>' +
			'</div>' +
			'</div>'
		const html = composeTemplateHtml(frameHtml, {
			'frame-1': { backgroundImage: generated, imageColorize: { line: '#112233' } },
		})
		const frame = new DOMParser()
			.parseFromString(html, 'text/html')
			.querySelector('[data-node-id="frame-1"]') as HTMLElement

		expect(frame.style.backgroundColor).toBe('rgb(255, 255, 255)')
	})

	it('프레임이 템플릿 루트(캔버스)면 fill을 건드리지 않는다', () => {
		const frameHtml =
			'<div data-node-id="root-1" data-figma-type="FRAME" style="overflow:hidden;background-color:rgb(0,40,10)">' +
			'<div data-node-id="rect-1" data-figma-type="RECTANGLE" data-image-carrier=""></div>' +
			'</div>'
		const html = composeTemplateHtml(frameHtml, {
			'root-1': { backgroundImage: generated, imageColorize: { line: '#112233' } },
		})
		const root = new DOMParser()
			.parseFromString(html, 'text/html')
			.querySelector('[data-node-id="root-1"]') as HTMLElement

		expect(root.style.backgroundColor).toBe('rgb(0, 40, 10)')
	})

	it('imageColorize가 없으면 캐리어에 오버레이를 만들지 않는다', () => {
		const frameHtml =
			'<div data-node-id="frame-1" data-figma-type="FRAME">' +
			'<div data-node-id="rect-1" data-figma-type="RECTANGLE" data-image-carrier=""></div>' +
			'</div>'
		const html = composeTemplateHtml(frameHtml, {
			'frame-1': { backgroundImage: generated, generatedImageId: 9 },
		})
		const carrier = new DOMParser()
			.parseFromString(html, 'text/html')
			.querySelector('[data-image-carrier]') as HTMLElement

		expect(carrier.childElementCount).toBe(0)
		expect(carrier.style.backgroundImage).toContain(generated)
	})

	it('캐리어 img는 imageColorize 시 vectorColor처럼 div 2겹으로 치환된다', () => {
		const frameHtml =
			'<div data-node-id="frame-1" data-figma-type="FRAME">' +
			'<img data-node-id="rect-1" data-figma-type="RECTANGLE" data-image-carrier=""' +
			' data-asset-collection="application-images" data-asset-id="3"' +
			' src="/api/application-images/file/baked.png" alt="" style="width:100px;height:80px">' +
			'</div>'
		const html = composeTemplateHtml(frameHtml, {
			'frame-1': {
				backgroundImage: generated,
				generatedImageId: 9,
				imageColorize: { line: '#112233', background: '#aabbcc' },
			},
		})
		const doc = new DOMParser().parseFromString(html, 'text/html')
		const carrier = doc.querySelector('[data-image-carrier]') as HTMLElement
		const overlay = carrier.firstElementChild as HTMLElement

		expect(doc.querySelector('img')).toBeNull()
		expect(carrier.tagName).toBe('DIV')
		expect(carrier.style.width).toBe('100px') // img의 박스 스타일 승계
		expect(carrier.style.backgroundColor).toBe('rgb(17, 34, 51)')
		expect(overlay.style.maskImage).toContain(generated)
		expect(overlay.style.maskSize).toBe('100% 100%') // img 기본 fill 상당
		expect(overlay.getAttribute('data-asset-collection')).toBe('generated-images')
		expect(overlay.getAttribute('data-asset-id')).toBe('9')
	})

	it('formatImageEditTransform이 compose가 쓰는 문자열과 같은 포맷을 만든다 — 오버레이의 prefix strip 계약', () => {
		expect(formatImageEditTransform({ x: 12, y: -30, scale: 1.5, rotate: 15 })).toBe(
			'translate(12px, -30px) scale(1.5) rotate(15deg)',
		)
	})

	it('imageTransform을 캐리어의 transform으로 적용한다', () => {
		const frameHtml =
			'<div data-node-id="frame-1" data-figma-type="FRAME">' +
			'<div data-node-id="rect-1" data-figma-type="RECTANGLE" data-image-carrier=""></div>' +
			'</div>'
		const html = composeTemplateHtml(frameHtml, {
			'frame-1': {
				backgroundImage: generated,
				imageTransform: { x: 12, y: -30, scale: 1.5, rotate: 15 },
			},
		})
		const carrier = new DOMParser()
			.parseFromString(html, 'text/html')
			.querySelector('[data-image-carrier]') as HTMLElement

		expect(carrier.style.transform).toBe('translate(12px, -30px) scale(1.5) rotate(15deg)')
	})

	it('캐리어의 기존 base transform 앞에 편집 transform을 붙여 보존한다', () => {
		const frameHtml =
			'<div data-node-id="frame-1" data-figma-type="FRAME">' +
			'<div data-node-id="rect-1" data-figma-type="RECTANGLE" data-image-carrier=""' +
			' style="transform:rotate(-10deg)"></div>' +
			'</div>'
		const html = composeTemplateHtml(frameHtml, {
			'frame-1': {
				backgroundImage: generated,
				imageTransform: { x: 5, y: 0, scale: 2, rotate: 0 },
			},
		})
		const carrier = new DOMParser()
			.parseFromString(html, 'text/html')
			.querySelector('[data-image-carrier]') as HTMLElement

		expect(carrier.style.transform).toBe(
			'translate(5px, 0px) scale(2) rotate(0deg) rotate(-10deg)',
		)
	})

	it('identity imageTransform은 아무것도 쓰지 않는다', () => {
		const frameHtml =
			'<div data-node-id="frame-1" data-figma-type="FRAME">' +
			'<div data-node-id="rect-1" data-figma-type="RECTANGLE" data-image-carrier=""></div>' +
			'</div>'
		const html = composeTemplateHtml(frameHtml, {
			'frame-1': {
				backgroundImage: generated,
				imageTransform: { x: 0, y: 0, scale: 1, rotate: 0 },
			},
		})
		const carrier = new DOMParser()
			.parseFromString(html, 'text/html')
			.querySelector('[data-image-carrier]') as HTMLElement

		expect(carrier.style.transform).toBe('')
	})

	it('캐리어가 없으면 imageTransform을 무시하고 프레임 배경 동작을 유지한다', () => {
		const frameHtml = '<div data-node-id="frame-1" data-figma-type="FRAME"></div>'
		const html = composeTemplateHtml(frameHtml, {
			'frame-1': {
				backgroundImage: generated,
				imageTransform: { x: 12, y: 0, scale: 1.5, rotate: 15 },
			},
		})
		const frame = new DOMParser()
			.parseFromString(html, 'text/html')
			.querySelector('[data-node-id="frame-1"]') as HTMLElement

		expect(frame.style.transform).toBe('')
		expect(frame.style.backgroundImage).toContain(generated)
	})

	// Chrome은 base가 background: 쇼트핸드일 때 롱핸드 세팅을 url() 포함 쇼트핸드 하나로
	// 재직렬화해 스타일 검증(url은 background-image/mask-image만 허용)에 걸린다.
	// jsdom은 그 재직렬화를 재현하지 못하므로 여기서는 고칠 수 있는 사실만 고정한다:
	// 쇼트핸드 제거 + 색 롱핸드 보존 + 이미지 4종 롱핸드 세팅.
	it('background 쇼트핸드 base는 색만 남기고 지운 뒤 롱핸드로 세팅한다', () => {
		const frameHtml =
			'<div data-node-id="frame-1" data-figma-type="FRAME" style="background:rgb(0,40,10)"></div>'
		const html = composeTemplateHtml(frameHtml, { 'frame-1': { backgroundImage: generated } })
		const frame = new DOMParser()
			.parseFromString(html, 'text/html')
			.querySelector('[data-node-id="frame-1"]') as HTMLElement

		expect(frame.getAttribute('style')).not.toMatch(/background:/)
		expect(frame.style.backgroundColor).toBe('rgb(0, 40, 10)')
		expect(frame.style.backgroundImage).toContain(generated)
		expect(frame.style.backgroundSize).toBe('cover')
		expect(frame.style.backgroundPosition).toBe('center center')
		expect(frame.style.backgroundRepeat).toBe('no-repeat')
	})

	it('그라데이션 다중 레이어 쇼트핸드도 지운다 — cover 이미지가 덮으므로 시각 손실 없음', () => {
		const frameHtml =
			'<div data-node-id="frame-1" data-figma-type="FRAME"' +
			' style="background:linear-gradient(180deg,rgba(0,0,0,0.5) 0%,rgba(0,0,0,0) 100%),linear-gradient(rgb(1,2,3),rgb(1,2,3))"></div>'
		const html = composeTemplateHtml(frameHtml, { 'frame-1': { backgroundImage: generated } })
		const frame = new DOMParser()
			.parseFromString(html, 'text/html')
			.querySelector('[data-node-id="frame-1"]') as HTMLElement

		expect(frame.getAttribute('style')).not.toContain('gradient')
		expect(frame.getAttribute('style')).not.toMatch(/background:/)
		expect(frame.style.backgroundImage).toContain(generated)
	})

	it('캐리어 아닌 래스터 img는 배경을 칠하지 않고 src를 갈아끼운다', () => {
		const frameHtml =
			'<div data-node-id="frame-1" data-figma-type="FRAME">' +
			'<img data-node-id="rect-1" data-figma-type="RECTANGLE"' +
			' data-asset-collection="application-images" data-asset-id="5"' +
			' src="/api/application-images/file/baked.png" srcset="/x 2x" alt="">' +
			'<div data-node-id="deco-1" data-figma-type="RECTANGLE"></div>' +
			'</div>'
		const html = composeTemplateHtml(frameHtml, {
			'rect-1': { backgroundImage: generated, generatedImageId: 9 },
		})
		const image = new DOMParser().parseFromString(html, 'text/html').querySelector('img')

		expect(image?.getAttribute('src')).toBe(generated)
		expect(image?.hasAttribute('srcset')).toBe(false)
		expect(image?.getAttribute('data-asset-collection')).toBe('generated-images')
		expect(image?.getAttribute('data-asset-id')).toBe('9')
		expect(image?.style.backgroundImage).toBe('')
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
