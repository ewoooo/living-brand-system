'use client'

import { useState } from 'react'
import type { StudioOutputFormat } from '../export-contract'
import {
	createImageExportSource,
	type ImageExportRequest,
	type ImageRasterArtifact,
} from '../services/export-image.client'
import type { StudioOutputCapability } from '../studio-output'
import { useExport } from './use-export'

/** Image Raster Artifact의 선택·패키징 정책을 기존 export 실행 bridge에 연결한다. */
export function useImageExport({
	artifact,
	capability,
	selected,
}: {
	artifact: ImageRasterArtifact | null
	capability: StudioOutputCapability
	selected: number | null
}) {
	const [selectedFormat, setSelectedFormat] = useState<StudioOutputFormat | null>(null)
	const formats = resolveImageExportFormats(capability.formats)
	const format =
		selectedFormat && formats.includes(selectedFormat) ? selectedFormat : (formats[0] ?? null)
	const imageExport = useExport<ImageExportRequest>({
		capability,
		canExport: ({ package: packageFormat, scope }) =>
			Boolean(
				artifact &&
					(!packageFormat || capability.packages?.includes(packageFormat)) &&
					(scope === 'all' ||
						(selected !== null && artifact.source.images[selected] !== undefined)),
			),
		source: createImageExportSource(artifact, selected),
	})
	const selectedRequest = createImageExportRequest(format, 'selected')
	const allRequest = createImageExportRequest(format, 'all')
	const selectedOriginalRequest = createImageOriginalExportRequest('selected')
	const allOriginalRequest = createImageOriginalExportRequest('all')
	const canExportSelected = Boolean(selectedRequest && imageExport.canExport(selectedRequest))
	const canExportAll = Boolean(allRequest && imageExport.canExport(allRequest))
	const canExportSelectedOriginal = imageExport.canExport(selectedOriginalRequest)
	const canExportAllOriginal = imageExport.canExport(allOriginalRequest)

	return {
		busy: imageExport.exporting !== null,
		error: imageExport.error,
		formats,
		format,
		setFormat: (next: StudioOutputFormat) => {
			if (formats.includes(next)) setSelectedFormat(next)
		},
		selected: {
			canExport: canExportSelected,
			run: () => {
				if (selectedRequest) void imageExport.run(selectedRequest)
			},
		},
		all: {
			canExport: canExportAll,
			run: () => {
				if (allRequest) void imageExport.run(allRequest)
			},
		},
		original: {
			available: canExportSelectedOriginal || canExportAllOriginal,
			selected: {
				canExport: canExportSelectedOriginal,
				run: () => void imageExport.run(selectedOriginalRequest),
			},
			all: {
				canExport: canExportAllOriginal,
				run: () => void imageExport.run(allOriginalRequest),
			},
		},
	}
}

function createImageExportRequest(
	format: StudioOutputFormat | null,
	scope: ImageExportRequest['scope'],
): ImageExportRequest | null {
	const packageFormat = scope === 'all' ? { package: 'zip' as const } : {}
	if (format === 'png') {
		return {
			format,
			colorProfile: { space: 'rgb', icc: 'srgb' },
			options: { scale: 1, transparent: true },
			scope,
			...packageFormat,
		}
	}
	if (format === 'jpeg') {
		return {
			format,
			colorProfile: { space: 'rgb', icc: 'srgb' },
			options: { quality: 90 },
			scope,
			...packageFormat,
		}
	}
	return null
}

function createImageOriginalExportRequest(scope: ImageExportRequest['scope']): ImageExportRequest {
	return {
		format: 'original',
		options: {},
		scope,
		...(scope === 'all' ? { package: 'zip' as const } : {}),
	}
}

function resolveImageExportFormats(
	formats: readonly StudioOutputFormat[],
): readonly StudioOutputFormat[] {
	return formats.filter((candidate) => createImageExportRequest(candidate, 'selected') !== null)
}
