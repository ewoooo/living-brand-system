import type { StudioArtifactKind } from '@/modules/studio-artifact/studio-artifact'
import type { StudioOutputFormat } from './export-contract'

export type StudioExporterFeature = 'print'

type ExporterCompatibility = {
	artifact: Exclude<StudioArtifactKind, 'original'>
	requires?: StudioExporterFeature
}

/** 파일 형식별 실제 Exporter 입력과 추가 요구사항을 정의하는 정본이다. */
export const EXPORTER_ARTIFACT_COMPATIBILITY = {
	png: { artifact: 'raster' },
	jpeg: { artifact: 'raster' },
	tiff: { artifact: 'raster', requires: 'print' },
	pdf: { artifact: 'raster', requires: 'print' },
	svg: { artifact: 'vector' },
	mp4: { artifact: 'video' },
} as const satisfies Record<StudioOutputFormat, ExporterCompatibility>

export function acceptsExportArtifact(
	format: StudioOutputFormat,
	kind: StudioArtifactKind,
	features: readonly StudioExporterFeature[] = [],
): boolean {
	const compatibility: ExporterCompatibility = EXPORTER_ARTIFACT_COMPATIBILITY[format]
	return (
		compatibility.artifact === kind &&
		(!compatibility.requires || features.includes(compatibility.requires))
	)
}
