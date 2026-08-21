// @vitest-environment jsdom
import { toCanvas } from 'html-to-image'
import { describe, expect, it, vi } from 'vitest'
import type { CanvasVideoSource } from '@/modules/studio-artifact/studio-artifact'
import { createTemplateVideoArtifact } from './template-runtime.client'

const OVERLAY = { overlay: true } as unknown as HTMLCanvasElement

vi.mock('html-to-image', () => ({ toCanvas: vi.fn(async () => OVERLAY) }))
vi.mock('./render-template-raster-stage.client', () => ({
	withTemplateRasterStage: (html: string, consume: (element: HTMLElement) => unknown) => {
		const element = document.createElement('div')
		element.innerHTML = html
		return consume(element)
	},
}))

describe('createTemplateVideoArtifact', () => {
	it('전경을 한 번만 rasterize하고 프레임마다 배경 시간을 진행시켜 위에 겹친다', async () => {
		const drawn: unknown[] = []
		const context = {
			clearRect: vi.fn(),
			drawImage: vi.fn((image: unknown) => drawn.push(image)),
		}
		vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
			context as unknown as CanvasRenderingContext2D,
		)
		const backgroundCanvas = document.createElement('canvas')
		const times: number[] = []
		const background: CanvasVideoSource = {
			canvas: backgroundCanvas,
			renderFrame: (timeSeconds) => times.push(timeSeconds),
			restore: vi.fn(),
		}

		const artifact = await createTemplateVideoArtifact({
			background,
			height: 300,
			html: '<div>card</div>',
			width: 600,
		})
		for (const time of [0, 1 / 30, 2 / 30]) artifact.source.renderFrame(time, 1920, 1080)

		// 정지화면 5초로 되돌아가면 여기가 깨진다 — 프레임마다 배경 시간이 진행해야 한다.
		expect(times).toEqual([0, 1 / 30, 2 / 30])
		expect(toCanvas).toHaveBeenCalledOnce()
		expect(drawn).toEqual([
			backgroundCanvas,
			OVERLAY,
			backgroundCanvas,
			OVERLAY,
			backgroundCanvas,
			OVERLAY,
		])
		expect(artifact.source.canvas.width).toBe(1920)
		expect(artifact.source.canvas.height).toBe(1080)

		artifact.source.restore()
		expect(background.restore).toHaveBeenCalledOnce()
	})
})
