import { DEFAULT_CMYK_ICC_PROFILE } from '../color-profile'
import type { ExportRequest, StudioOutputFormat, VideoExportSpec } from '../export-contract'
import type { PrintPpi } from '../print-policy'
import type { StudioOutputCapability } from '../studio-output'

export type RasterExportSettings = {
	width: number
	height: number
	ppi?: PrintPpi
	fps?: VideoExportSpec['fps']
	durationSeconds?: number
}

/** Effective output capability와 현재 설정을 완전한 Raster ExportRequest로 정규화한다. */
export function createRasterExportRequest(
	format: StudioOutputFormat,
	capability: StudioOutputCapability,
	settings: RasterExportSettings,
): Extract<ExportRequest, { artifact: 'raster' }> | null {
	if (!capability.formats.includes(format)) return null
	switch (format) {
		case 'png':
			return {
				artifact: 'raster',
				format,
				colorProfile: { space: 'rgb', icc: capability.colorProfiles?.rgb?.[0] ?? 'srgb' },
				options: { scale: 1, transparent: true },
			}
		case 'jpeg':
			return {
				artifact: 'raster',
				format,
				colorProfile: { space: 'rgb', icc: capability.colorProfiles?.rgb?.[0] ?? 'srgb' },
				options: { quality: 90 },
			}
		case 'tiff':
		case 'pdf': {
			const ppi = settings.ppi ?? capability.print?.ppi[0]
			if (!ppi || !capability.print?.ppi.includes(ppi)) return null
			const colorProfile = {
				space: 'cmyk' as const,
				icc: capability.colorProfiles?.cmyk?.[0] ?? DEFAULT_CMYK_ICC_PROFILE,
			}
			return format === 'tiff'
				? { artifact: 'raster', format, colorProfile, options: { ppi, compression: 'lzw' } }
				: { artifact: 'raster', format, colorProfile, options: { ppi, bleedMm: 0 } }
		}
		case 'mp4': {
			const video = capability.video?.mp4
			const fps = settings.fps ?? video?.fps[0]
			if (!video || !fps) return null
			return {
				artifact: 'raster',
				format,
				options: {
					container: 'mp4',
					codec: video.codec,
					colorSpace: video.colorSpace,
					width: settings.width,
					height: settings.height,
					fps,
					durationSeconds:
						settings.durationSeconds ?? Math.min(5, video.maxDurationSeconds),
				},
			}
		}
		case 'svg':
			return null
	}
}
