export const STUDIO_OUTPUT_FORMATS = ['png', 'jpeg', 'tiff', 'pdf', 'svg', 'mp4'] as const

export type StudioOutputFormat = (typeof STUDIO_OUTPUT_FORMATS)[number]

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
	| { format: 'original'; options: Record<never, never> }
	| {
			format: 'png'
			colorProfile: RgbColorProfile
			options: { scale: number; transparent: boolean }
	  }
	| {
			format: 'jpeg'
			colorProfile: ColorProfile
			options: { quality: number }
	  }
	| {
			format: 'tiff'
			colorProfile: ColorProfile
			options: { ppi: 72 | 150 | 300; compression: 'lzw' }
	  }
	| {
			format: 'pdf'
			colorProfile: ColorProfile
			options: { ppi: 72 | 150 | 300; bleedMm: number }
	  }
	| {
			format: 'svg'
			colorProfile: RgbColorProfile
			options: { outlineText: boolean }
	  }
	| { format: 'mp4'; options: VideoExportSpec }

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
