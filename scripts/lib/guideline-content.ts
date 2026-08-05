// 가이드라인 콘텐츠 스냅샷의 변환 규약.
//
// 🔴 콘텐츠는 공유 DB에 산다. admin에서 고치면 그게 반영이고, 코드가 콘텐츠를 되돌려 쓰지 않는다.
//    이 파일은 DB → JSON 한 방향(export)만 지원한다. 되돌려 쓰는 seed는 2026-08-05에 삭제했다.
//    (이유: 빈 DB 재현은 애초에 불가능했다 — 정본이 참조하는 업로드 170종 중 리포 보유가 27종뿐이다.)

// biome-ignore lint/suspicious/noExplicitAny: 블록 데이터를 스키마 없이 그대로 옮긴다.
export type AnyData = any

/** 환경에 종속되거나 의미 없는 메타는 스냅샷에서 제외한다. */
const DROP_KEYS = new Set(['id', 'createdAt', 'updatedAt', 'globalType'])

/**
 * populate된 관계를 사람이 읽을 수 있는 키로 바꾼다 — 원시 id는 환경마다 달라 스냅샷을 무의미하게 만든다.
 * 업로드는 filename(`{file}`), brand-colors는 hex(`{color}`), rules는 key(`{rule}`)로 적는다.
 */
export function toPortable(value: AnyData): AnyData {
	if (Array.isArray(value)) return value.map(toPortable)
	if (value && typeof value === 'object') {
		if (typeof value.filename === 'string') return { file: value.filename }
		if (typeof value.hex === 'string') return { color: value.hex }
		// 🔴 rules를 populate된 정의째로 담으면 안 된다 — 안에 든 checker가 환경별 id라 스냅샷이 오염된다.
		//    🔴 값이 아니라 키의 존재로 판정한다 — rules는 초안 저장 시 검증을 건너뛰므로 required인
		//    tier·executor가 null인 행이 있을 수 있고, 값으로 보면 그 초안이 객체째로 들어간다.
		if (typeof value.key === 'string' && 'tier' in value && 'executor' in value) {
			return { rule: value.key }
		}
		const out: AnyData = {}
		for (const [key, v] of Object.entries(value)) {
			if (DROP_KEYS.has(key) || v == null) continue
			out[key] = toPortable(v)
		}
		return out
	}
	return value
}
