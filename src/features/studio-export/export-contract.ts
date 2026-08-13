export const STUDIO_OUTPUT_FORMATS = ['png', 'jpeg', 'tiff', 'pdf', 'svg', 'mp4'] as const

export type StudioOutputFormat = (typeof STUDIO_OUTPUT_FORMATS)[number]

export const STUDIO_OUTPUT_FORMAT_OPTIONS: readonly {
	label: string
	value: StudioOutputFormat
}[] = STUDIO_OUTPUT_FORMATS.map((value) => ({ label: value.toUpperCase(), value }))

export type RgbColorProfile = {
	space: 'rgb'
	icc: 'srgb' | 'display-p3'
}

export type CmykIccProfile = 'cgats21-crpc6'

export type CmykColorProfile = {
	space: 'cmyk'
	icc: CmykIccProfile
}

export type ColorProfile = RgbColorProfile | CmykColorProfile

export type VideoExportSpec = {
	container: 'mp4'
	codec: 'h264'
	durationSeconds: number
	fps: 24 | 30 | 60
	width: number
	height: number
	colorSpace: 'rec709'
}

export type ExportRequest =
	| { artifact: 'original'; options: Record<string, never> }
	| {
			artifact: 'raster'
			format: 'png'
			colorProfile: RgbColorProfile
			options: { scale: number; transparent: boolean }
	  }
	| {
			artifact: 'raster'
			format: 'jpeg'
			colorProfile: ColorProfile
			options: { quality: number }
	  }
	| {
			artifact: 'raster'
			format: 'tiff'
			colorProfile: ColorProfile
			options: { ppi: 72 | 150 | 300; compression: 'lzw' }
	  }
	| {
			artifact: 'raster'
			format: 'pdf'
			colorProfile: ColorProfile
			options: { ppi: 72 | 150 | 300; bleedMm: number }
	  }
	| {
			artifact: 'vector'
			format: 'svg'
			colorProfile: RgbColorProfile
			options: { width: number; height: number; outlineText: boolean }
	  }
	| { artifact: 'video'; format: 'mp4'; options: VideoExportSpec }

export type ExportResult = {
	data: Blob
	filename: string
	mimeType: string
}

export type ExportPackageRequest = {
	format: 'zip'
	filename: string
	items: readonly ExportResult[]
}
