import type { StudioArtifactKind } from '@/modules/studio-artifact/studio-artifact'
import { EXPORTER_ARTIFACT_COMPATIBILITY } from './export-artifact'
import type {
	CmykIccProfile,
	ExportRequest,
	RgbColorProfile,
	StudioOutputFormat,
	VideoExportSpec,
} from './export-contract'
import { STUDIO_OUTPUT_FORMATS } from './export-contract'

export type StudioOutputCapability<Format extends StudioOutputFormat = StudioOutputFormat> = {
	formats: readonly Format[]
	original?: boolean
	colorProfiles?: {
		rgb?: readonly RgbColorProfile['icc'][]
		cmyk?: readonly CmykIccProfile[]
	}
	video?: {
		mp4: {
			codec: VideoExportSpec['codec']
			colorSpace: VideoExportSpec['colorSpace']
			fps: readonly VideoExportSpec['fps'][]
			maxWidth: number
			maxHeight: number
			maxDurationSeconds: number
		}
	}
	packages?: readonly 'zip'[]
}

export type StudioOutputPolicy<Format extends StudioOutputFormat = StudioOutputFormat> = {
	allowedFormats?: readonly Format[]
	original?: boolean
}

/** unknown 입력에서 공통 output capability의 직렬화 가능한 범위를 검증한다. */
export function parseStudioOutputCapability(input: unknown): StudioOutputCapability {
	const output = record(input, 'output')
	assertKeys(output, ['formats', 'original', 'colorProfiles', 'video', 'packages'], 'output')
	assertStudioOutputFormats(output.formats, 'output.formats')
	if (output.original !== undefined && typeof output.original !== 'boolean') {
		throw new Error('output.original이 boolean이 아닙니다.')
	}

	if (output.colorProfiles !== undefined) {
		const profiles = record(output.colorProfiles, 'output.colorProfiles')
		assertKeys(profiles, ['rgb', 'cmyk'], 'output.colorProfiles')
		if (profiles.rgb !== undefined) {
			assertStringArray(profiles.rgb, 'output.colorProfiles.rgb')
			if (
				(profiles.rgb as string[]).some(
					(profile) => profile !== 'srgb' && profile !== 'display-p3',
				)
			) {
				throw new Error('output.colorProfiles.rgb가 올바르지 않습니다.')
			}
		}
		if (profiles.cmyk !== undefined) {
			assertStringArray(profiles.cmyk, 'output.colorProfiles.cmyk')
			if ((profiles.cmyk as string[]).some((profile) => profile !== 'cgats21-crpc6')) {
				throw new Error('output.colorProfiles.cmyk가 올바르지 않습니다.')
			}
		}
	}

	if (output.packages !== undefined) {
		assertStringArray(output.packages, 'output.packages')
		if ((output.packages as string[]).some((format) => format !== 'zip')) {
			throw new Error('output.packages가 올바르지 않습니다.')
		}
	}

	if (output.video !== undefined) {
		const video = record(output.video, 'output.video')
		assertKeys(video, ['mp4'], 'output.video')
		const mp4 = record(video.mp4, 'output.video.mp4')
		assertKeys(
			mp4,
			['codec', 'colorSpace', 'fps', 'maxWidth', 'maxHeight', 'maxDurationSeconds'],
			'output.video.mp4',
		)
		if (mp4.codec !== 'h264' || mp4.colorSpace !== 'rec709') {
			throw new Error('output.video.mp4 codec 또는 colorSpace가 올바르지 않습니다.')
		}
		if (
			!Array.isArray(mp4.fps) ||
			mp4.fps.some((fps) => fps !== 24 && fps !== 30 && fps !== 60)
		) {
			throw new Error('output.video.mp4.fps가 올바르지 않습니다.')
		}
		assertUniqueFormats(mp4.fps.map(String), 'output.video.mp4.fps')
		for (const key of ['maxWidth', 'maxHeight', 'maxDurationSeconds'] as const) {
			if (typeof mp4[key] !== 'number' || !Number.isFinite(mp4[key]) || mp4[key] <= 0) {
				throw new Error(`output.video.mp4.${key}는 양수여야 합니다.`)
			}
		}
	}

	return input as StudioOutputCapability
}

/** Runtime/Service가 지원하는 형식에서 Admin이 허용한 부분집합만 남긴다. */
export function resolveStudioOutputFormats<Format extends StudioOutputFormat>(
	supported: readonly Format[],
	allowed: readonly string[] | null | undefined,
): readonly Format[] {
	assertStudioOutputFormats(supported, '지원 형식')
	if (allowed === undefined || allowed === null) return supported
	assertStudioOutputFormats(allowed, 'Admin 허용 형식')

	const supportedSet = new Set<string>(supported)
	for (const format of allowed) {
		if (!supportedSet.has(format)) {
			throw new Error(`지원하지 않는 output format입니다: ${format}`)
		}
	}
	const allowedSet = new Set(allowed)
	return supported.filter((format) => allowedSet.has(format))
}

