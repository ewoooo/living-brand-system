import type { StudioArtifactKind } from '@/modules/studio-artifact/studio-artifact'
import type { StudioOutputFormat } from './export-contract'

type ExporterCompatibility = {
	artifacts: readonly Exclude<StudioArtifactKind, 'original'>[]
}

/** 파일 형식별 실제 Exporter 입력과 추가 요구사항을 정의하는 정본이다. */
export const EXPORTER_ARTIFACT_COMPATIBILITY = {
	png: { artifacts: ['raster'] },
	jpeg: { artifacts: ['raster'] },
	tiff: { artifacts: ['raster'] },
	pdf: { artifacts: ['raster'] },
	svg: { artifacts: ['vector'] },
	mp4: { artifacts: ['video', 'raster'] },
} as const satisfies Record<StudioOutputFormat, ExporterCompatibility>

export function acceptsExportArtifact(
	format: StudioOutputFormat,
	kind: StudioArtifactKind,
): boolean {
	const compatibility: ExporterCompatibility = EXPORTER_ARTIFACT_COMPATIBILITY[format]
	return compatibility.artifacts.includes(kind as Exclude<StudioArtifactKind, 'original'>)
}
