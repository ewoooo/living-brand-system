import { isLightColor } from '@/lib/color'
import { MAIN, MULTI } from './color-palette'

/**
 * Color Pairing 시스템 = essenherb 3대 페어링(Tone in/on/Mono)의 병용 조합을 전처리한 데이터.
 * 세 방식 모두 BG→FG 순서. 컴포넌트는 pairs 테이블을 조회만 하고 런타임 계산을 하지 않는다.
 *
 * 배경 id → { recommended: 추천(꽉 찬 사각형), usable: 사용 가능하나 비추천('그냥', 원) }.
 * 목록에 없는 색 = 병용 불가(숨김). 세 시스템 모두 같은 컴포넌트를 쓰고, 이 데이터 구성으로만 달라진다.
 *
 * ⚠️ 지금은 repo 설정 모듈(규칙으로 테이블 생성). 모델 확정 후 이 테이블을 Payload로 승격 예정.
 */

type Swatch = { id: string; hex: string; family: string; tone: number | null }

// id 규약('<family>-<tone>' | 'main-<name>')에서 계열/톤 파생. 중립(white/black)은 tone=null.
function enrich(sw: { id: string; hex: string }): Swatch {
	const [head, tail] = sw.id.split('-')
	const tone = /^[1-5]$/.test(tail ?? '') ? Number(tail) : null
	return { id: sw.id, hex: sw.hex, family: tone ? head : 'neutral', tone }
}

// 전처리 스와치 유니버스 (컴포넌트 rows와 동일: white/black + 6계열×5).
const UNIVERSE: Swatch[] = [...MAIN.filter((s) => s.id !== 'main-red'), ...MULTI.flat()].map(enrich)

// Tone in Tone: BG 톤 → 병용 가능한 FG 톤 (p.26 명도 조합 규정).
const TONE_IN_MATRIX: Record<number, number[]> = {
	1: [3, 4, 5],
	2: [4, 5],
	3: [1, 3, 5],
	4: [1, 2, 3],
	5: [1, 2, 3],
}
const isChromatic = (s: Swatch) => s.tone != null

// 조합 등급(테이블 생성기) — 런타임엔 안 쓰이고 pairs 전처리에만 쓴다.
// 'recommended'=추천(사각형), 'usable'=사용 가능/비추천(원), null=병용 불가(숨김).
type Grade = 'recommended' | 'usable' | null
type Rule = { bgEligible: (s: Swatch) => boolean; grade: (bg: Swatch, fg: Swatch) => Grade }

const toneInRule: Rule = {
	bgEligible: isChromatic,
	grade: (bg, fg) => {
		if (bg.tone == null || fg.tone == null) return null
		if (fg.family === bg.family) return null // 서로 다른 계열
		if (!TONE_IN_MATRIX[bg.tone]?.includes(fg.tone)) return null
		// ponytail: 추천 = 핵심 톤(3) 임시 규칙. 실제 40종은 p27/28 Figma 데이터 확보 후 교체.
		return fg.tone === 3 ? 'recommended' : 'usable'
	},
}
const toneOnRule: Rule = {
	bgEligible: isChromatic,
	// 같은 계열 다른 톤은 전부 동등 → 모두 추천(사각형), 등급 구분 없음.
	grade: (bg, fg) =>
		bg.tone != null && fg.tone != null && fg.family === bg.family && fg.tone !== bg.tone
			? 'recommended'
			: null,
}
const monoRule: Rule = {
	bgEligible: () => true,
	grade: (bg, fg) => {
		const bgAch = bg.tone == null
		const fgAch = fg.tone == null
		if (!bgAch && !fgAch) return null // 둘 다 유채 = 모노톤 아님
		if (bgAch && fgAch)
			return isLightColor(bg.hex) !== isLightColor(fg.hex) ? 'recommended' : null // 흰↔검만
		return 'recommended' // 무채 + 유채
	},
}

export type PairingEntry = { recommended: string[]; usable: string[] }

// 배경 id → { recommended, usable } (모듈 로드 시 1회 전처리). 배경 부적격 색은 키가 없다.
function buildPairs(rule: Rule): Record<string, PairingEntry> {
	const pairs: Record<string, PairingEntry> = {}
	for (const bg of UNIVERSE) {
		if (!rule.bgEligible(bg)) continue
		const recommended: string[] = []
		const usable: string[] = []
		for (const fg of UNIVERSE) {
			const g = rule.grade(bg, fg)
			if (g === 'recommended') recommended.push(fg.id)
			else if (g === 'usable') usable.push(fg.id)
		}
		pairs[bg.id] = { recommended, usable }
	}
	return pairs
}

export type PairingSystemData = {
	key: string
	label: string
	description: string
	/** 배경 id → { recommended, usable }. 배경으로 못 고르는 색은 키 없음. */
	pairs: Record<string, PairingEntry>
}

export const toneInTone: PairingSystemData = {
	key: 'tone-in-tone',
	label: 'Tone in Tone',
	description: '서로 다른 색상 계열 · 생동감·에너제틱 (Level 3)',
	pairs: buildPairs(toneInRule),
}
export const toneOnTone: PairingSystemData = {
	key: 'tone-on-tone',
	label: 'Tone on Tone',
	description: '동일 색상 계열 · 시각 안정감·가독성 (Level 2)',
	pairs: buildPairs(toneOnRule),
}
export const monoTone: PairingSystemData = {
	key: 'mono-tone',
	label: 'Mono Tone',
	description: 'Black/White + 유채색 · 선명도 강조 (Level 1)',
	pairs: buildPairs(monoRule),
}
