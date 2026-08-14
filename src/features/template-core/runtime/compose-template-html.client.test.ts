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

	it('vectorFit이 없으면 objectFit을 기록하지 않는다 — base의 맞춤 유지', () => {
		const html = composeTemplateHtml(baseHtml, {
			'vector-1': {
				vectorAsset: {
					collection: 'brand-logos',
					id: 7,
					src: '/api/brand-logos/file/logo.svg',
				},
			},
		})
		const image = new DOMParser().parseFromString(html, 'text/html').querySelector('img')

		expect(image?.style.objectFit).toBe('')
	})
})

describe('composeTemplateHtml text color override', () => {
	const textHtml =
		'<p data-node-id="text-1" style="color:#1a1a1a;font-size:20px">FUTURE BUILDER</p>'

	it('color 오버라이드가 텍스트 노드의 inline color를 덮는다', () => {
		const html = composeTemplateHtml(textHtml, { 'text-1': { color: '#ff0000' } })
		const p = new DOMParser().parseFromString(html, 'text/html').querySelector('p')

		expect(p?.style.color).toBe('rgb(255, 0, 0)')
		expect(p?.style.fontSize).toBe('20px') // 다른 스타일은 보존
	})

	it('color가 없으면 base의 색을 유지한다', () => {
		const html = composeTemplateHtml(textHtml, { 'text-1': { text: 'NEW' } })
		const p = new DOMParser().parseFromString(html, 'text/html').querySelector('p')

		expect(p?.style.color).toBe('rgb(26, 26, 26)')
		expect(p?.textContent).toBe('NEW')
	})

	it('color 오버라이드는 텍스트 노드(<p>)가 아니면 아무것도 바꾸지 않는다', () => {
		const html = composeTemplateHtml(
			'<div data-node-id="frame-1" style="color:#111111"></div>',
			{ 'frame-1': { color: '#ff0000' } },
		)
		const frame = new DOMParser().parseFromString(html, 'text/html').querySelector('div')

		expect(frame?.style.color).toBe('rgb(17, 17, 17)')
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

	it('스탠드얼론 이미지 fill 사각형(자기 캐리어)도 생성 이미지 참조로 재바인딩한다', () => {
		// 임포트가 자식 없는 이미지 fill 노드를 자기 캐리어로 마킹한다 — 프레임 없이도 통일 경로.
		const html = composeTemplateHtml(
			'<div data-node-id="rect-1" data-figma-type="RECTANGLE" data-image-carrier=""' +
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
			' src="/api/application-images/file/baked.png" alt="">' +
			'</div>'
		const html = composeTemplateHtml(frameHtml, {
			'frame-1': { backgroundImage: generated, generatedImageId: 9 },
		})
		const image = new DOMParser().parseFromString(html, 'text/html').querySelector('img')

		expect(image?.getAttribute('src')).toBe(generated)
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

	it('캐리어에 형제가 있으면 프레임 fill을 투명화하지 않는다 — 형제 콘텐츠의 배경 보존', () => {
		const frameHtml =
			'<div data-node-id="root-1" data-figma-type="FRAME" style="background-color:rgb(0,40,10)">' +
			'<div data-node-id="frame-1" data-figma-type="FRAME" style="overflow:hidden;background-color:rgb(255,255,255)">' +
			'<div data-node-id="rect-1" data-figma-type="RECTANGLE" data-image-carrier=""></div>' +
			'<p data-node-id="caption-1" data-figma-type="TEXT">캡션</p>' +
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

		expect(frame.style.backgroundColor).toBe('rgb(255, 255, 255)')
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

	it('자기 캐리어 래스터 img는 배경을 칠하지 않고 src를 갈아끼운다', () => {
		// 임포트가 래스터 폴백 img(비벡터)를 자기 캐리어로 마킹한다 — 형제가 있어도 통일 경로.
		const frameHtml =
			'<div data-node-id="frame-1" data-figma-type="FRAME">' +
			'<img data-node-id="rect-1" data-figma-type="RECTANGLE" data-image-carrier=""' +
			' data-asset-collection="application-images" data-asset-id="5"' +
			' src="/api/application-images/file/baked.png" alt="">' +
			'<div data-node-id="deco-1" data-figma-type="RECTANGLE"></div>' +
			'</div>'
		const html = composeTemplateHtml(frameHtml, {
			'rect-1': { backgroundImage: generated, generatedImageId: 9 },
		})
		const image = new DOMParser().parseFromString(html, 'text/html').querySelector('img')

		expect(image?.getAttribute('src')).toBe(generated)
		expect(image?.getAttribute('data-asset-collection')).toBe('generated-images')
		expect(image?.getAttribute('data-asset-id')).toBe('9')
		expect(image?.style.backgroundImage).toBe('')
	})

	it('손자 캐리어는 무시된다 — 탐색은 자신·직계 자식만, 프레임 배경으로도 흘리지 않는다', () => {
		const frameHtml =
			'<div data-node-id="wrap-1" data-figma-type="FRAME">' +
			'<div data-node-id="frame-1" data-figma-type="FRAME" style="overflow:hidden">' +
			'<div data-node-id="rect-1" data-figma-type="RECTANGLE" data-image-carrier=""' +
			' style="background-image:url(/api/application-images/file/ph.png)"></div>' +
			'</div>' +
			'</div>'
		const html = composeTemplateHtml(frameHtml, { 'wrap-1': { backgroundImage: generated } })
		const doc = new DOMParser().parseFromString(html, 'text/html')
		const wrap = doc.querySelector('[data-node-id="wrap-1"]') as HTMLElement
		const carrier = doc.querySelector('[data-image-carrier]') as HTMLElement

		// 손자 캐리어는 건드리지 않는다 — 생산자(자신·직계 자식만 마킹)와 소비자의 탐색 범위 일치.
		expect(carrier.style.backgroundImage).toContain('ph.png')
		expect(wrap.style.backgroundImage).toBe('')
	})

	it('colorize 합성 결과를 다시 compose해도 오버레이는 1개 — 마스크·에셋 참조가 새 이미지를 가리킨다', () => {
		const frameHtml =
			'<div data-node-id="frame-1" data-figma-type="FRAME" style="overflow:hidden">' +
			'<div data-node-id="rect-1" data-figma-type="RECTANGLE" data-image-carrier=""' +
			' data-asset-collection="application-images" data-asset-id="3"' +
			' style="background-image:url(/api/application-images/file/ph.png)"></div>' +
			'</div>'
		const first = composeTemplateHtml(frameHtml, {
			'frame-1': {
				backgroundImage: generated,
				generatedImageId: 9,
				imageColorize: { line: '#112233' },
			},
		})
		const replaced = '/api/generated-images/file/gen2.png'
		const html = composeTemplateHtml(first, {
			'frame-1': {
				backgroundImage: replaced,
				generatedImageId: 10,
				imageColorize: { line: '#112233' },
			},
		})
		const doc = new DOMParser().parseFromString(html, 'text/html')
		const overlays = doc.querySelectorAll('[data-node-id="rect-1-colorize"]')
		const overlay = overlays[0] as HTMLElement

		expect(overlays.length).toBe(1)
		expect(overlay.style.maskImage).toContain(replaced)
		expect(overlay.style.maskImage).not.toContain(generated)
		expect(overlay.getAttribute('data-asset-collection')).toBe('generated-images')
		expect(overlay.getAttribute('data-asset-id')).toBe('10')
	})

	it('마킹된 직계 자식이 2개면 프레임 키 배정은 아무것도 바꾸지 않는다 — 추측하지 않는다', () => {
		const frameHtml =
			'<div data-node-id="frame-1" data-figma-type="FRAME" style="overflow:hidden">' +
			'<div data-node-id="rect-1" data-figma-type="RECTANGLE" data-image-carrier=""' +
			' style="background-image:url(/api/application-images/file/a.png)"></div>' +
			'<div data-node-id="rect-2" data-figma-type="RECTANGLE" data-image-carrier=""' +
			' style="background-image:url(/api/application-images/file/b.png)"></div>' +
			'</div>'
		const html = composeTemplateHtml(frameHtml, {
			'frame-1': { backgroundImage: generated, generatedImageId: 9 },
		})
		const doc = new DOMParser().parseFromString(html, 'text/html')

		expect(doc.body.innerHTML).not.toContain(generated)
		for (const id of ['rect-1', 'rect-2']) {
			const carrier = doc.querySelector(`[data-node-id="${id}"]`) as HTMLElement
			expect(carrier.getAttribute('data-asset-collection')).toBeNull()
		}
	})

	it('재합성 멱등성 — transform 없는 config는 published 출력에 다시 적용해도 같다', () => {
		// B-1 검증 겸함: colorize가 캐리어 프레이밍을 지우지 않아 2차 compose의 마스크가 원본
		// background-size/position을 그대로 물려받는다. imageTransform은 설계상 비멱등이라 뺀다.
		const base =
			'<div data-node-id="frame-1" data-figma-type="FRAME" style="overflow:hidden;background-color:rgb(255,255,255)">' +
			'<div data-node-id="rect-1" data-figma-type="RECTANGLE" data-image-carrier=""' +
			' data-asset-collection="application-images" data-asset-id="3"' +
			' style="background-image:url(/api/application-images/file/ph.png);background-size:contain;background-position:left top"></div>' +
			'</div>' +
			'<p data-node-id="text-1" data-figma-type="TEXT">원본</p>'
		const config = {
			'frame-1': {
				backgroundImage: generated,
				generatedImageId: 9,
				imageColorize: { line: '#112233' },
			},
			'text-1': { text: '바뀐 문구' },
		}
		const once = composeTemplateHtml(base, config)

		expect(composeTemplateHtml(once, config)).toBe(once)
		// 프레이밍 보존 확인 — 마스크가 cover/center 기본값으로 강등되지 않는다.
		const overlay = new DOMParser()
			.parseFromString(once, 'text/html')
			.querySelector('[data-node-id="rect-1-colorize"]') as HTMLElement
		expect(overlay.style.maskSize).toContain('contain')
		expect(overlay.style.maskPosition).toContain('left top')
	})

	it('재합성 멱등성 — img 캐리어도 published 출력에 다시 적용해도 같다', () => {
		// 1차에서 img→div 치환이 프레이밍('100% 100%'/center/no-repeat)을 명시 고정하므로
		// 2차 배정 분기의 "없을 때만 기본값" 가드가 이 값을 보존해 maskSize가 cover로 드리프트하지 않는다.
		const base =
			'<div data-node-id="root-1" data-figma-type="FRAME" style="background-color:rgb(0,40,10)">' +
			'<div data-node-id="frame-1" data-figma-type="FRAME" style="overflow:hidden;background-color:rgb(255,255,255)">' +
			'<img data-node-id="rect-1" data-figma-type="RECTANGLE" data-image-carrier=""' +
			' data-asset-collection="application-images" data-asset-id="3"' +
			' src="/api/application-images/file/baked.png" alt="" style="width:100px;height:80px">' +
			'</div>' +
			'</div>'
		const config = {
			'frame-1': {
				backgroundImage: generated,
				generatedImageId: 9,
				imageColorize: { line: '#112233' },
			},
		}
		const once = composeTemplateHtml(base, config)

		expect(composeTemplateHtml(once, config)).toBe(once)
		// 치환 div에 img 렌더 상당 프레이밍이 명시돼 있어야 2차 배정이 cover로 덮지 않는다.
		const carrier = new DOMParser()
			.parseFromString(once, 'text/html')
			.querySelector('[data-image-carrier]') as HTMLElement
		expect(carrier.style.backgroundSize).toBe('100% 100%')
	})

	it('캐리어 없는 노드의 backgroundImage는 무시된다 — 원본 그대로', () => {
		// 이미지 배정은 캐리어 전용 계약 — 임포트가 마킹하지 않은 노드(구 임포트 산출물 포함)에는
		// 배경도, transform도, 에셋 참조도 쓰지 않는다.
		const frameHtml =
			'<div data-node-id="frame-1" data-figma-type="FRAME" style="background:rgb(0,40,10)"></div>'
		const html = composeTemplateHtml(frameHtml, {
			'frame-1': {
				backgroundImage: generated,
				generatedImageId: 9,
				imageTransform: { x: 12, y: 0, scale: 1.5, rotate: 15 },
			},
		})
		const frame = new DOMParser()
			.parseFromString(html, 'text/html')
			.querySelector('[data-node-id="frame-1"]') as HTMLElement

		expect(frame.style.backgroundImage).not.toContain(generated)
		expect(frame.style.backgroundColor).toBe('rgb(0, 40, 10)')
		expect(frame.style.transform).toBe('')
		expect(frame.getAttribute('data-asset-collection')).toBeNull()
	})
})

describe('composeTemplateHtml canvas background', () => {
	// 루트 프레임(body 직계 자식) + 자식 프레임 — 배경이 루트에만 얹히는지 구분하기 위해 두 겹이다.
	const canvasHtml =
		'<div data-node-id="root-1" data-figma-type="FRAME" style="width:400px;height:300px;background-color:rgb(0,40,10)">' +
		'<div data-node-id="frame-1" data-figma-type="FRAME" style="width:100px;height:80px"></div>' +
		'</div>'
	const generatedBackground = '/api/generated-images/file/canvas.png'

	const parse = (html: string) => new DOMParser().parseFromString(html, 'text/html')
	const rootOf = (html: string) => parse(html).body.firstElementChild as HTMLElement
	const childOf = (html: string) =>
		parse(html).querySelector('[data-node-id="frame-1"]') as HTMLElement

	it('색만 주면 루트 프레임의 배경색만 덮는다', () => {
		const html = composeTemplateHtml(canvasHtml, {}, { canvasBackground: { color: '#ff0000' } })

		expect(rootOf(html).style.backgroundColor).toBe('rgb(255, 0, 0)')
		expect(rootOf(html).style.backgroundImage).toBe('')
		// 자식 프레임은 건드리지 않는다 — 배경의 주소는 캔버스뿐이다.
		expect(childOf(html).style.backgroundColor).toBe('')
	})

	it('이미지만 주면 cover·center·no-repeat로 루트에 깐다', () => {
		const html = composeTemplateHtml(
			canvasHtml,
			{},
			{ canvasBackground: { imageUrl: generatedBackground } },
		)
		const root = rootOf(html)

		expect(root.style.backgroundImage).toBe(`url("${generatedBackground}")`)
		expect(root.style.backgroundSize).toBe('cover')
		expect(root.style.backgroundPosition).toBe('center center') // CSSOM 정규화 표기
		expect(root.style.backgroundRepeat).toBe('no-repeat')
		// 저작 배경색은 남는다 — 이미지 갈래는 색을 지우지 않는다.
		expect(root.style.backgroundColor).toBe('rgb(0, 40, 10)')
	})

	it('색과 이미지를 함께 주면 둘 다 얹힌다', () => {
		const html = composeTemplateHtml(
			canvasHtml,
			{},
			{ canvasBackground: { color: '#ffffff', imageUrl: generatedBackground } },
		)
		const root = rootOf(html)

		expect(root.style.backgroundColor).toBe('rgb(255, 255, 255)')
		expect(root.style.backgroundImage).toBe(`url("${generatedBackground}")`)
	})

	it('clear를 주면 루트의 기존 배경 선언을 모두 비운다', () => {
		const html = composeTemplateHtml(canvasHtml, {}, { canvasBackground: { clear: true } })
		const root = rootOf(html)

		expect(root.style.background).toBe('transparent')
		expect(root.style.backgroundImage).toBe('none')
	})

	it('배경 인자를 주지 않으면 출력이 base 그대로다 — 기존 호출부 무영향', () => {
		expect(composeTemplateHtml(canvasHtml, {})).toBe(canvasHtml)
		expect(composeTemplateHtml(canvasHtml, {}, {})).toBe(canvasHtml)
		expect(composeTemplateHtml(canvasHtml, {}, { canvasBackground: {} })).toBe(canvasHtml)
	})

	it('노드 오버라이드와 함께 흘러도 서로를 밀어내지 않는다', () => {
		const html = composeTemplateHtml(
			'<div data-node-id="root-1" data-figma-type="FRAME">' +
				'<p data-node-id="text-1" data-figma-type="TEXT">원본</p>' +
				'</div>',
			{ 'text-1': { text: '바뀐 문구' } },
			{ canvasBackground: { color: '#123456' } },
		)

		expect(rootOf(html).style.backgroundColor).toBe('rgb(18, 52, 86)')
		expect(parse(html).querySelector('p')?.textContent).toBe('바뀐 문구')
	})

	it('재합성 멱등성 — 같은 배경을 출력에 다시 적용해도 같다', () => {
		const background = { color: '#ffffff', imageUrl: generatedBackground }
		const once = composeTemplateHtml(canvasHtml, {}, { canvasBackground: background })

		expect(composeTemplateHtml(once, {}, { canvasBackground: background })).toBe(once)
	})
})
