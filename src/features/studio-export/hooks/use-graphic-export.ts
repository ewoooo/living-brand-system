'use client'

import { useCallback, useEffect, useState } from 'react'
import type { GraphicStudioConfig } from '@/features/graphic-generation/domain/graphic-studio-config'
import type { GraphicBrowserArtifacts } from '@/features/graphic-generation/runtime/client/graphic-runtime.client'
import { getGraphicStudioVectorArtifact } from '@/features/graphic-generation/runtime/graphic-studio-runtime'
import type { ControllerValues } from '@/modules/studio-controller/controller-definition'
import type { ExportRequest, StudioOutputFormat, VideoExportSpec } from '../export-contract'
import { PRINT_PPI_VALUES, type PrintPpi, resolveDefaultPrintPpi } from '../print-policy'
import { createRasterExportRequest } from '../services/create-raster-export-request'
import { executeArtifactExport } from '../services/export-artifact.client'
import { acceptsPrintPpi } from '../studio-output'
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
	// 🔑 `ppi`는 여기 없다 — 해상도는 형식이 아니라 **판**의 성질이라 draft 밖에 산다.
	//    형식을 갈아도 판의 물리 크기가 따라 바뀌면 안 된다.
	| {
			format: 'tiff' | 'pdf'
			width: number | null
			height: number | null
	  }

export type GraphicExportView = ReturnType<typeof useGraphicExport>['output']
type GraphicExportRequest =
	| Extract<ExportRequest, { artifact: 'vector' | 'video' }>
	| (Extract<ExportRequest, { artifact: 'raster' }> & {
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
	const ppiOptions = config.output.print?.ppi ?? PRINT_PPI_VALUES
	const [ppi, setPpi] = useState<PrintPpi>(() => resolveDefaultPrintPpi(config.output.print?.ppi))
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
	const changePpi = useCallback(
		(next: PrintPpi) => {
			// 🔑 프리셋 목록이 아니라 유효 범위로 받는다 — 직접 입력한 값이 조용히 무시되면 안 된다.
			if (acceptsPrintPpi(config.output, next)) setPpi(next)
		},
		[config.output],
	)
	const createVectorArtifact = useCallback(
		(width: number, height: number) =>
			getGraphicStudioVectorArtifact(config, values, { width, height }),
		[config, values],
	)
	const execute = useCallback(
		(request: GraphicExportRequest) => {
			const artifact =
				request.artifact === 'raster'
					? artifacts?.raster
					: request.artifact === 'video'
						? artifacts?.video
						: createVectorArtifact(request.options.width, request.options.height)
			if (!artifact) throw new Error(`${request.artifact} export is unavailable.`)
			return executeArtifactExport({
				artifact,
				fileName: config.id,
				renderSize: request.artifact === 'raster' ? request.size : undefined,
				request,
			})
		},
		[artifacts, config.id, createVectorArtifact],
	)
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
		execute,
	})
	const request = createGraphicExportRequest(config, draft, ppi)

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
			ppi,
			ppiOptions,
			setPpi: changePpi,
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
	if (format === 'png' || format === 'jpeg') {
		return { format, width: viewport?.width ?? null, height: viewport?.height ?? null }
	}
	if (format === 'tiff' || format === 'pdf') {
		return { format, width: viewport?.width ?? null, height: viewport?.height ?? null }
	}
	return null
}

function createGraphicExportRequest(
	config: GraphicStudioConfig,
	draft: GraphicOutputDraft | null,
	ppi: PrintPpi,
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
	if (
		draft.format === 'png' ||
		draft.format === 'jpeg' ||
		draft.format === 'tiff' ||
		draft.format === 'pdf'
	) {
		if (draft.width === null || draft.height === null) return null
		const size = { width: draft.width, height: draft.height }
		const request = createRasterExportRequest(draft.format, config.output, { ...size, ppi })
		return request ? { ...request, size } : null
	}
	if (draft.format !== 'mp4') return null
	const video = config.output.video?.mp4
	if (!video) return null
	const options = {
		container: 'mp4' as const,
		codec: video.codec,
		colorSpace: video.colorSpace,
		width: draft.width,
		height: draft.height,
		fps: draft.fps,
		durationSeconds: draft.durationSeconds,
	}
	return config.artifacts.video
		? {
				artifact: 'video',
				format: 'mp4',
				options,
			}
		: {
				artifact: 'raster',
				format: 'mp4',
				options,
				size: { width: draft.width, height: draft.height },
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