/** Runtime Artifact 종류를 Exporter가 변환할 수 있는 시스템 형식으로 투영한 뒤 Admin 정책으로 좁힌다. */
export function resolveStudioArtifactOutputFormats(
	artifacts: readonly StudioArtifactKind[],
	allowed: readonly string[] | null | undefined,
): readonly StudioOutputFormat[] {
	const supported = STUDIO_OUTPUT_FORMATS.filter((format) =>
		EXPORTER_ARTIFACT_COMPATIBILITY[format].some((kind) => artifacts.includes(kind)),
	)
	return resolveStudioOutputFormats(supported, allowed)
}

export function supportsStudioOutput<Format extends StudioOutputFormat>(
	capability: StudioOutputCapability<Format>,
	format: Format,
): boolean {
	return capability.formats.includes(format)
}

/** 직렬화된 capability가 이번 요청의 형식·색상·영상 범위를 허용하는지 확인한다. */
export function supportsStudioExportRequest(
	capability: StudioOutputCapability,
	request: ExportRequest,
): boolean {
	if (request.format === 'original') return capability.original === true
	if (!supportsStudioOutput(capability, request.format)) return false
	if (!validRequestOptions(request)) return false

	if ('colorProfile' in request && capability.colorProfiles) {
		const allowed = capability.colorProfiles[request.colorProfile.space] as
			| readonly string[]
			| undefined
		if (!allowed?.includes(request.colorProfile.icc)) return false
	}

	if (request.format === 'mp4') {
		const video = capability.video?.mp4
		const spec = request.options
		return Boolean(
			video &&
				video.codec === spec.codec &&
				video.colorSpace === spec.colorSpace &&
				video.fps.includes(spec.fps) &&
				spec.width <= video.maxWidth &&
				spec.height <= video.maxHeight &&
				spec.durationSeconds <= video.maxDurationSeconds,
		)
	}

	return true
}

function validRequestOptions(request: ExportRequest): boolean {
	switch (request.format) {
		case 'original':
			return true
		case 'png':
			return Number.isFinite(request.options.scale) && request.options.scale > 0
		case 'jpeg':
			return request.options.quality > 0 && request.options.quality <= 100
		case 'tiff':
			return (
				[72, 150, 300].includes(request.options.ppi) &&
				request.options.compression === 'lzw'
			)
		case 'pdf':
			return [72, 150, 300].includes(request.options.ppi) && request.options.bleedMm >= 0
		case 'svg':
			return (
				Number.isInteger(request.options.width) &&
				request.options.width > 0 &&
				Number.isInteger(request.options.height) &&
				request.options.height > 0 &&
				typeof request.options.outlineText === 'boolean'
			)
		case 'mp4':
			return (
				request.options.container === 'mp4' &&
				request.options.codec === 'h264' &&
				request.options.colorSpace === 'rec709' &&
				Number.isInteger(request.options.width) &&
				request.options.width > 0 &&
				Number.isInteger(request.options.height) &&
				request.options.height > 0 &&
				Number.isFinite(request.options.durationSeconds) &&
				request.options.durationSeconds > 0
			)
	}
}

function assertUniqueFormats(formats: readonly string[], label: string) {
	if (new Set(formats).size !== formats.length) {
		throw new Error(`${label}이 중복되었습니다.`)
	}
}

function record(value: unknown, label: string): Record<string, unknown> {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		throw new Error(`${label}이 객체가 아닙니다.`)
	}
	return value as Record<string, unknown>
}

function assertKeys(value: Record<string, unknown>, allowed: readonly string[], label: string) {
	const allowedKeys = new Set(allowed)
	for (const key of Object.keys(value)) {
		if (!allowedKeys.has(key)) throw new Error(`${label}에 알 수 없는 필드가 있습니다: ${key}`)
	}
}

function assertStringArray(value: unknown, label: string): asserts value is string[] {
	if (!Array.isArray(value) || value.some((item) => typeof item !== 'string' || !item)) {
		throw new Error(`${label}이 문자열 배열이 아닙니다.`)
	}
	assertUniqueFormats(value, label)
}

function assertStudioOutputFormats(
	value: unknown,
	label: string,
): asserts value is StudioOutputFormat[] {
	assertStringArray(value, label)
	if (value.some((format) => !STUDIO_OUTPUT_FORMATS.includes(format as StudioOutputFormat))) {
		throw new Error(`${label}에 지원하지 않는 output format이 있습니다.`)
	}
}
