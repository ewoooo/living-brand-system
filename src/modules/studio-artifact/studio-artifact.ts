export const STUDIO_ARTIFACT_KINDS = ['raster', 'vector', 'video', 'original'] as const

export type StudioArtifactKind = (typeof STUDIO_ARTIFACT_KINDS)[number]

export type StudioVideoFrameRate = 24 | 30 | 60

export type StudioArtifactCapabilities = {
	raster?: Record<string, never>
	vector?: Record<string, never>
	video?: {
		fps: readonly StudioVideoFrameRate[]
		maxWidth: number
		maxHeight: number
		maxDurationSeconds: number
	}
	original?: Record<string, never>
}

export function parseStudioArtifactCapabilities(input: unknown): StudioArtifactCapabilities {
	if (!input || typeof input !== 'object' || Array.isArray(input)) {
		throw new Error('Studio Runtime Artifact capability가 객체가 아닙니다.')
	}
	const artifacts = input as Record<string, unknown>
	for (const kind of Object.keys(artifacts)) {
		if (!STUDIO_ARTIFACT_KINDS.includes(kind as StudioArtifactKind)) {
			throw new Error(`Studio Runtime Artifact 종류가 올바르지 않습니다: ${kind}`)
		}
	}
	for (const kind of ['raster', 'vector', 'original'] as const) {
		const capability = artifacts[kind]
		if (
			capability !== undefined &&
			(!capability ||
				typeof capability !== 'object' ||
				Array.isArray(capability) ||
				Object.keys(capability).length > 0)
		) {
			throw new Error(`Studio Runtime ${kind} capability가 올바르지 않습니다.`)
		}
	}
	if (artifacts.video !== undefined) parseVideoCapability(artifacts.video)
	return input as StudioArtifactCapabilities
}

export function getStudioArtifactKinds(
	capabilities: StudioArtifactCapabilities,
): readonly StudioArtifactKind[] {
	return STUDIO_ARTIFACT_KINDS.filter((kind) => capabilities[kind] !== undefined)
}

function parseVideoCapability(input: unknown): void {
	if (!input || typeof input !== 'object' || Array.isArray(input)) {
		throw new Error('Studio Runtime video capability가 객체가 아닙니다.')
	}
	const video = input as Record<string, unknown>
	const keys = new Set(['fps', 'maxWidth', 'maxHeight', 'maxDurationSeconds'])
	if (Object.keys(video).some((key) => !keys.has(key))) {
		throw new Error('Studio Runtime video capability에 알 수 없는 필드가 있습니다.')
	}
	if (
		!Array.isArray(video.fps) ||
		video.fps.length === 0 ||
		video.fps.some((fps) => fps !== 24 && fps !== 30 && fps !== 60) ||
		new Set(video.fps).size !== video.fps.length
	) {
		throw new Error('Studio Runtime video fps가 올바르지 않습니다.')
	}
	for (const key of ['maxWidth', 'maxHeight', 'maxDurationSeconds'] as const) {
		if (typeof video[key] !== 'number' || !Number.isFinite(video[key]) || video[key] <= 0) {
			throw new Error(`Studio Runtime video ${key}가 양수가 아닙니다.`)
		}
	}
}

type Artifact<Kind extends StudioArtifactKind, Source> = {
	kind: Kind
	source: Source
}

export type RasterRenderOptions = {
	width?: number
	height?: number
}

export type RasterSurface =
	| {
			kind: 'canvas'
			element: HTMLCanvasElement
			width: number
			height: number
	  }
	| {
			kind: 'element'
			element: HTMLElement
			width: number
			height: number
	  }

export type RasterArtifactSource = {
	withSurface<Result>(
		options: RasterRenderOptions,
		consume: (surface: RasterSurface) => Result | Promise<Result>,
	): Result | Promise<Result>
}

export type RasterArtifact = Artifact<'raster', RasterArtifactSource>
export type VectorArtifact<Source = unknown> = Artifact<'vector', Source>
export type VideoArtifact<Source = unknown> = Artifact<'video', Source>
export type OriginalArtifact<Source = unknown> = Artifact<'original', Source>

export type StudioArtifact = RasterArtifact | VectorArtifact | VideoArtifact | OriginalArtifact

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

export type BlobOriginalSource = {
	load(): Promise<Blob>
	filename(blob: Blob): string
	mimeType(blob: Blob): string
}

export type CanvasVideoSource = {
	canvas: HTMLCanvasElement
	renderFrame(timeSeconds: number, width: number, height: number): void
	restore(): void
}

export type StudioArtifactProducer<Artifact extends StudioArtifact = StudioArtifact> = () =>
	| Artifact
	| Promise<Artifact>
