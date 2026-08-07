// 섹션 표지 위젯(서버) — 딥그린 면 + 좌상단 2단 breadcrumb(챕터코드/챕터제목, 섹션코드/섹션제목).
// PDF divider(p1·17·22)의 재현이다. 스크롤 앵커·목차 진입점 역할이라 본문 산문도 인터랙션도 없다.
// 위젯은 자기 셀의 면만 칠한다 — 전체폭·폭 결정권은 Block 소관이라 max-width를 갖지 않는다.
// 🔴 네 필드 모두 `t()`로 샘플 폴백한다. props 없이 렌더해도(갤러리) 의미 있는 화면이 나와야 한다.
// 🔴 글자 크기는 판형 폭 기준 cqw다 — 고정 px이면 좁은 셀에서 비율 고정 박스를 넘친다(layout-grid 선례).

// ponytail: 상수 2개뿐이라 rules.ts로 가르지 않았다. schema가 이 값들을 읽지 않으므로 나눌 이유가 없다
// (layout-grid의 GRID_COLOR도 component.tsx 안에 있다). schema와 공유할 상수가 생기면 그때 rules.ts로 뺀다.

/** 표지 배경 딥그린 = HD현대 CI 그린. 출처: scripts/assets/ci/symbol-default.svg의 심볼 fill
 *  (widgets/layout-grid의 GRID_COLOR와 같은 값). 🔴 임시 리터럴 — brand-colors의 main 색으로 교체될 자리다.
 *  guideline-content.json의 #002B1E·#195F30은 essenherb 레거시라 쓰지 않는다. */
const DEEP_GREEN = '#007332'

/** props가 비었을 때의 기본 표지 = PDF p1. 출처: .scratch/hd-reference/02-copy.md 'Divider 텍스트'. */
const SAMPLE = {
	chapterCode: 'B',
	chapterTitle: 'BRAND DESIGN ELEMENTS',
	sectionCode: 'B.1',
	sectionTitle: 'CI',
}

/** 값이 없거나 공백뿐이면 샘플로 떨어진다 — admin에서 비운 칸은 null이 아니라 ''로 오기도 한다. */
const t = (value: string | null | undefined, sample: string) => value?.trim() || sample

export function SectionDividerWidget({
	chapterCode,
	chapterTitle,
	sectionCode,
	sectionTitle,
}: {
	/** 챕터 코드 (예: B) */
	chapterCode?: string | null
	/** 챕터 제목 (예: BRAND DESIGN ELEMENTS) */
	chapterTitle?: string | null
	/** 섹션 코드 (예: B.1) */
	sectionCode?: string | null
	/** 섹션 제목 (예: CI) — 국문일 수도 영문일 수도 있다 */
	sectionTitle?: string | null
}) {
	return (
		// 판형 = cq 기준 컨테이너. 전경이 흰색 고정인 것은 이 div가 스스로 깐 딥그린 면 위이기 때문이다
		// (테마 토큰이 아니라 면 종속 색). 긴 CMS 문자열은 판형 밖으로 새지 않게 잘린다.
		// 🔴 cq 값은 조상 컨테이너 기준이라 판형 자신에게는 못 쓴다 — 여백은 안쪽 div가 가진다.
		<div
			className="aspect-video w-full overflow-hidden font-body text-white"
			style={{ containerType: 'size', background: DEEP_GREEN }}
		>
			<div className="flex flex-col" style={{ padding: '5cqw', gap: '4cqw' }}>
				<div className="flex text-white/70" style={{ gap: '1.5cqw', fontSize: '1.6cqw' }}>
					<span>{t(chapterCode, SAMPLE.chapterCode)}</span>
					<span>{t(chapterTitle, SAMPLE.chapterTitle)}</span>
				</div>
				<div className="flex flex-col" style={{ gap: '1cqw' }}>
					<span className="text-white/70" style={{ fontSize: '1.6cqw' }}>
						{t(sectionCode, SAMPLE.sectionCode)}
					</span>
					<span style={{ fontSize: '5cqw', lineHeight: '100%' }}>
						{t(sectionTitle, SAMPLE.sectionTitle)}
					</span>
				</div>
			</div>
		</div>
	)
}

export default SectionDividerWidget
