import {
	getStudioArtifactKinds,
	parseStudioArtifactCapabilities,
	STUDIO_VIDEO_FPS_VALUES,
	type StudioArtifactCapabilities,
	type StudioVideoFrameRate,
} from '@/modules/studio-artifact/studio-artifact'
import { acceptsExportArtifact } from './export-artifact'
import type {
	CmykIccProfile,
	ExportRequest,
	RgbColorProfile,
	StudioOutputFormat,
	VideoExportSpec,
} from './export-contract'
import { STUDIO_OUTPUT_FORMATS } from './export-contract'
import { PRINT_PPI_VALUES, type PrintPpi } from './print-policy'

const DEFAULT_RASTER_VIDEO_CAPABILITY = {
	fps: STUDIO_VIDEO_FPS_VALUES,
	maxWidth: 1920,
	maxHeight: 1080,
	maxDurationSeconds: 10,
}

export type StudioOutputCapability<Format extends StudioOutputFormat = StudioOutputFormat> = {
	formats: readonly Format[]
	original?: boolean
	colorProfiles?: {
		rgb?: readonly RgbColorProfile['icc'][]
		cmyk?: readonly CmykIccProfile[]
	}
	print?: {
		ppi: readonly PrintPpi[]
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
	print?: { allowedPpi?: readonly PrintPpi[] }
	video?: {
		allowedFps?: readonly StudioVideoFrameRate[]
		maxWidth?: number
		maxHeight?: number
		maxDurationSeconds?: number
	}
}

/** Payload JSON의 공통 output 제한을 정규화하고 Runtime보다 넓힐 수 없는 정책 형태로 읽는다. */
export function projectStudioOutputPolicy(input: unknown): StudioOutputPolicy | null {
	if (input === undefined || input === null) return null
	const policy = record(input, 'exportPolicy')
	assertKeys(policy, ['allowedFormats', 'original', 'print', 'video'], 'exportPolicy')
	const output: StudioOutputPolicy = {}
	if (policy.allowedFormats !== undefined && policy.allowedFormats !== null) {
		assertStudioOutputFormats(policy.allowedFormats, 'exportPolicy.allowedFormats')
		output.allowedFormats = policy.allowedFormats
	}
	if (policy.original !== undefined && policy.original !== null) {
		if (typeof policy.original !== 'boolean') {
			throw new Error('exportPolicy.original이 boolean이 아닙니다.')
		}
		output.original = policy.original
	}
	if (policy.print !== undefined && policy.print !== null) {
		const print = record(policy.print, 'exportPolicy.print')
		assertKeys(print, ['allowedPpi'], 'exportPolicy.print')
		if (print.allowedPpi !== undefined && print.allowedPpi !== null) {
			output.print = { allowedPpi: normalizePrintPpi(print.allowedPpi) }
		}
	}
	if (policy.video !== undefined && policy.video !== null) {
		const video = record(policy.video, 'exportPolicy.video')
		assertKeys(
			video,
			['allowedFps', 'maxWidth', 'maxHeight', 'maxDurationSeconds'],
			'exportPolicy.video',
		)
		const normalized: NonNullable<StudioOutputPolicy['video']> = {}
		if (video.allowedFps !== undefined && video.allowedFps !== null) {
			normalized.allowedFps = normalizeFrameRates(video.allowedFps)
		}
		for (const key of ['maxWidth', 'maxHeight', 'maxDurationSeconds'] as const) {
			const value = video[key]
			if (value === undefined || value === null) continue
			if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
				throw new Error(`exportPolicy.video.${key}가 양수가 아닙니다.`)
			}
			normalized[key] = value
		}
		output.video = normalized
	}
	return output
}

