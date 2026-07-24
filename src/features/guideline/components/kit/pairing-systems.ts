import { isLightColor } from '@/lib/color'

/**
 * Color Pairing 시스템 정의 — essenherb Color System의 3대 페어링(Tone in/on/Mono)을 "데이터"로 표현한다.
 * 세 방식 모두 BG→FG 순서로 통일(PDF Step1→2). 컴포넌트는 이 서술자만 받아 동작하며 시스템별 분기를 갖지 않는다.
 *
 * ⚠️ 지금은 repo 설정 모듈(icon-grid colorway와 같은 성격). 모델 확정 후 Payload 컬렉션으로 승격 예정
 * (브랜드 자산이므로). recommended 판정 중 tone-in-tone은 임시 규칙 — 실제 40종은 p27/28 Figma 데이터로 교체.
 */
export type PairingSwatch = { id: string; hex: string; family: string; tone: number | null }
export type PairingGrade = 'forbidden' | 'allowed' | 'recommended'

export type PairingSystem = {
	key: string
	label: string
	description: string
	/** Step1에서 배경색으로 고를 수 있는 스와치인지. */
	bgEligible: (s: PairingSwatch) => boolean
	/** 주어진 배경색에 대해 전경색 후보의 등급. */
	classify: (bg: PairingSwatch, fg: PairingSwatch) => PairingGrade
}

// id 규약('<family>-<tone>' | 'main-<name>')에서 계열/톤 파생. 중립(white/black)은 tone=null.
export function enrichPairing(sw: { id: string; hex: string }): PairingSwatch {
	const [head, tail] = sw.id.split('-')
	const tone = /^[1-5]$/.test(tail ?? '') ? Number(tail) : null
	return { id: sw.id, hex: sw.hex, family: tone ? head : 'neutral', tone }
}

// Tone in Tone: BG 톤 → 허용 FG 톤 (p.26).
const TONE_IN_MATRIX: Record<number, number[]> = {
	1: [3, 4, 5],
	2: [4, 5],
	3: [1, 3, 5],
	4: [1, 2, 3],
	5: [1, 2, 3],
}

const isChromatic = (s: PairingSwatch) => s.tone != null

// ① Tone in Tone — 서로 다른 색상 계열 조합. 생동감/에너제틱(Level 3).
export const toneInTone: PairingSystem = {
	key: 'tone-in-tone',
	label: 'Tone in Tone',
	description: '서로 다른 색상 계열 · 생동감·에너제틱 (Level 3)',
	bgEligible: isChromatic,
	classify: (bg, fg) => {
		if (bg.tone == null || fg.tone == null) return 'forbidden'
		if (fg.family === bg.family) return 'forbidden'
		if (!TONE_IN_MATRIX[bg.tone]?.includes(fg.tone)) return 'forbidden'
		// ponytail: 추천 = 핵심 톤(3) 임시 규칙. 실제 40종은 p27/28 Figma 데이터 확보 후 교체.
		return fg.tone === 3 ? 'recommended' : 'allowed'
	},
}

// ② Tone on Tone — 동일 색상 계열 내 명도 조합. 안정감/가독성(Level 2).
export const toneOnTone: PairingSystem = {
	key: 'tone-on-tone',
	label: 'Tone on Tone',
	description: '동일 색상 계열 · 시각 안정감·가독성 (Level 2)',
	bgEligible: isChromatic,
	classify: (bg, fg) => {
		if (bg.tone == null || fg.tone == null) return 'forbidden'
		if (fg.family !== bg.family) return 'forbidden'
		if (fg.tone === bg.tone) return 'forbidden'
		// 명도차 2단계 이상이면 가독성 확보 → 추천(고대비), 1단계는 저대비로 가능.
		return Math.abs(fg.tone - bg.tone) >= 2 ? 'recommended' : 'allowed'
	},
}

// ③ Mono Tone — Black/White + 유채색 조합. 선명도 강조(Level 1).
export const monoTone: PairingSystem = {
	key: 'mono-tone',
	label: 'Mono Tone',
	description: 'Black/White + 유채색 · 선명도 강조 (Level 1)',
	bgEligible: () => true, // 유채색·무채색 모두 배경 가능
	classify: (bg, fg) => {
		const bgAch = bg.tone == null
		const fgAch = fg.tone == null
		if (!bgAch && !fgAch) return 'forbidden' // 둘 다 유채색 = 모노톤 아님
		if (bgAch) return 'allowed' // 무채 배경 + 유채(또는 무채) 전경
		// 유채 배경 + 무채 전경: 배경 명도로 흑/백 대비 판단(어두우면 White, 밝으면 Black).
		if (bg.tone === 3) return 'recommended' // 중간 톤 → 흑·백 모두 권장
		const darkBg = (bg.tone ?? 0) >= 4
		const fgWhite = isLightColor(fg.hex)
		return (darkBg && fgWhite) || (!darkBg && !fgWhite) ? 'recommended' : 'allowed'
	},
}

export const PAIRING_SYSTEMS = [toneInTone, toneOnTone, monoTone]
