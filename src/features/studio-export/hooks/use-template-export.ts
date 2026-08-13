'use client'

import { useCallback, useState } from 'react'
import type { TemplateRasterArtifactProducer } from '@/features/template-customization/runtime/template-runtime.client'
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
	controller: {
		groups: readonly ControllerGroupDefinition[]
		values: Readonly<ControllerValues>
	}
}

export type TemplateExportView = ReturnType<typeof useTemplateExport>
type TemplateExportRequest = Extract<ExportRequest, { artifact: 'raster' }>

/** Template Raster Artifact를 공통 ExportRequest와 Artifact executor에 연결한다. */
export function useTemplateExport({
	artifact,
	capability,
	metadata,
}: {
	artifact: TemplateRasterArtifactProducer
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
		(candidate: StudioOutputFormat | null): TemplateExportRequest | null =>
			candidate && metadata
				? createRasterExportRequest(candidate, capability, {
						width: metadata.width,
						height: metadata.height,
						ppi: effectivePpi,
						fps: effectiveFps,
						durationSeconds: effectiveDuration,
					})
				: null,
		[capability, effectiveDuration, effectiveFps, effectivePpi, metadata],
	)
	const execute = useCallback(
		async (request: TemplateExportRequest) => {
			if (!metadata) throw new Error('Template export is unavailable.')
			return executeArtifactExport({
				artifact: await artifact(),
				fileName: metadata.fileName,
				request,
			})
		},
		[artifact, metadata],
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