/** unknown 입력에서 공통 output capability의 직렬화 가능한 범위를 검증한다. */
export function parseStudioOutputCapability(input: unknown): StudioOutputCapability {
	const output = record(input, 'output')
	assertKeys(
		output,
		['formats', 'original', 'colorProfiles', 'print', 'video', 'packages'],
		'output',
	)
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

	if (output.print !== undefined) {
		const print = record(output.print, 'output.print')
		assertKeys(print, ['ppi'], 'output.print')
		assertPrintPpi(print.ppi, 'output.print.ppi')
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
			mp4.fps.some((fps) => !STUDIO_VIDEO_FPS_VALUES.includes(fps as StudioVideoFrameRate))
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
	artifacts: StudioArtifactCapabilities,
	allowed: readonly string[] | null | undefined,
): readonly StudioOutputFormat[] {
	parseStudioArtifactCapabilities(artifacts)
	const kinds = getStudioArtifactKinds(artifacts)
	const supported = STUDIO_OUTPUT_FORMATS.filter((format) =>
		kinds.some((kind) => acceptsExportArtifact(format, kind)),
	)
	return resolveStudioOutputFormats(supported, allowed)
}

/** Runtime Artifact 사양과 Admin 제한을 공통 Effective output capability로 계산한다. */
export function resolveStudioOutputCapability(
	artifacts: StudioArtifactCapabilities,
	policy: StudioOutputPolicy | null = null,
	options: { packages?: readonly 'zip'[] } = {},
): StudioOutputCapability {
	const formats = resolveStudioArtifactOutputFormats(artifacts, policy?.allowedFormats)
	const printFormats = formats.some((format) => format === 'tiff' || format === 'pdf')
	const video =
		artifacts.video ?? (artifacts.raster ? DEFAULT_RASTER_VIDEO_CAPABILITY : undefined)
	const allowedPpi = narrowPrintPpi(policy?.print?.allowedPpi)
	const allowedFps = video ? narrowFrameRates(video.fps, policy?.video?.allowedFps) : []
	return {
		formats,
		original: artifacts.original !== undefined && (policy?.original ?? true),
		colorProfiles: { rgb: ['srgb'], cmyk: ['cgats21-crpc6'] },
		...(printFormats ? { print: { ppi: allowedPpi } } : {}),
		...(video && formats.includes('mp4')
			? {
					video: {
						mp4: {
							codec: 'h264' as const,
							colorSpace: 'rec709' as const,
							fps: allowedFps,
							maxWidth: narrowMaximum(
								video.maxWidth,
								policy?.video?.maxWidth,
								'maxWidth',
							),
							maxHeight: narrowMaximum(
								video.maxHeight,
								policy?.video?.maxHeight,
								'maxHeight',
							),
							maxDurationSeconds: narrowMaximum(
								video.maxDurationSeconds,
								policy?.video?.maxDurationSeconds,
								'maxDurationSeconds',
							),
						},
					},
				}
			: {}),
		...(options.packages ? { packages: options.packages } : {}),
	}
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
	if (request.artifact === 'original') return capability.original === true
	if (!supportsStudioOutput(capability, request.format)) return false
	if (!validRequestOptions(request)) return false

	if ('colorProfile' in request && capability.colorProfiles) {
		const allowed = capability.colorProfiles[request.colorProfile.space] as
			| readonly string[]
			| undefined
		if (!allowed?.includes(request.colorProfile.icc)) return false
	}
	if (
		request.artifact === 'raster' &&
		(request.format === 'tiff' || request.format === 'pdf') &&
		!capability.print?.ppi.includes(request.options.ppi)
	) {
		return false
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
	switch (request.artifact) {
		case 'original':
			return true
		case 'raster':
			switch (request.format) {
				case 'png':
					return Number.isFinite(request.options.scale) && request.options.scale > 0
				case 'jpeg':
					return request.options.quality > 0 && request.options.quality <= 100
				case 'tiff':
					return (
						PRINT_PPI_VALUES.includes(request.options.ppi) &&
						request.options.compression === 'lzw'
					)
				case 'pdf':
					return (
						PRINT_PPI_VALUES.includes(request.options.ppi) &&
						request.options.bleedMm >= 0
					)
				case 'mp4':
					return validVideoExportSpec(request.options)
			}
			return false
		case 'vector':
			return (
				Number.isInteger(request.options.width) &&
				request.options.width > 0 &&
				Number.isInteger(request.options.height) &&
				request.options.height > 0 &&
				typeof request.options.outlineText === 'boolean'
			)
		case 'video':
			return validVideoExportSpec(request.options)
	}
}

function validVideoExportSpec(spec: VideoExportSpec): boolean {
	return (
		spec.container === 'mp4' &&
		spec.codec === 'h264' &&
		spec.colorSpace === 'rec709' &&
		Number.isInteger(spec.width) &&
		spec.width > 0 &&
		Number.isInteger(spec.height) &&
		spec.height > 0 &&
		Number.isFinite(spec.durationSeconds) &&
		spec.durationSeconds > 0
	)
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

function assertPrintPpi(value: unknown, label: string): asserts value is PrintPpi[] {
	if (
		!Array.isArray(value) ||
		value.length === 0 ||
		value.some((ppi) => !PRINT_PPI_VALUES.includes(ppi as PrintPpi)) ||
		new Set(value).size !== value.length
	) {
		throw new Error(`${label}가 올바르지 않습니다.`)
	}
}

function normalizePrintPpi(value: unknown): readonly PrintPpi[] {
	if (!Array.isArray(value)) throw new Error('exportPolicy.print.allowedPpi가 배열이 아닙니다.')
	const normalized = value.map(Number)
	assertPrintPpi(normalized, 'exportPolicy.print.allowedPpi')
	return normalized
}

function normalizeFrameRates(value: unknown): readonly StudioVideoFrameRate[] {
	if (!Array.isArray(value)) throw new Error('exportPolicy.video.allowedFps가 배열이 아닙니다.')
	const normalized = value.map(Number)
	if (
		normalized.length === 0 ||
		normalized.some((fps) => !STUDIO_VIDEO_FPS_VALUES.includes(fps as StudioVideoFrameRate)) ||
		new Set(normalized).size !== normalized.length
	) {
		throw new Error('exportPolicy.video.allowedFps가 올바르지 않습니다.')
	}
	return normalized as StudioVideoFrameRate[]
}

function narrowPrintPpi(allowed: readonly PrintPpi[] | undefined): readonly PrintPpi[] {
	if (!allowed) return PRINT_PPI_VALUES
	assertPrintPpi(allowed, 'Admin print PPI')
	return PRINT_PPI_VALUES.filter((ppi) => allowed.includes(ppi))
}

function narrowFrameRates(
	supported: readonly StudioVideoFrameRate[],
	allowed: readonly StudioVideoFrameRate[] | undefined,
): readonly StudioVideoFrameRate[] {
	if (!allowed) return supported
	const supportedSet = new Set(supported)
	for (const fps of allowed) {
		if (!supportedSet.has(fps)) throw new Error(`지원하지 않는 video fps입니다: ${fps}`)
	}
	const allowedSet = new Set(allowed)
	return supported.filter((fps) => allowedSet.has(fps))
}

function narrowMaximum(base: number, allowed: number | undefined, label: string): number {
	if (allowed === undefined) return base
	if (!Number.isFinite(allowed) || allowed <= 0 || allowed > base) {
		throw new Error(`Admin video ${label}가 Runtime보다 넓습니다.`)
	}
	return allowed
}
