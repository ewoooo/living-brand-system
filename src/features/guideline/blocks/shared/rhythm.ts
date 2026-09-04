import type { LeafSpan } from '../../leaves/registry'

/**
 * 가이드라인 본문의 세로 리듬과 배치 어휘. 값은 전부 여기 한 곳이 소유한다 — 디자인 수치가
 * 바뀌면 이 파일만 고친다(docs/09 §7).
 */

/** 섹션 사이 간격(Figma 61:3376의 Article 스택, 288). 루트에는 섹션만 오므로 리듬은 하나다. */
export const SECTION_STACK = 'flex flex-col gap-72'

/**
 * 본문 텍스트가 앉는 **오른쪽 반칸**(Figma 61:3299·61:3376의 Article 텍스트 열). 지금은 섹션 제목이
 * 쓴다. 본문 텍스트 자리가 늘면 같은 열에 세워야 한 페이지 안에서 세로선이 맞는다. 좁은 화면에서는 한 열이다.
 */
export const RIGHT_HALF = {
	grid: 'grid md:grid-cols-2',
	cell: 'md:col-start-2',
} as const

/**
 * leaf 격자. 6열 위에 폭(전폭 6·절반 3·삼분 2)을 얹으면 전폭·절반·삼분이 한 격자에서 섞인다.
 * 좁은 화면에서는 한 열이다.
 */
export const LEAF_GRID = 'grid grid-cols-1 gap-4 md:grid-cols-6'
export const LEAF_SPAN: Record<LeafSpan, string> = {
	full: 'md:col-span-6',
	half: 'md:col-span-3',
	third: 'md:col-span-2',
}
