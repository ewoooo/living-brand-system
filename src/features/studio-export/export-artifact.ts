import type { StudioOutputFormat } from './export-contract'

export const EXPORT_ARTIFACT_KINDS = ['raster', 'vector', 'video'] as const

export type ExportArtifactKind = (typeof EXPORT_ARTIFACT_KINDS)[number]

type Artifact<Kind extends ExportArtifactKind, Source> = {
	kind: Kind
	source: Source
}

export type RasterArtifact<Source = unknown> = Artifact<'raster', Source>
export type VectorArtifact<Source = unknown> = Artifact<'vector', Source>
export type VideoArtifact<Source = unknown> = Artifact<'video', Source>

export type ExportArtifact = RasterArtifact | VectorArtifact | VideoArtifact

export type ExportArtifactProducer<Artifact extends ExportArtifact = ExportArtifact> = () =>
	| Artifact
	| Promise<Artifact>

/** 파일 형식별로 Exporter가 변환할 수 있는 Artifact 종류를 정의하는 정본이다. */
export const EXPORTER_ARTIFACT_COMPATIBILITY = {
	png: ['raster', 'vector'],
	jpeg: ['raster', 'vector'],
	tiff: ['raster', 'vector'],
	pdf: ['raster', 'vector'],
	svg: ['vector'],
	mp4: ['video'],
} as const satisfies Record<StudioOutputFormat, readonly ExportArtifactKind[]>

export function acceptsExportArtifact(
	format: StudioOutputFormat,
	kind: ExportArtifactKind,
): boolean {
	return (EXPORTER_ARTIFACT_COMPATIBILITY[format] as readonly ExportArtifactKind[]).includes(kind)
}
