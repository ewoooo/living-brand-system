// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createImageArtifacts } from '@/features/image-generation/runtime/image-artifact.client'
import { createTemplateRasterArtifact } from '@/features/template-customization/runtime/template-runtime.client'
import type {
	RasterArtifact,
	VectorSceneArtifact,
	VideoArtifact,
} from '@/modules/studio-artifact/studio-artifact'
import { canvasFramesToMp4 } from '../adapters/canvas-frames-to-mp4.mediabunny.client'
import { elementToJpeg } from '../adapters/element-to-jpeg.client'
import { elementToPng } from '../adapters/element-to-png.client'
import { htmlToPng } from '../adapters/html-to-png.client'
import {
	exportCanvasRasterArtifactAsJpeg,
	exportCanvasRasterArtifactAsPng,
	exportElementRasterArtifactAsPng,
	exportHtmlRasterArtifactAsJpeg,
	exportHtmlRasterArtifactAsPng,
	exportOriginalArtifact,
	exportVectorArtifactAsSvg,
	exportVideoArtifactAsMp4,
} from './export-artifact.client'

vi.mock('../adapters/canvas-frames-to-mp4.mediabunny.client', () => ({
	canvasFramesToMp4: vi.fn().mockResolvedValue(new Blob(['mp4'], { type: 'video/mp4' })),
}))
vi.mock('../adapters/element-to-png.client', () => ({ elementToPng: vi.fn() }))
vi.mock('../adapters/element-to-jpeg.client', () => ({ elementToJpeg: vi.fn() }))
vi.mock('../adapters/html-to-png.client', () => ({ htmlToPng: vi.fn() }))

const PNG_REQUEST = {
	artifact: 'raster',
	format: 'png',
	colorProfile: { space: 'rgb', icc: 'srgb' },
	options: { scale: 1, transparent: true },
} as const

const JPEG_REQUEST = {
	artifact: 'raster',
	format: 'jpeg',
	colorProfile: { space: 'rgb', icc: 'srgb' },
	options: { quality: 90 },
} as const

class StubImage {
	naturalWidth = 2048
	naturalHeight = 3072
	private listeners: (() => void)[] = []
	addEventListener(type: string, listener: () => void) {
		if (type === 'load') this.listeners.push(listener)
	}
	set src(_value: string) {
		for (const listener of this.listeners) listener()
	}
}

describe('Artifact export', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		vi.mocked(elementToPng).mockResolvedValue(new Blob(['png']))
		vi.mocked(elementToJpeg).mockResolvedValue(new Blob(['jpeg']))
		vi.mocked(htmlToPng).mockResolvedValue(new Blob(['png']))
		vi.stubGlobal('Image', StubImage)
	})

	afterEach(() => {
		vi.restoreAllMocks()
		vi.unstubAllGlobals()
	})

	it('Vector와 Video Artifact를 각각 SVG와 MP4로 변환한다', async () => {
		const vector: VectorSceneArtifact = {
			kind: 'vector',
			source: { width: 10, height: 20, background: '#000', primitives: [] },
		}
		const video: VideoArtifact<{
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
			artifact: 'video',
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

		expect(exportVectorArtifactAsSvg('graphic', vector)).toMatchObject({
			filename: 'graphic.svg',
			mimeType: 'image/svg+xml',
		})
		await expect(exportVideoArtifactAsMp4('graphic', video, request)).resolves.toMatchObject({
			filename: 'graphic.mp4',
			mimeType: 'video/mp4',
		})
		expect(canvasFramesToMp4).toHaveBeenCalledOnce()
		expect(video.source.restore).toHaveBeenCalledOnce()
	})

	it('HTML과 DOM-backed Raster Artifact를 같은 PNG leaf로 변환한다', async () => {
		const html = createTemplateRasterArtifact({
			html: '<div>card</div>',
			width: 600,
			height: 300,
		})
		const [element] = createImageArtifacts({ images: ['/image.png'], color: null }).raster
		if (!element) throw new Error('fixture artifact is missing')

		await expect(
			exportHtmlRasterArtifactAsPng('template', html, PNG_REQUEST),
		).resolves.toMatchObject({
			filename: 'template.png',
		})
		await expect(
			exportElementRasterArtifactAsPng('image', element, PNG_REQUEST),
		).resolves.toMatchObject({
			filename: 'image.png',
		})
		expect(htmlToPng).toHaveBeenCalledWith('<div>card</div>', 600, 300, PNG_REQUEST.options)
		expect(elementToPng).toHaveBeenCalledWith(expect.any(HTMLElement), {
			width: 2048,
			height: 3072,
			...PNG_REQUEST.options,
		})
	})

	it('HTML Raster Artifact를 공통 JPEG leaf로 변환한다', async () => {
		const html = createTemplateRasterArtifact({
			html: '<div>card</div>',
			width: 600,
			height: 300,
		})

		await expect(
			exportHtmlRasterArtifactAsJpeg('template', html, JPEG_REQUEST),
		).resolves.toMatchObject({ filename: 'template.jpg', mimeType: 'image/jpeg' })
		expect(elementToJpeg).toHaveBeenCalledWith(expect.any(HTMLElement), {
			width: 600,
			height: 300,
			quality: 90,
		})
	})

	it('Canvas Raster Artifact를 PNG와 JPEG로 변환하고 preview를 복원한다', async () => {
		const canvas = document.createElement('canvas')
		const render = vi.fn()
		const restore = vi.fn()
		const toBlob = vi
			.spyOn(canvas, 'toBlob')
			.mockImplementation((callback, type) =>
				callback(new Blob([type ?? ''], { type: type ?? '' })),
			)
		const artifact: RasterArtifact<{
			canvas: HTMLCanvasElement
			render(width: number, height: number): void
			restore(): void
		}> = { kind: 'raster', source: { canvas, render, restore } }

		await expect(
			exportCanvasRasterArtifactAsPng('graphic', artifact, PNG_REQUEST, {
				width: 800,
				height: 600,
			}),
		).resolves.toMatchObject({ filename: 'graphic.png', mimeType: 'image/png' })
		await expect(
			exportCanvasRasterArtifactAsJpeg('graphic', artifact, JPEG_REQUEST, {
				width: 640,
				height: 480,
			}),
		).resolves.toMatchObject({ filename: 'graphic.jpg', mimeType: 'image/jpeg' })

		expect(render).toHaveBeenNthCalledWith(1, 800, 600)
		expect(render).toHaveBeenNthCalledWith(2, 640, 480)
		expect(toBlob).toHaveBeenNthCalledWith(1, expect.any(Function), 'image/png', undefined)
		expect(toBlob).toHaveBeenNthCalledWith(2, expect.any(Function), 'image/jpeg', 0.9)
		expect(restore).toHaveBeenCalledTimes(2)
	})

	it('Original Artifact는 변환 없이 원본 Blob을 전달한다', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				blob: () => Promise.resolve(new Blob(['original'], { type: 'image/png' })),
			}),
		)
		const [artifact] = createImageArtifacts({ images: ['/image.png'], color: null }).original
		if (!artifact) throw new Error('fixture artifact is missing')

		await expect(exportOriginalArtifact(artifact)).resolves.toMatchObject({
			filename: 'hd-image-1.png',
			mimeType: 'image/png',
		})
		expect(elementToPng).not.toHaveBeenCalled()
	})
})
