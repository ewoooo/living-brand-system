'use client'

import { useCallback, useState } from 'react'
import type {
	TemplateRasterArtifactProducer,
	TemplateVideoArtifactProducer,
} from '@/features/template-customization/runtime/template-runtime.client'
import {
	acceptsControllerExecutionValues,
	type ControllerGroupDefinition,
	type ControllerValues,
} from '@/modules/studio-controller/controller-definition'
import type { ExportRequest, StudioOutputFormat, VideoExportSpec } from '../export-contract'
import type { PrintPpi } from '../print-policy'
import { createRasterExportRequest } from '../services/create-raster-export-request'
import { executeArtifactExport } from '../services/export-artifact.client'
import type { StudioOutputCapability } from '../studio-output'
import { useExport } from './use-export'

export type TemplateExportMetadata = {
	fileName: string
	width: number
	height: number
	/** 캔버스 좌표계 대비 허용 최대 출력 배율 — 1이면 배율 선택지가 없다. */
	maxScale: number
	controller: {
		groups: readonly ControllerGroupDefinition[]
		values: Readonly<ControllerValues>
	}
}

export type TemplateExportView = ReturnType<typeof useTemplateExport>
type TemplateExportRequest = Extract<ExportRequest, { artifact: 'raster' | 'video' }>

/** Template Raster Artifact를 공통 ExportRequest와 Artifact executor에 연결한다. */
export function useTemplateExport({
	artifact,
	videoArtifact,
	capability,
	metadata,
}: {
	artifact: TemplateRasterArtifactProducer
	/** 배경 Graphic처럼 시간축이 있는 소스가 있을 때만 MP4가 실제로 움직인다. */
	videoArtifact?: TemplateVideoArtifactProducer | null
	capability: StudioOutputCapability
	metadata: TemplateExportMetadata | null
}) {
	const [selectedFormat, setSelectedFormat] = useState<StudioOutputFormat | null>(null)
	const [ppi, setPpi] = useState<PrintPpi | undefined>(() => capability.print?.ppi[0])
	const [fps, setFps] = useState<VideoExportSpec['fps'] | undefined>(
		() => capability.video?.mp4.fps[0],
	)
	const [durationSeconds, setDurationSeconds] = useState(() =>
		Math.min(5, capability.video?.mp4.maxDurationSeconds ?? 5),
	)
	const [scale, setScale] = useState(1)
	const maxScale = Math.max(1, Math.floor(metadata?.maxScale ?? 1))
	const scaleOptions = Array.from({ length: maxScale }, (_, index) => index + 1)
	const effectiveScale = scaleOptions.includes(scale) ? scale : 1
	const effectivePpi = ppi && capability.print?.ppi.includes(ppi) ? ppi : capability.print?.ppi[0]
	const effectiveFps =
		fps && capability.video?.mp4.fps.includes(fps) ? fps : capability.video?.mp4.fps[0]
	const effectiveDuration = Math.min(
		durationSeconds,
		capability.video?.mp4.maxDurationSeconds ?? durationSeconds,
	)
	const formats = capability.formats
	const format =
		selectedFormat && formats.includes(selectedFormat) ? selectedFormat : (formats[0] ?? null)
	const createRequest = useCallback(
		(candidate: StudioOutputFormat | null): TemplateExportRequest | null => {
			const request =
				candidate && metadata
					? createRasterExportRequest(candidate, capability, {
							width: metadata.width,
							height: metadata.height,
							scale: effectiveScale,
							ppi: effectivePpi,
							fps: effectiveFps,
							durationSeconds: effectiveDuration,
						})
					: null
			// 같은 video spec을 시간축 있는 artifact로 돌린다 — raster MP4는 한 프레임을 반복한다.
			return request?.format === 'mp4' && videoArtifact
				? { artifact: 'video', format: 'mp4', options: request.options }
				: request
		},
		[
			capability,
			effectiveDuration,
			effectiveFps,
			effectivePpi,
			effectiveScale,
			metadata,
			videoArtifact,
		],
	)
	const execute = useCallback(
		async (request: TemplateExportRequest) => {
			if (!metadata) throw new Error('Template export is unavailable.')
			// Video Artifact는 전경을 목표 프레임 크기로 구워야 하므로 요청 해상도를 넘긴다.
			if (request.artifact === 'video') {
				if (!videoArtifact) throw new Error('Template export is unavailable.')
				const { width, height } = request.options
				return executeArtifactExport({
					artifact: await videoArtifact({ width, height }),
					fileName: metadata.fileName,
					request,
				})
			}
			return executeArtifactExport({
				artifact: await artifact(),
				fileName: metadata.fileName,
				request,
			})
		},
		[artifact, metadata, videoArtifact],
	)
	const output = useExport<TemplateExportRequest>({
		capability,
		canExport: () =>
			Boolean(
				metadata &&
					acceptsControllerExecutionValues(
						metadata.controller.groups,
						metadata.controller.values,
					),
			),
		execute,
	})
	const request = createRequest(format)
	const runFormat = (candidate: StudioOutputFormat): void => {
		const candidateRequest = createRequest(candidate)
		if (candidateRequest) void output.run(candidateRequest)
	}

	return {
		busy: output.exporting !== null,
		error: output.error,
		formats,
		format,
		setFormat: (next: StudioOutputFormat) => {
			if (formats.includes(next)) setSelectedFormat(next)
		},
		ppi: effectivePpi ?? null,
		setPpi: (next: PrintPpi) => {
			if (capability.print?.ppi.includes(next)) setPpi(next)
		},
		fps: effectiveFps ?? null,
		setFps: (next: VideoExportSpec['fps']) => {
			if (capability.video?.mp4.fps.includes(next)) setFps(next)
		},
		durationSeconds: effectiveDuration,
		setDuration: (next: number) => {
			const max = capability.video?.mp4.maxDurationSeconds
			if (max && next > 0 && next <= max) setDurationSeconds(next)
		},
		scale: effectiveScale,
		scaleOptions,
		setScale: (next: number) => {
			if (scaleOptions.includes(next)) setScale(next)
		},
		/** 배율을 반영한 실제 출력 픽셀 크기 — 사이드바가 Size 행에 그대로 보여 준다. */
		outputSize: metadata
			? { width: metadata.width * effectiveScale, height: metadata.height * effectiveScale }
			: null,
		canExport: Boolean(request && output.canExport(request)),
		run: () => {
			if (request) void output.run(request)
		},
		canExportFormat: (candidate: StudioOutputFormat) => {
			const candidateRequest = createRequest(candidate)
			return Boolean(candidateRequest && output.canExport(candidateRequest))
		},
		runFormat,
	}
}
