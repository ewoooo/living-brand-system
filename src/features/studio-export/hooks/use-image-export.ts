'use client'

import { useState } from 'react'
import type { ImageArtifacts } from '@/features/image-generation/runtime/image-artifact.client'
import { exportResultsToZip } from '../adapters/export-results-to-zip.client'
import type { ExportRequest, ExportResult, StudioOutputFormat } from '../export-contract'
import type { StudioExportSource } from '../services/execute-studio-export'
import {
	exportElementRasterArtifactAsJpeg,
	exportElementRasterArtifactAsPng,
	exportOriginalArtifact,
} from '../services/export-artifact.client'
import type { StudioOutputCapability } from '../studio-output'
import { useExport } from './use-export'

export type ImageExportView = ReturnType<typeof useImageExport>
type ImageExportRequest = (
	| Extract<ExportRequest, { artifact: 'original' }>
	| Extract<ExportRequest, { artifact: 'raster'; format: 'png' | 'jpeg' }>
) & { scope: 'selected' | 'all'; package?: 'zip' }

/** Image Artifact의 선택·패키징 정책을 공통 export 실행 경계에 연결한다. */
export function useImageExport({
	artifacts,
	capability,
	selected,
}: {
	artifacts: ImageArtifacts | null
	capability: StudioOutputCapability
	selected: number | null
}) {
	const [selectedFormat, setSelectedFormat] = useState<StudioOutputFormat | null>(null)
	const formats = capability.formats
	const format =
		selectedFormat && formats.includes(selectedFormat) ? selectedFormat : (formats[0] ?? null)
	const imageExport = useExport<ImageExportRequest>({
		capability,
		canExport: ({ artifact, package: packageFormat, scope }) => {
			const items = artifact === 'original' ? artifacts?.original : artifacts?.raster
			return Boolean(
				items?.length &&
					(!packageFormat || capability.packages?.includes(packageFormat)) &&
					(scope === 'all' || (selected !== null && items[selected] !== undefined)),
			)
		},
		source: imageExportSource(artifacts, selected),
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

function imageExportSource(
	artifacts: ImageArtifacts | null,
	selected: number | null,
): StudioExportSource<ImageExportRequest> {
	if (!artifacts) return {}
	return {
		original: (request) =>
			exportImageScope(artifacts.original, selected, request, exportOriginalArtifact),
		raster: {
			png: (request) =>
				exportImageScope(artifacts.raster, selected, request, (artifact, index) =>
					exportElementRasterArtifactAsPng(`hd-image-${index + 1}`, artifact, request),
				),
			jpeg: (request) =>
				exportImageScope(artifacts.raster, selected, request, (artifact, index) =>
					exportElementRasterArtifactAsJpeg(`hd-image-${index + 1}`, artifact, request),
				),
		},
	}
}

async function exportImageScope<Artifact>(
	artifacts: readonly Artifact[],
	selected: number | null,
	request: ImageExportRequest,
	exportOne: (artifact: Artifact, index: number) => Promise<ExportResult>,
): Promise<ExportResult | readonly ExportResult[]> {
	if (request.scope === 'selected') {
		if (selected === null || !artifacts[selected]) {
			throw new Error('저장할 이미지를 선택해 주세요.')
		}
		return exportOne(artifacts[selected], selected)
	}
	const items = await Promise.all(artifacts.map(exportOne))
	return request.package
		? exportResultsToZip({ format: request.package, filename: 'hd-images.zip', items })
		: items
}

function createImageExportRequest(
	format: StudioOutputFormat | null,
	scope: ImageExportRequest['scope'],
): ImageExportRequest | null {
	const packageFormat = scope === 'all' ? { package: 'zip' as const } : {}
	if (format === 'png') {
		return {
			artifact: 'raster',
			format,
			colorProfile: { space: 'rgb', icc: 'srgb' },
			options: { scale: 1, transparent: true },
			scope,
			...packageFormat,
		}
	}
	if (format === 'jpeg') {
		return {
			artifact: 'raster',
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
		artifact: 'original',
		options: {},
		scope,
		...(scope === 'all' ? { package: 'zip' as const } : {}),
	}
}
