import { isLightColor } from '@/lib/color'
import { MAIN, MULTI } from './color-palette'

/**
 * Color Pairing 시스템 = essenherb 3대 페어링(Tone in/on/Mono)의 "병용 가능 조합"을 전처리한 데이터.
 * 세 방식 모두 BG→FG 순서. 컴포넌트는 pairs 테이블을 조회만 하고 런타임 계산을 하지 않는다.
 *
 * 원칙: 기능엔 "기술적 병용 가능 여부"만 담는다. 추천/의도(노랑 제외·톤별 흑백 대비 등)는
 * 조합기 아래 별도 추천 조합 display로 분리한다.
 *
 * ⚠️ 지금은 repo 설정 모듈(규칙으로 테이블 생성). 모델 확정 후 이 pairs 테이블을 Payload로 승격 예정.
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

// 병용 규칙(테이블 생성기) — 런타임엔 안 쓰이고 pairs 전처리에만 쓴다. 기술적 병용 여부만 판단.
type Rule = { bgEligible: (s: Swatch) => boolean; compatible: (bg: Swatch, fg: Swatch) => boolean }

const toneInRule: Rule = {
	bgEligible: isChromatic,
	compatible: (bg, fg) =>
		bg.tone != null &&
		fg.tone != null &&
		fg.family !== bg.family && // 서로 다른 계열
		(TONE_IN_MATRIX[bg.tone]?.includes(fg.tone) ?? false),
}
const toneOnRule: Rule = {
	bgEligible: isChromatic,
	compatible: (bg, fg) =>
		bg.tone != null && fg.tone != null && fg.family === bg.family && fg.tone !== bg.tone, // 같은 계열 다른 톤
}
const monoRule: Rule = {
	bgEligible: () => true, // 유채·무채 모두 배경 가능
	compatible: (bg, fg) => {
		const bgAch = bg.tone == null
		const fgAch = fg.tone == null
		if (!bgAch && !fgAch) return false // 둘 다 유채 = 모노톤 아님
		if (bgAch && fgAch) return isLightColor(bg.hex) !== isLightColor(fg.hex) // 흰↔검만
		return true // 무채 + 유채
	},
}

// 배경 id → 병용 가능한 전경 id[] (모듈 로드 시 1회 전처리). 배경 부적격 색은 키가 없다.
function buildPairs(rule: Rule): Record<string, string[]> {
	const pairs: Record<string, string[]> = {}
	for (const bg of UNIVERSE) {
		if (!rule.bgEligible(bg)) continue
		pairs[bg.id] = UNIVERSE.filter((fg) => rule.compatible(bg, fg)).map((fg) => fg.id)
	}
	return pairs
}

export type PairingSystemData = {
	key: string
	label: string
	description: string
	/** 배경 id → 병용 가능한 전경 id[] (전처리 완료). 배경으로 못 고르는 색은 키 없음. */
	pairs: Record<string, string[]>
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
