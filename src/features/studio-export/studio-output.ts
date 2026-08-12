/** Studio Runtime 지원 범위를 Admin 정책으로 좁힌 직렬화 가능한 출력 계약. */
export type StudioOutputCapability<Format extends string> = Readonly<{
	formats: readonly Format[]
}>

/** Admin이 Runtime 출력 범위를 좁히기 위해 저장하는 직렬화 가능한 정책. */
export type StudioOutputPolicy<Format extends string = string> = Readonly<{
	formats: readonly Format[]
}>

/** unknown StudioConfig에서 format 목록만 검증하고 도메인 union으로 좁힌다. */
export function parseStudioOutputCapability<Format extends string>(
	input: unknown,
	supportedFormats: readonly Format[],
): StudioOutputCapability<Format> {
	if (!input || typeof input !== 'object' || Array.isArray(input)) {
		throw new Error('Studio output은 객체여야 합니다.')
	}
	const formats = (input as { formats?: unknown }).formats
	if (!Array.isArray(formats)) throw new Error('Studio output.formats는 배열이어야 합니다.')
	const supported = new Set<string>(supportedFormats)
	const seen = new Set<string>()
	for (const format of formats) {
		if (typeof format !== 'string' || !supported.has(format)) {
			throw new Error(`Studio output format을 지원하지 않습니다: ${String(format)}`)
		}
		if (seen.has(format)) throw new Error(`Studio output format이 중복되었습니다: ${format}`)
		seen.add(format)
	}
	return input as StudioOutputCapability<Format>
}

/** Payload group 저장형의 format 목록을 Admin 제한 정책으로 투영한다. */
export function projectPayloadStudioOutputPolicy(input: unknown): StudioOutputPolicy | null {
	if (input == null) return null
	if (typeof input !== 'object' || Array.isArray(input)) {
		throw new Error('Studio output policy는 객체여야 합니다.')
	}
	const formats = (input as { formats?: unknown }).formats
	if (formats == null || (Array.isArray(formats) && formats.length === 0)) return null
	if (!Array.isArray(formats) || formats.some((format) => typeof format !== 'string')) {
		throw new Error('Studio output policy.formats는 문자열 배열이어야 합니다.')
	}
	return { formats }
}

/** Admin 정책이 Runtime capability를 확장하지 못하게 검증하고 지원 순서대로 좁힌다. */
export function applyStudioOutputPolicy<Format extends string>(
	capability: StudioOutputCapability<Format>,
	policy?: StudioOutputPolicy | null,
): StudioOutputCapability<Format> {
	if (!policy) return capability

	const supported = new Set<string>(capability.formats)
	const allowed = new Set(policy.formats)
	if (allowed.size !== policy.formats.length) {
		throw new Error('Studio output policy format이 중복되었습니다.')
	}
	for (const format of allowed) {
		if (!supported.has(format)) {
			throw new Error(`Studio output policy가 Runtime capability를 확장합니다: ${format}`)
		}
	}

	return { formats: capability.formats.filter((format) => allowed.has(format)) }
}

/** 선택한 format이 Effective StudioConfig.output에 포함되는지 판정한다. */
export function supportsStudioOutput<Format extends string>(
	capability: StudioOutputCapability<Format>,
	format: string,
): format is Format {
	return capability.formats.some((candidate) => candidate === format)
}
