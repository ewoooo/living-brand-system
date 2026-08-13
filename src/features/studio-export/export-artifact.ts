import type { StudioArtifactKind } from '@/modules/studio-artifact/studio-artifact'
import type { StudioOutputFormat } from './export-contract'

/** 파일 형식별로 Exporter가 변환할 수 있는 Artifact 종류를 정의하는 정본이다. */
export const EXPORTER_ARTIFACT_COMPATIBILITY = {
	png: ['raster', 'vector'],
	jpeg: ['raster', 'vector'],
	tiff: ['raster', 'vector'],
	pdf: ['raster', 'vector'],
	svg: ['vector'],
	mp4: ['video'],
} as const satisfies Record<StudioOutputFormat, readonly StudioArtifactKind[]>

export function acceptsExportArtifact(
	format: StudioOutputFormat,
	kind: StudioArtifactKind,
): boolean {
	return (EXPORTER_ARTIFACT_COMPATIBILITY[format] as readonly StudioArtifactKind[]).includes(kind)
}
