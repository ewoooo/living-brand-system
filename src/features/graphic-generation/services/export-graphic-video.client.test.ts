// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import radialFlutedGlassRuntimeManifest from '@/features/graphic-generation/graphic-runtimes/radial-fluted-glass/definition'
import { canvasFramesToMp4 } from '@/features/studio-export/adapters/canvas-frames-to-mp4.mediabunny.client'
import { exportGraphicStudioVideo } from './export-graphic-video.client'

vi.mock('@/features/studio-export/adapters/canvas-frames-to-mp4.mediabunny.client', () => ({
	canvasFramesToMp4: vi.fn().mockResolvedValue(new Blob(['mp4'], { type: 'video/mp4' })),
}))

const request = {
	format: 'mp4',
	options: {
		container: 'mp4',
		codec: 'h264',
		durationSeconds: 5,
		fps: 30,
		width: 1920,
		height: 1080,
		colorSpace: 'rec709',
	},
} as const

describe('exportGraphicStudioVideo', () => {
	it('Graphic runtime source를 MP4 adapter에 전달하고 preview 크기를 복원한다', async () => {
		const runtime = {
			canvas: document.createElement('canvas'),
			renderFrame: vi.fn(),
			restore: vi.fn(),
		}
		const result = await exportGraphicStudioVideo(
			radialFlutedGlassRuntimeManifest,
			request,
			runtime,
		)

		expect(canvasFramesToMp4).toHaveBeenCalledWith(
			expect.objectContaining({ canvas: runtime.canvas, spec: request.options }),
		)
		expect(result).toMatchObject({
			filename: 'radial-fluted-glass.mp4',
			mimeType: 'video/mp4',
		})
		expect(runtime.restore).toHaveBeenCalledOnce()
	})
})
