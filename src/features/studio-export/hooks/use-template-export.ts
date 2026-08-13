'use client'

import { useState } from 'react'
import type { StudioOutputFormat } from '../export-contract'
import {
	canExportTemplate,
	createTemplateExportRequest,
	type TemplateExportContext,
	type TemplateExportMetadata,
	type TemplateExportRequest,
	type TemplateRasterArtifactProducer,
} from '../services/export-template'
import { createTemplateExportSource } from '../services/export-template.client'
import type { StudioOutputCapability } from '../studio-output'
import { useExport } from './use-export'

export type TemplateExportView = ReturnType<typeof useTemplateExport>

/** Template Raster Artifact·metadata·출력 정책을 기존 export 실행 bridge에 연결한다. */
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
	const formats = capability.formats
	const format =
		selectedFormat && formats.includes(selectedFormat) ? selectedFormat : (formats[0] ?? null)
	const context: TemplateExportContext = { capability, metadata }
	const output = useExport<TemplateExportRequest>({
		capability,
		canExport: (request) => canExportTemplate(request, context),
		source: createTemplateExportSource(artifact, context),
	})
	const request = createRequest(format, metadata)

	const canExportFormat = (candidate: StudioOutputFormat): boolean => {
		const candidateRequest = createRequest(candidate, metadata)
		return Boolean(candidateRequest && output.canExport(candidateRequest))
	}
	const runFormat = (candidate: StudioOutputFormat): void => {
		const candidateRequest = createRequest(candidate, metadata)
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
		canExport: Boolean(request && output.canExport(request)),
		run: () => {
			if (request) void output.run(request)
		},
		canExportFormat,
		runFormat,
	}
}

function createRequest(
	format: StudioOutputFormat | null,
	metadata: TemplateExportMetadata | null,
): TemplateExportRequest | null {
	return format ? createTemplateExportRequest(format, metadata?.printPpi) : null
}
