/** 영문 Check 제목을 저장 가능한 안정 key로 바꾼다. Payload field config와 외부 I/O에 의존하지 않는다. */
export function checkKeyFromEnglishTitle(value: unknown): string {
	if (typeof value !== 'string') return ''

	return value
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
}
