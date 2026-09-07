/**
 * 가이드라인 본문의 세로 리듬과 배치 어휘. 값은 전부 여기 한 곳이 소유한다 — 디자인 수치가
 * 바뀌면 이 파일만 고친다(docs/09 §7).
 */

/** 루트 블록(section·base·overview·examples) 사이 간격(Figma 61:3376의 Article 스택, 288). 전부 같은 스택에 앉으므로 리듬은 하나다. */
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
 * 카드 **줄 높이**. 카드는 폭이 아니라 높이 기준으로 선다(2026-09-07) — 판이 이 높이를 갖고 폭은 카드의
 * 비율에서 계산된다. 그래서 세로형·가로형이 한 줄에 섞여도 줄이 고르다. 값은 프레임 폭에 비례하고
 * (Figma 740/1655 ≈ 45%가 "보통") 상한을 둔다. 좁은 화면(md 미만)에서는 한 열·폭 기준으로 돌아간다 —
 * 높이 기준을 유지하면 세로형 카드가 손가락 하나 폭이 된다.
 * 단계의 뜻(낮게·보통·높게)은 `blocks/shared/base-fields.ts`의 `ROW_HEIGHTS`가 소유한다.
 */
export const CARD_ROW_HEIGHT = {
	low: 'md:h-[min(30vw,30rem)]',
	medium: 'md:h-[min(45vw,46rem)]',
	high: 'md:h-[min(60vw,60rem)]',
} as const
/** 격자 = 줄바꿈 행. 카드 판이 줄 높이를 갖고 줄이 차면 내려간다. 좁은 화면은 한 열. */
export const CARD_ROWS = 'flex flex-col gap-4 md:flex-row md:flex-wrap'
