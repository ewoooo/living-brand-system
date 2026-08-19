// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
	createTemplateRasterArtifact,
	type TemplateVideoArtifact,
} from '@/features/template-customization/runtime/template-runtime.client'
import { executeArtifactExport } from '../services/export-artifact.client'
import { useTemplateExport } from './use-template-export'

vi.mock('../adapters/download-export-result.client', () => ({
	downloadExportResult: vi.fn(),
}))
vi.mock('../services/export-artifact.client', () => ({
	executeArtifactExport: vi.fn().mockResolvedValue({
		data: new Blob(['pdf']),
		filename: 'card.pdf',
		mimeType: 'application/pdf',
	}),
}))

describe('useTemplateExport', () => {
	beforeEach(() => vi.mocked(executeArtifactExport).mockClear())

	it('Template은 Raster Artifact와 공통 Print request만 executor에 전달한다', async () => {
		const artifact = createTemplateRasterArtifact({
			html: '<div>card</div>',
			width: 600,
			height: 300,
		})
		const { result } = renderHook(() =>
			useTemplateExport({
				artifact: () => artifact,
				capability: {
					formats: ['pdf'],
					colorProfiles: { cmyk: ['cgats21-crpc6'] },
					print: { ppi: [300] },
				},
				metadata: {
					fileName: 'card',
					width: 600,
					height: 300,
					maxScale: 1,
					controller: { groups: [], values: {} },
				},
			}),
		)

		act(() => result.current.run())
		await waitFor(() => expect(executeArtifactExport).toHaveBeenCalledOnce())
		expect(executeArtifactExport).toHaveBeenCalledWith(
			expect.objectContaining({
				artifact,
				fileName: 'card',
				request: expect.objectContaining({ artifact: 'raster', format: 'pdf' }),
			}),
		)
	})

	const MP4_CAPABILITY = {
		formats: ['mp4'],
		video: {
			mp4: {
				codec: 'h264',
				colorSpace: 'rec709',
				fps: [30],
				maxWidth: 1920,
				maxHeight: 1080,
				maxDurationSeconds: 10,
			},
		},
	} as const
	const MP4_METADATA = {
		fileName: 'card',
		width: 600,
		height: 300,
		maxScale: 1,
		controller: { groups: [], values: {} },
	}

	it('시간축이 있으면 MP4를 Video Artifact로 돌린다', async () => {
		const video = { kind: 'video', source: {} } as unknown as TemplateVideoArtifact
		const { result } = renderHook(() =>
			useTemplateExport({
				artifact: () =>
					createTemplateRasterArtifact({
						html: '<div>card</div>',
						width: 600,
						height: 300,
					}),
				videoArtifact: async () => video,
				capability: MP4_CAPABILITY,
				metadata: MP4_METADATA,
			}),
		)

		act(() => result.current.run())
		await waitFor(() => expect(executeArtifactExport).toHaveBeenCalledOnce())
		expect(executeArtifactExport).toHaveBeenCalledWith(
			expect.objectContaining({
				artifact: video,
				request: expect.objectContaining({ artifact: 'video', format: 'mp4' }),
			}),
		)
	})

	it('배율을 올리면 Video Artifact를 그 프레임 크기로 만든다', async () => {
		// 전경 오버레이는 producer가 받은 크기로 한 번 구워진다 — 배율을 안 넘기면 텍스트가 늘어난다.
		const video = { kind: 'video', source: {} } as unknown as TemplateVideoArtifact
		const produce = vi.fn(async () => video)
		const { result } = renderHook(() =>
			useTemplateExport({
				artifact: () =>
					createTemplateRasterArtifact({
						html: '<div>card</div>',
						width: 600,
						height: 300,
					}),
				videoArtifact: produce,
				capability: MP4_CAPABILITY,
				metadata: { ...MP4_METADATA, maxScale: 2 },
			}),
		)

		act(() => result.current.setScale(2))
		act(() => result.current.run())
		await waitFor(() => expect(produce).toHaveBeenCalledOnce())
		expect(produce).toHaveBeenCalledWith({ width: 1200, height: 600 })
		expect(result.current.outputSize).toEqual({ width: 1200, height: 600 })
	})

	it('허용 배율을 넘는 값은 무시하고 1배로 둔다', () => {
		const { result } = renderHook(() =>
			useTemplateExport({
				artifact: () =>
					createTemplateRasterArtifact({
						html: '<div>card</div>',
						width: 600,
						height: 300,
					}),
				videoArtifact: null,
				capability: MP4_CAPABILITY,
				metadata: MP4_METADATA,
			}),
		)

		expect(result.current.scaleOptions).toEqual([1])
		act(() => result.current.setScale(3))
		expect(result.current.scale).toBe(1)
	})

	it('TIFF·PDF에는 배율을 적용하지 않고 Size도 캔버스 크기로 안내한다', () => {
		// 인쇄 크기는 ppi가 정한다 — 배율을 받은 척하면 사이드바가 안 나올 크기를 안내한다.
		const { result } = renderHook(() =>
			useTemplateExport({
				artifact: () =>
					createTemplateRasterArtifact({
						html: '<div>card</div>',
						width: 600,
						height: 300,
					}),
				videoArtifact: null,
				capability: {
					formats: ['pdf'],
					colorProfiles: { cmyk: ['cgats21-crpc6'] },
					print: { ppi: [300] },
				},
				metadata: { ...MP4_METADATA, maxScale: 4 },
			}),
		)

		act(() => result.current.setScale(4))
		expect(result.current.scaleApplies).toBe(false)
		expect(result.current.scale).toBe(1)
		expect(result.current.outputSize).toEqual({ width: 600, height: 300 })
	})

	it('MP4 Size는 짝수 내림까지 거친 실제 프레임 크기를 안내한다', () => {
		const { result } = renderHook(() =>
			useTemplateExport({
				artifact: () =>
					createTemplateRasterArtifact({
						html: '<div>card</div>',
						width: 601,
						height: 301,
					}),
				videoArtifact: null,
				capability: MP4_CAPABILITY,
				metadata: { ...MP4_METADATA, width: 601, height: 301, maxScale: 1 },
			}),
		)

		expect(result.current.outputSize).toEqual({ width: 600, height: 300 })
	})

	it('시간축이 없어도 MP4는 Raster Artifact로 반드시 나온다', async () => {
		const raster = createTemplateRasterArtifact({
			html: '<div>card</div>',
			width: 600,
			height: 300,
		})
		const { result } = renderHook(() =>
			useTemplateExport({
				artifact: () => raster,
				videoArtifact: null,
				capability: MP4_CAPABILITY,
				metadata: MP4_METADATA,
			}),
		)

		expect(result.current.canExportFormat('mp4')).toBe(true)
		act(() => result.current.run())
		await waitFor(() => expect(executeArtifactExport).toHaveBeenCalledOnce())
		expect(executeArtifactExport).toHaveBeenCalledWith(
			expect.objectContaining({
				artifact: raster,
				request: expect.objectContaining({ artifact: 'raster', format: 'mp4' }),
			}),
		)
	})
})
