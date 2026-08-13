export const STUDIO_ARTIFACT_KINDS = ['raster', 'vector', 'video'] as const

export type StudioArtifactKind = (typeof STUDIO_ARTIFACT_KINDS)[number]

type Artifact<Kind extends StudioArtifactKind, Source> = {
	kind: Kind
	source: Source
}

export type RasterArtifact<Source = unknown> = Artifact<'raster', Source>
export type VectorArtifact<Source = unknown> = Artifact<'vector', Source>
export type VideoArtifact<Source = unknown> = Artifact<'video', Source>

export type StudioArtifact = RasterArtifact | VectorArtifact | VideoArtifact

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

export type StudioArtifactProducer<Artifact extends StudioArtifact = StudioArtifact> = () =>
	| Artifact
	| Promise<Artifact>

/** Canvas source를 임시 크기로 읽고 성공·실패와 관계없이 preview 상태를 복원한다. */
export function withCanvasRasterSource<Result>(
	source: CanvasRasterSource,
	width: number,
	height: number,
	readCanvas: (canvas: HTMLCanvasElement) => Result,
): Result {
	try {
		source.render(width, height)
		return readCanvas(source.canvas)
	} finally {
		source.restore()
	}
}
