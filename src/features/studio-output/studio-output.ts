export type StudioOutputCapability<Format extends string = string> = {
	formats: readonly Format[]
}

export type StudioOutputPolicy<Format extends string = string> = {
	allowedFormats?: readonly Format[]
}

/** Runtime/Service가 지원하는 형식에서 Admin이 허용한 부분집합만 남긴다. */
export function resolveStudioOutputFormats<Format extends string>(
	supported: readonly Format[],
	allowed: readonly string[] | null | undefined,
): readonly Format[] {
	assertUniqueFormats(supported, '지원 형식')
	if (allowed === undefined || allowed === null) return supported
	assertUniqueFormats(allowed, 'Admin 허용 형식')

	const supportedSet = new Set<string>(supported)
	for (const format of allowed) {
		if (!supportedSet.has(format)) {
			throw new Error(`지원하지 않는 output format입니다: ${format}`)
		}
	}
	const allowedSet = new Set(allowed)
	return supported.filter((format) => allowedSet.has(format))
}

export function supportsStudioOutput<Format extends string>(
	capability: StudioOutputCapability<Format>,
	format: Format,
): boolean {
	return capability.formats.includes(format)
}

function assertUniqueFormats(formats: readonly string[], label: string) {
	if (new Set(formats).size !== formats.length) {
		throw new Error(`${label}이 중복되었습니다.`)
	}
}
