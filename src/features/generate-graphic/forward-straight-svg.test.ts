import { afterEach, describe, expect, it, vi } from 'vitest'
import { exportForwardStraightSvg } from './export-forward-straight-svg.client'
import { forwardStraightToolContract } from './forward-straight'
import { createForwardStraightScene } from './forward-straight-geometry'
import { createForwardStraightSvg } from './forward-straight-svg'

afterEach(() => {
	vi.restoreAllMocks()
})

describe('Forward Straight SVG export', () => {
	it('serializes the shared geometry as SVG', () => {
		const svg = createForwardStraightSvg(
			createForwardStraightScene(forwardStraightToolContract.defaultInput, {
				width: 100,
				height: 100,
			}),
		)

		expect(svg).toContain('width="100" height="100" viewBox="0 0 100 100"')
		expect(svg).toContain('<rect width="100" height="100" fill="#030402" />')
		expect(svg.match(/<line /g)).toHaveLength(4)
		expect(svg).toContain(
			'<line x1="40.61" y1="40.61" x2="19.39" y2="19.39" stroke="#ffffff" stroke-width="1.00" stroke-linecap="square" />',
		)
		expect(svg).toContain('<circle cx="50.00" cy="50.00" r="2.50" fill="#ff2a2a" />')
	})

	it('downloads the SVG with the requested file name and releases the object URL', () => {
		const createObjectURL = vi.fn(() => 'blob:forward-straight')
		const revokeObjectURL = vi.fn()
		Object.defineProperties(URL, {
			createObjectURL: { configurable: true, value: createObjectURL },
			revokeObjectURL: { configurable: true, value: revokeObjectURL },
		})
		const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

		exportForwardStraightSvg({
			fileName: 'forward-straight',
			input: forwardStraightToolContract.defaultInput,
			viewport: { width: 100, height: 100 },
		})

		expect(createObjectURL).toHaveBeenCalledWith(
			expect.objectContaining({ type: 'image/svg+xml' }),
		)
		expect(click.mock.instances[0]).toMatchObject({
			download: 'forward-straight.svg',
			href: 'blob:forward-straight',
		})
		expect(revokeObjectURL).toHaveBeenCalledWith('blob:forward-straight')
	})
})
