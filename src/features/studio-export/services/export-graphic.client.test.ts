// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import type { VectorSceneArtifact, VideoArtifact } from '@/modules/studio-artifact/studio-artifact'
import { canvasFramesToMp4 } from '../adapters/canvas-frames-to-mp4.mediabunny.client'
import { exportVectorArtifactAsSvg, exportVideoArtifactAsMp4 } from './export-graphic.client'

vi.mock('../adapters/canvas-frames-to-mp4.mediabunny.client', () => ({
	canvasFramesToMp4: vi.fn().mockResolvedValue(new Blob(['mp4'], { type: 'video/mp4' })),
}))

describe('Graphic Artifact export', () => {
	it('Vector Artifact를 SVG 결과로 만든다', () => {
		const artifact: VectorSceneArtifact = {
			kind: 'vector',
			source: { width: 10, height: 20, background: '#000', primitives: [] },
		}
		expect(exportVectorArtifactAsSvg('forward-straight', artifact)).toMatchObject({
			filename: 'forward-straight.svg',
			mimeType: 'image/svg+xml',
		})
	})

	it('Video Artifact를 MP4 adapter에 전달하고 preview를 복원한다', async () => {
		const artifact: VideoArtifact<{
			canvas: HTMLCanvasElement
			renderFrame(timeSeconds: number, width: number, height: number): void
			restore(): void
		}> = {
			kind: 'video',
			source: {
				canvas: document.createElement('canvas'),
				renderFrame: vi.fn(),
				restore: vi.fn(),
			},
		}
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

		const result = await exportVideoArtifactAsMp4('radial-fluted-glass', artifact, request)

		expect(canvasFramesToMp4).toHaveBeenCalledWith(
			expect.objectContaining({ canvas: artifact.source.canvas, spec: request.options }),
		)
		expect(result).toMatchObject({
			filename: 'radial-fluted-glass.mp4',
			mimeType: 'video/mp4',
		})
		expect(artifact.source.restore).toHaveBeenCalledOnce()
	})
})
