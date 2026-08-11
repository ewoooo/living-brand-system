import { describe, expect, it } from 'vitest'
import { imageColorizeStyle } from './image-colorize'

const SRC = '/api/generated-images/file/line.png'

describe('imageColorizeStyle', () => {
	it('라인만 지정하면 어두운 선만 칠하고 바닥은 투명하게 둔다', () => {
		const { base, overlay } = imageColorizeStyle(SRC, { line: '#000dff' })

		// 바닥을 칠하지 않는다 — 선 밖 영역은 뒤가 그대로 비쳐야 한다.
		expect(base).toEqual({})
		expect(overlay.backgroundColor).toBe('#000dff')
		expect(overlay.maskImage).toBe(`linear-gradient(#ffffff,#ffffff), url('${SRC}')`)
		expect(overlay.maskMode).toBe('alpha, luminance')
		expect(overlay.maskComposite).toBe('subtract')
	})

	it('배경까지 지정하면 바닥을 라인 색으로 채우고 밝은 영역만 배경색으로 덮는다', () => {
		const { base, overlay } = imageColorizeStyle(SRC, {
			line: '#000dff',
			background: '#00ffd4',
		})

		expect(base.backgroundColor).toBe('#000dff')
		expect(overlay.backgroundColor).toBe('#00ffd4')
		expect(overlay.maskImage).toBe(`url('${SRC}')`)
		expect(overlay.maskMode).toBe('luminance')
		// 빼기 합성은 라인 전용 기법이다 — 배경이 있으면 한 겹 luminance 마스크만 쓴다.
		expect(overlay.maskComposite).toBeUndefined()
	})
})
