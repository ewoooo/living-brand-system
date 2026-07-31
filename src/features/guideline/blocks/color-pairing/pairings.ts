import { isLightColor } from '@/lib/color'

/**
 * Color Pairing 규칙 = essenherb 3대 페어링(Tone in/on/Mono)의 병용 등급을 계산하는 단일 소스.
 * 세 방식 모두 BG→FG. 실제 색 유니버스(brand-colors)에 규칙을 적용해 `배경 key → { recommended, usable }`
 * 테이블을 만든다. 목록에 없는 key = 병용 불가(숨김). block(서버)·view(클라)가 함께 쓴다(순수 TS).
 *
 * 원칙: 여기엔 "기술적 병용 여부"만. 추천/의도(노랑 제외·톤별 흑백 등)는 후속 추천 데이터로 분리.
 * ⚠️ Phase 2에서 이 rule-derived 테이블을 Payload `color-pairings` 컬렉션(브랜드 자산)으로 이관 예정.
 */
export type PairingSwatch = { key: string; family: string; tone: number | null; hex: string }
export type PairingEntry = { recommended: string[]; usable: string[] }
export type PairingSystemKey = 'tone-in-tone' | 'tone-on-tone' | 'mono-tone'

export const PAIRING_SYSTEMS: {
	key: PairingSystemKey
	label: string
	description: string
}[] = [
	{
		key: 'tone-in-tone',
		label: 'Tone in Tone',
		description: '서로 다른 색상 계열 · 생동감·에너제틱 (Level 3)',
	},
	{
		key: 'tone-on-tone',
		label: 'Tone on Tone',
		description: '동일 색상 계열 · 시각 안정감·가독성 (Level 2)',
	},
	{
		key: 'mono-tone',
		label: 'Mono Tone',
		description: 'Black/White + 유채색 · 선명도 강조 (Level 1)',
	},
]

// Tone in Tone: BG 톤 → 병용 가능한 FG 톤 (p.26 명도 조합 규정).
const TONE_IN_MATRIX: Record<number, number[]> = {
	1: [3, 4, 5],
	2: [4, 5],
	3: [1, 3, 5],
	4: [1, 2, 3],
	5: [1, 2, 3],
}

type Grade = 'recommended' | 'usable' | null
type Rule = {
	bgEligible: (s: PairingSwatch) => boolean
	grade: (bg: PairingSwatch, fg: PairingSwatch) => Grade
}

const isChromatic = (s: PairingSwatch) => s.tone != null

const RULES: Record<PairingSystemKey, Rule> = {
	// 서로 다른 계열 + 톤 매트릭스. 추천 = 핵심 톤(3) 임시 규칙(추천 40종 데이터로 교체 예정).
	'tone-in-tone': {
		bgEligible: isChromatic,
		grade: (bg, fg) => {
			if (bg.tone == null || fg.tone == null) return null
			if (fg.family === bg.family) return null
			if (!TONE_IN_MATRIX[bg.tone]?.includes(fg.tone)) return null
			return fg.tone === 3 ? 'recommended' : 'usable'
		},
	},
	// 동일 계열 다른 톤 = 전부 동등(추천).
	'tone-on-tone': {
		bgEligible: isChromatic,
		grade: (bg, fg) =>
			bg.tone != null && fg.tone != null && fg.family === bg.family && fg.tone !== bg.tone
				? 'recommended'
				: null,
	},
	// 한쪽 무채(B/W) + 한쪽 유채. 무채끼리는 흰↔검만, 둘 다 유채는 불가.
	'mono-tone': {
		bgEligible: () => true,
		grade: (bg, fg) => {
			const bgAch = bg.tone == null
			const fgAch = fg.tone == null
			if (!bgAch && !fgAch) return null
			if (bgAch && fgAch)
				return isLightColor(bg.hex) !== isLightColor(fg.hex) ? 'recommended' : null
			return 'recommended'
		},
	},
}

/** 색 유니버스에 시스템 규칙을 적용해 배경 key → { recommended, usable } 테이블을 만든다. */
export function buildPairs(
	swatches: PairingSwatch[],
	system: PairingSystemKey,
): Record<string, PairingEntry> {
	const rule = RULES[system]
	const pairs: Record<string, PairingEntry> = {}
	for (const bg of swatches) {
		if (!rule.bgEligible(bg)) continue
		const recommended: string[] = []
		const usable: string[] = []
		for (const fg of swatches) {
			const g = rule.grade(bg, fg)
			if (g === 'recommended') recommended.push(fg.key)
			else if (g === 'usable') usable.push(fg.key)
		}
		pairs[bg.key] = { recommended, usable }
	}
	return pairs
}
