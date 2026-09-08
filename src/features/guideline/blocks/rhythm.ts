/**
 * 가이드라인 본문의 세로 리듬과 배치 어휘. 값은 전부 여기 한 곳이 소유한다 — 디자인 수치가
 * 바뀌면 이 파일만 고친다(docs/09 §7).
 */

/** 루트 블록(section·base·overview·examples) 사이 간격(Figma 61:3376의 Article 스택, 288). 전부 같은 스택에 앉으므로 리듬은 하나다. */
export const SECTION_STACK = 'flex flex-col gap-72'

/**
 * 카드 **줄 높이**. 카드는 폭이 아니라 높이 기준으로 선다(2026-09-07) — 판이 이 높이를 갖고 폭은 카드의
 * 비율에서 계산된다. 그래서 세로형·가로형이 한 줄에 섞여도 줄이 고르다. 값은 뷰포트 폭에 비례하고
 * (Figma 740/1655 ≈ 45%가 "보통") 상한을 둔다. 좁은 화면(md 미만)에서는 한 열·폭 기준으로 돌아간다 —
 * 높이 기준을 유지하면 세로형 카드가 손가락 하나 폭이 된다.
 * 단계의 뜻(낮게·보통·높게)은 `blocks/fields.ts`의 `ROW_HEIGHTS`가 소유한다.
 */
export const CARD_ROW_HEIGHT = {
	low: 'md:h-[min(30vw,30rem)]',
	medium: 'md:h-[min(45vw,46rem)]',
	high: 'md:h-[min(60vw,60rem)]',
} as const
/** 격자 = 줄바꿈 행. 컨테이너 폭으로 카드 최대 높이를 제한해 비율을 유지한다. 좁은 화면은 한 열. */
export const CARD_ROWS = '@container flex flex-col gap-4 md:flex-row md:flex-wrap'
