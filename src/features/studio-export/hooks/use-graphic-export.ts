'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { GraphicStudioConfig } from '@/features/graphic-generation/domain/graphic-studio-config'
import type { GraphicBrowserArtifacts } from '@/features/graphic-generation/runtime/client/graphic-runtime.client'
import { getGraphicStudioVectorArtifact } from '@/features/graphic-generation/runtime/graphic-studio-runtime'
import type { ControllerValues } from '@/modules/studio-controller/controller-definition'
import type { ExportRequest, StudioOutputFormat, VideoExportSpec } from '../export-contract'
import type { StudioExportSource } from '../services/execute-studio-export'
import {
	exportCanvasRasterArtifactAsJpeg,
	exportCanvasRasterArtifactAsPng,
	exportVectorArtifactAsSvg,
	exportVideoArtifactAsMp4,
} from '../services/export-artifact.client'
import { useExport } from './use-export'

type GraphicOutputSize = { width: number; height: number }

export type GraphicOutputDraft =
	| { format: 'svg'; width: number | null; height: number | null }
	| {
			format: 'mp4'
			width: number
			height: number
			fps: VideoExportSpec['fps']
			durationSeconds: number
	  }
	| {
			format: 'png' | 'jpeg'
			width: number | null
			height: number | null
	  }

export type GraphicExportView = ReturnType<typeof useGraphicExport>['output']
type GraphicExportRequest =
	| Extract<ExportRequest, { format: 'svg' | 'mp4' }>
	| (Extract<ExportRequest, { artifact: 'raster'; format: 'png' | 'jpeg' }> & {
			size: GraphicOutputSize
	  })

/** Graphic Artifact와 공통 Export Layer 사이의 format 선택·요청·실행 상태를 소유한다. */
export function useGraphicExport({
	artifacts,
	config,
	values,
	viewport,
}: {
	artifacts: GraphicBrowserArtifacts | null
	config: GraphicStudioConfig
	values: ControllerValues
	viewport: GraphicOutputSize | null
}) {
	const [draftState, setDraftState] = useState(() => ({
		profileId: config.id,
		draft: createGraphicOutputDraft(config),
	}))
	const draft =
		draftState.profileId === config.id
			? draftState.draft
			: createGraphicOutputDraft(config, undefined, viewport)

	const setDraft = useCallback(
		(update: (current: GraphicOutputDraft | null) => GraphicOutputDraft | null) => {
			setDraftState((current) => ({
				profileId: config.id,
				draft: update(
					current.profileId === config.id
						? current.draft
						: createGraphicOutputDraft(config),
				),
			}))
		},
		[config],
	)
	useEffect(() => {
		if (!viewport) return
		setDraft((current) =>
			current &&
			current.format !== 'mp4' &&
			(current.width === null || current.height === null)
				? { ...current, ...normalizeOutputSize(viewport) }
				: current,
		)
	}, [setDraft, viewport])
	const setFormat = useCallback(
		(format: StudioOutputFormat) => {
			if (!config.output.formats.includes(format)) return
			setDraft(() => createGraphicOutputDraft(config, format, viewport))
		},
		[config, setDraft, viewport],
	)
	const setSize = useCallback(
		(size: GraphicOutputSize) => {
			if (!validOutputSize(size)) return
			setDraft((current) => {
				if (!current) return current
				if (current.format === 'mp4') {
					const video = config.output.video?.mp4
					if (!video || size.width > video.maxWidth || size.height > video.maxHeight) {
						return current
					}
				}
				return { ...current, ...size }
			})
		},
		[config.output.video, setDraft],
	)
	const setFps = useCallback(
		(fps: VideoExportSpec['fps']) => {
			if (!config.output.video?.mp4.fps.includes(fps)) return
			setDraft((current) => (current?.format === 'mp4' ? { ...current, fps } : current))
		},
		[config.output.video, setDraft],
	)
	const setDuration = useCallback(
		(durationSeconds: number) => {
			const maxDuration = config.output.video?.mp4.maxDurationSeconds
			if (!Number.isFinite(durationSeconds) || durationSeconds <= 0 || !maxDuration) return
			setDraft((current) =>
				current?.format === 'mp4' && durationSeconds <= maxDuration
					? { ...current, durationSeconds }
					: current,
			)
		},
		[config.output.video, setDraft],
	)
	const createVectorArtifact = useCallback(
		(width: number, height: number) =>
			getGraphicStudioVectorArtifact(config, values, { width, height }),
		[config, values],
	)
	const source = useMemo((): StudioExportSource<GraphicExportRequest> => {
		const raster = artifacts?.raster
		const video = artifacts?.video
		return {
			raster: raster
				? {
						png: (request) =>
							exportCanvasRasterArtifactAsPng(
								config.id,
								raster,
								request,
								request.size,
							),
						jpeg: (request) =>
							exportCanvasRasterArtifactAsJpeg(
								config.id,
								raster,
								request,
								request.size,
							),
					}
				: undefined,
			vector: {
				svg: (request) => {
					const artifact = createVectorArtifact(
						request.options.width,
						request.options.height,
					)
					if (!artifact) throw new Error('SVG export is unavailable.')
					return exportVectorArtifactAsSvg(config.id, artifact)
				},
			},
			video: video
				? { mp4: (request) => exportVideoArtifactAsMp4(config.id, video, request) }
				: undefined,
		}
	}, [artifacts, config.id, createVectorArtifact])
	const graphicExport = useExport<GraphicExportRequest>({
		capability: config.output,
		canExport: (request) => {
			switch (request.artifact) {
				case 'raster':
					return Boolean(artifacts?.raster)
				case 'vector':
					return (
						createVectorArtifact(request.options.width, request.options.height) !== null
					)
				case 'video':
					return Boolean(artifacts?.video)
			}
		},
		source,
	})
	const request = createGraphicExportRequest(config, draft)

	return {
		output: {
			draft,
			canExport: Boolean(request && graphicExport.canExport(request)),
			busy: graphicExport.exporting !== null,
			error: graphicExport.error,
			setFormat,
			setSize,
			setFps,
			setDuration,
			run: () => {
				if (request) void graphicExport.run(request)
			},
		},
	}
}

