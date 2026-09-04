import type { GuidelineBlock } from '../types'

/**
 * 가이드라인 본문의 세로 리듬과 배치 어휘. 값은 전부 여기 한 곳이 소유한다 — 디자인 수치가
 * 바뀌면 이 파일만 고친다(docs/09 §7).
 *
 * 🔴 블록 사이 간격을 부모의 `gap`이 아니라 **자식의 위쪽 여백**으로 준다. 한 목록 안에 두 리듬이
 *    섞이기 때문이다 — 섹션(section) 사이는 288, 그 밖의 블록 사이는 32(Figma 61:3376의 Article
 *    스택). gap 하나로는 표현할 수 없고, 종류별로 배열을 갈라 그리면 admin이 섞어 넣은 순서가
 *    뒤집힌다. 최상위 스택(`components/guideline-blocks.tsx`)과 섹션 안의 스택(`section`)이
 *    같은 값을 읽는다.
 */
export const BLOCK_SPACING: Record<GuidelineBlock['blockType'], string> = {
	section: '[&:not(:first-child)]:mt-72',
	block: '[&:not(:first-child)]:mt-8',
}

/**
 * 본문 텍스트가 앉는 **오른쪽 반칸**(Figma 61:3299·61:3376의 Article 텍스트 열). 지금은 섹션 제목이
 * 쓴다. 본문 텍스트 자리가 늘면 같은 열에 세워야 한 페이지 안에서 세로선이 맞는다. 좁은 화면에서는 한 열이다.
 */
export const RIGHT_HALF = {
	grid: 'grid md:grid-cols-2',
	cell: 'md:col-start-2',
} as const
