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