function createGraphicOutputDraft(
	config: GraphicStudioConfig,
	requestedFormat?: StudioOutputFormat,
	viewport?: GraphicOutputSize | null,
): GraphicOutputDraft | null {
	const format =
		requestedFormat ??
		config.output.formats.find((candidate) => candidate === 'svg' || candidate === 'mp4') ??
		config.output.formats[0]
	if (format === 'svg') {
		return { format, width: viewport?.width ?? null, height: viewport?.height ?? null }
	}
	if (format === 'mp4') {
		const video = config.output.video?.mp4
		const fps = video?.fps.includes(30) ? 30 : video?.fps[0]
		if (!video || !fps) return null
		return {
			format,
			width: video.maxWidth,
			height: video.maxHeight,
			fps,
			durationSeconds: Math.min(5, video.maxDurationSeconds),
		}
	}
	return format === 'png' || format === 'jpeg'
		? { format, width: viewport?.width ?? null, height: viewport?.height ?? null }
		: null
}

function createGraphicExportRequest(
	config: GraphicStudioConfig,
	draft: GraphicOutputDraft | null,
): GraphicExportRequest | null {
	if (!draft) return null
	if (draft.format === 'svg') {
		if (draft.width === null || draft.height === null) return null
		return {
			artifact: 'vector',
			format: 'svg',
			colorProfile: {
				space: 'rgb',
				icc: config.output.colorProfiles?.rgb?.[0] ?? 'srgb',
			},
			options: { width: draft.width, height: draft.height, outlineText: false },
		}
	}
	if (draft.format === 'png' || draft.format === 'jpeg') {
		if (draft.width === null || draft.height === null) return null
		const size = { width: draft.width, height: draft.height }
		return draft.format === 'png'
			? {
					artifact: 'raster',
					format: draft.format,
					colorProfile: {
						space: 'rgb',
						icc: config.output.colorProfiles?.rgb?.[0] ?? 'srgb',
					},
					options: { scale: 1, transparent: true },
					size,
				}
			: {
					artifact: 'raster',
					format: draft.format,
					colorProfile: {
						space: 'rgb',
						icc: config.output.colorProfiles?.rgb?.[0] ?? 'srgb',
					},
					options: { quality: 90 },
					size,
				}
	}
	if (draft.format !== 'mp4') return null
	const video = config.output.video?.mp4
	if (!video) return null
	return {
		artifact: 'video',
		format: 'mp4',
		options: {
			container: 'mp4',
			codec: video.codec,
			colorSpace: video.colorSpace,
			width: draft.width,
			height: draft.height,
			fps: draft.fps,
			durationSeconds: draft.durationSeconds,
		},
	}
}

function validOutputSize(size: GraphicOutputSize): boolean {
	return (
		Number.isInteger(size.width) &&
		size.width > 0 &&
		Number.isInteger(size.height) &&
		size.height > 0
	)
}

function normalizeOutputSize(size: GraphicOutputSize): GraphicOutputSize {
	return {
		width: Math.max(1, Math.round(size.width)),
		height: Math.max(1, Math.round(size.height)),
	}
}
