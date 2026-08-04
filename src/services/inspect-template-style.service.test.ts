import { describe, expect, it } from 'vitest'
import { inspectTemplateStyle } from './inspect-template-style.service'

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

	it('동적 이미지 함수와 URL 이외의 함수 위치를 거부한다', () => {
		expect(inspectTemplateStyle('background-image: image-set(url(a) 1x)').blocker).toContain(
			'동적 이미지 함수',
		)
		expect(inspectTemplateStyle('color: url(a)').blocker).toContain('URL 위치')
	})
})
