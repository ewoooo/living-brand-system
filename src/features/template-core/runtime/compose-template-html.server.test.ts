// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { composeTemplateHtml } from './compose-template-html.client'

/**
 * 이 합성기는 DOMParser를 쓰므로 서버에서 부르면 안 된다.
 * 여기서 환경을 node로 덮는 이유가 그것이다 — 전역 jsdom만 쓰면 이 제약이 테스트를 통과한다.
 * 호출자(템플릿 스튜디오)는 client 전용 경계 뒤에 있어야 한다.
 */
describe('composeTemplateHtml의 실행 환경 제약', () => {
	const html = '<div data-node-id="1:1"></div>'

	it('바꿀 것이 없으면 서버에서도 살아남는다', () => {
		expect(composeTemplateHtml(html, {})).toBe(html)
	})

	it('override가 하나라도 있으면 서버에서 DOMParser를 찾다 죽는다', () => {
		expect(() => composeTemplateHtml(html, { '1:1': { visible: false } })).toThrow(/DOMParser/)
	})

	it('캔버스 배경만 있어도 마찬가지다', () => {
		expect(() => composeTemplateHtml(html, {}, { canvasBackground: { clear: true } })).toThrow(
			/DOMParser/,
		)
	})
})
