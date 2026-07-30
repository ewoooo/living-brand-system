/** Payload relationship의 ID를 populated/unpopulated 형태와 무관하게 읽는다. */
export function relationshipId(value: unknown): number | null {
	if (typeof value === 'number') return value
	if (!value || typeof value !== 'object' || !('id' in value)) return null

	const id = (value as { id?: unknown }).id
	return typeof id === 'number' ? id : null
}
