import { describe, expect, it } from 'vitest'
import { inspectTemplateStyle } from './inspect-template-style'

describe('inspectTemplateStyle', () => {
	it('허용한 속성과 직접 URL을 읽는다', () => {
		expect(inspectTemplateStyle('background-color: #fff')).toEqual({ urls: [] })
		expect(
			inspectTemplateStyle('background-image: url("/api/application-images/file/a.png")'),
		).toEqual({ urls: ['/api/application-images/file/a.png'] })
	})

	it('허용하지 않은 속성과 CSS 우회 구문을 거부한다', () => {
		expect(inspectTemplateStyle('z-index: 1').blocker).toContain('z-index')
		expect(inspectTemplateStyle(String.raw`background-image:u\72l(x)`).blocker).toContain(
			'허용하지 않는 CSS 구문',
		)
	})

	it('텍스트 말줄임 line-clamp 세트를 허용한다', () => {
		expect(
			inspectTemplateStyle(
				'display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden',
			),
		).toEqual({ urls: [] })
		expect(inspectTemplateStyle('display:inline').blocker).toContain('display')
	})

	it('컬러 치환이 쓰는 mask-mode를 허용한다', () => {
		expect(inspectTemplateStyle('mask-mode: luminance')).toEqual({ urls: [] })
	})

	it('컬러 치환 반전 마스크의 gradient 기준층·mask-composite·calc 크기를 허용한다', () => {
		// Chromium이 재직렬화한 형태(색은 rgb(), 레이어는 쉼표 목록) 기준으로 고정한다.
		expect(
			inspectTemplateStyle(
				'mask-image: linear-gradient(rgb(255, 255, 255), rgb(255, 255, 255)), url("/api/generated-images/file/gen.png"); mask-mode: alpha, luminance; mask-composite: subtract; mask-size: calc(100% - 4px) calc(100% - 4px), 100% 100%',
			),
		).toEqual({ urls: ['/api/generated-images/file/gen.png'] })
	})

	it('linear-gradient 안에 url이 섞인 mask-image는 거부한다', () => {
		expect(
			inspectTemplateStyle(
				'mask-image: linear-gradient(url(/x)), url("/api/generated-images/file/gen.png")',
			).blocker,
		).toContain('URL 형식')
	})

	it('동적 이미지 함수와 URL 이외의 함수 위치를 거부한다', () => {
		expect(inspectTemplateStyle('background-image: image-set(url(a) 1x)').blocker).toContain(
			'동적 이미지 함수',
		)
		expect(inspectTemplateStyle('color: url(a)').blocker).toContain('URL 위치')
	})
})
