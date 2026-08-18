/**
 * Payload 관계·upload 값의 모양은 조회의 `depth`가 정한다 — `depth: 0`이면 id, populate되면 문서다.
 * 그래서 생성된 타입이 `number | SomeDoc` 유니온이고, `=== someId` 비교는 두 갈래 중 한쪽만
 * 가정해도 타입 오류가 나지 않는다(유니온 비교는 합법이다).
 *
 * 🔴 그 유니온을 저장소 밖으로 내보내지 말 것. 저장소가 여기서 id로 좁혀 반환하면 소비자는
 * 애초에 틀리게 쓸 수 없다 — 2026-08-14에 템플릿 목록이 통째로 비었던 사고의 재발 방지선이다.
 */
export function toRelationshipId(value: unknown): number | undefined {
	if (typeof value === 'number') return Number.isFinite(value) ? value : undefined
	if (value && typeof value === 'object' && typeof (value as { id?: unknown }).id === 'number') {
		return (value as { id: number }).id
	}
	return undefined
}
