import { describe, expect, it } from 'vitest'
import { vectorSceneToSvg } from './vector-scene-to-svg'

describe('vectorSceneToSvg', () => {
	it('최소 Vector Scene을 결정론적인 SVG로 직렬화한다', () => {
		const artifact = {
			kind: 'vector',
			source: {
				width: 100,
				height: 80,
				background: '#000000',
				primitives: [
					{
						kind: 'line',
						x1: 1,
						y1: 2,
						x2: 3,
						y2: 4,
						stroke: '#ffffff',
						strokeWidth: 2,
						lineCap: 'square',
					},
					{ kind: 'circle', cx: 5, cy: 6, radius: 7, fill: '#ff0000' },
				],
			},
		} as const

		const svg = vectorSceneToSvg(artifact)
		expect(vectorSceneToSvg(artifact)).toBe(svg)
		expect(svg).toContain('width="100" height="80" viewBox="0 0 100 80"')
		expect(svg).toContain('<rect width="100" height="80" fill="#000000" />')
		expect(svg).toContain(
			'<line x1="1.00" y1="2.00" x2="3.00" y2="4.00" stroke="#ffffff" stroke-width="2.00" stroke-linecap="square" />',
		)
		expect(svg).toContain('<circle cx="5.00" cy="6.00" r="7.00" fill="#ff0000" />')
	})

	it('template 개체를 presentation attribute만으로 직렬화한다', () => {
		const artifact = {
			kind: 'vector',
			source: {
				width: 200,
				height: 100,
				background: '#ffffff',
				primitives: [
					{
						kind: 'group',
						label: 'Background',
						clip: { x: 0, y: 0, width: 200, height: 100 },
						children: [{ kind: 'circle', cx: 1, cy: 2, radius: 3, fill: '#00ad45' }],
					},
					{
						kind: 'rect',
						x: 10,
						y: 20,
						width: 30,
						height: 40,
						fill: '#eeeeee',
						radius: 4,
					},
					{
						kind: 'image',
						x: 0,
						y: 0,
						width: 50,
						height: 50,
						href: 'data:image/png;base64,AAA',
					},
					{
						kind: 'text',
						x: 5,
						y: 60,
						text: 'HD & <현대>',
						fontFamily: 'Pretendard',
						fontSize: 24,
						fontWeight: 700,
						fill: '#000000',
					},
				],
			},
		} as const

		const svg = vectorSceneToSvg(artifact)
		// 같은 장면은 항상 같은 문서여야 한다 — clip id가 호출 횟수를 타면 안 된다.
		expect(vectorSceneToSvg(artifact)).toBe(svg)
		expect(svg).toContain('<clipPath id="clip-0">')
		expect(svg).toContain('clip-path="url(#clip-0)"')
		expect(svg).toContain('data-name="Background"')
		expect(svg).toContain(
			'<rect x="10.00" y="20.00" width="30.00" height="40.00" rx="4.00" fill="#eeeeee" />',
		)
		expect(svg).toContain('href="data:image/png;base64,AAA" preserveAspectRatio="none"')
		expect(svg).toContain('font-family="Pretendard" font-size="24.00" font-weight="700"')
		// 글자로 남긴다 — 받는 쪽에서 문구를 고칠 수 있어야 한다.
		expect(svg).toContain('>HD &amp; &lt;현대&gt;</text>')
		// foreignObject는 Figma에서 빈 화면이 된다.
		expect(svg).not.toContain('foreignObject')
	})
})
