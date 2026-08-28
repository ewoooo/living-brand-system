import type { StudioVideoFrameRate } from '@/modules/studio-artifact/studio-artifact'
import type { PrintPpi } from './print-policy'

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
	fps: StudioVideoFrameRate
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
			options: { quality: number; scale: number }
	  }
	| {
			artifact: 'raster'
			format: 'tiff'
			colorProfile: CmykColorProfile
			options: { ppi: PrintPpi; compression: 'lzw' }
	  }
	| {
			artifact: 'raster'
			format: 'pdf'
			colorProfile: CmykColorProfile
			options: { ppi: PrintPpi; bleedMm: number }
	  }
	| { artifact: 'raster'; format: 'mp4'; options: VideoExportSpec }
	| {
			artifact: 'vector'
			format: 'svg'
			colorProfile: RgbColorProfile
			options: { width: number; height: number; outlineText: boolean }
	  }
	// 인쇄용 벡터 PDF. 판 전체를 굽는 래스터 PDF와 달리 도형과 윤곽선을 그대로 싣는다.
	// 🔑 `ppi`는 화질이 아니라 **페이지 치수**를 정한다 — 벡터라 해상도 개념이 없다.
	| {
			artifact: 'vector'
			format: 'pdf'
			colorProfile: CmykColorProfile
			options: { width: number; height: number; outlineText: boolean; ppi: PrintPpi }
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
