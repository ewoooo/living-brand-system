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

export type VectorScene = {
	width: number
	height: number
	background: string
	primitives: readonly (
		| {
				kind: 'line'
				x1: number
				y1: number
				x2: number
				y2: number
				stroke: string
				strokeWidth: number
				lineCap?: 'butt' | 'round' | 'square'
		  }
		| { kind: 'circle'; cx: number; cy: number; radius: number; fill: string }
	)[]
}

export type VectorSceneArtifact = VectorArtifact<VectorScene>

export type CanvasRasterSource = {
	canvas: HTMLCanvasElement
	render(width: number, height: number): void
	restore(): void
}

export type CanvasVideoSource = {
	canvas: HTMLCanvasElement
	renderFrame(timeSeconds: number, width: number, height: number): void
	restore(): void
}

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
