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
})
