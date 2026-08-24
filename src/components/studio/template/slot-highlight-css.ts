/**
 * 사이드바가 만지는 슬롯을 캔버스에서 집어 보여 주는 CSS — 진한 테두리 + 같은 색의 반투명 면이다.
 *
 * 🔑 **주입된 HTML의 DOM을 건드리지 않는다.** 캔버스 HTML은 타이핑 한 번마다 재합성돼
 *    innerHTML이 통째로 갈리므로 거기 붙인 클래스·속성은 다음 입력에 사라진다. 별도 `<style>`은
 *    React 노드라 살아남고, export는 `composedHtml` 문자열에서 새로 만들므로 여기 흔적이 안 간다.
 *
 * 🔑 **`::after`에 그린다** — 인라인 style은 의사요소를 못 겨냥하므로 임포트 HTML이 무엇을 선언해도
 *    강조가 진다. 요소 자신에 그리면 임포트가 굳힌 인라인 `background`·`box-shadow`에 덮인다.
 *
 * 🔴 **`<img>` 슬롯은 예외다** — replaced element에는 의사요소가 그려지지 않아 강조가 아무것도
 *    나오지 않는다(2026-08-24 실측: 로고 슬롯이 그랬다). CSS가 태그를 구별할 수 있으므로 그 갈래만
 *    요소 자신에 `outline`으로 그린다. 면은 이미지 뒤에 깔려 투명한 부분으로 비친다.
 *    🔑 `vectorColor`를 준 벡터 슬롯은 compose가 img를 div로 치환하므로 위 갈래로 돌아온다 —
 *    두 규칙이 그 전환을 자동으로 따라간다.
 *
 * 🔴 **캔버스는 두 번 축소된다** — `fitPreviewSize`가 정한 `scale`과 Preview Size 컨트롤의
 *    `--preview-scale`이 곱해진다. 앞쪽만 보정하면 기본값(`DEFAULT_PREVIEW_SIZE = 50`)에서 선이
 *    절반 두께로 찍힌다(2026-08-24 실측: 총배율 0.287인데 0.574로 보정했다).
 *    🔑 그래서 `--preview-scale`을 **CSS에서 그대로 읽는다** — 그 변수는 미리보기 판에 인라인으로
 *    걸려 있어 후손이 상속한다. 값이 바뀌면 `calc`가 저절로 다시 풀리므로 리렌더도 실측도 없다.
 *    🔴 그 배율의 transform은 `lg:`에서만 걸리는데 변수는 항상 있다 — 좁은 화면에서는 선이 그만큼
 *    두꺼워진다. 스튜디오는 데스크톱 편집기라 그쪽을 감수한다(브레이크포인트를 코드로 복제하지 않는다).
 *
 * 🔴 `position:relative`를 **스타일시트에** 쓴다 — 임포트가 굳힌 인라인 `position:absolute`가
 *    우선순위로 이기므로 절대배치 노드는 그대로 두고, position이 없는 노드만 자기 박스를 만든다.
 * 🔴 `[data-slot="template-preview"]` 아래로 한정한다 — `data-node-id`는 어드민 캔버스에도 있다.
 */

/**
 * 면의 불투명도. 반투명이라 콘텐츠가 비쳐 「무엇을 고쳤나」가 계속 보이고, 동시에 어떤 바탕에서도
 * 색이 얹혀 읽힌다 — 단색 선 하나로는 바탕색이 비슷한 자리에서 사라졌다(2026-08-24 실측).
 * ponytail: 상수 하나. 표면마다 달라져야 하면 그때 축으로 올린다.
 */
const FILL_ALPHA = '18%'

/**
 * 강조 색을 못 받았을 때의 폴백. 브랜드 주입을 받는 유일한 토큰이다(`docs/09` §5) —
 * 🔴 채도 0인 `--accent`·`--ring`은 강조로 읽히지 않으므로 쓰지 않는다.
 */
const FALLBACK_COLOR = 'var(--primary)'

/** 하위 4비트까지 허용하는 hex 형태만 CSS에 넣는다 — 값은 DB에서 오므로 선언을 깨뜨릴 수 있다. */
function cssColor(color: string | null | undefined): string {
	return color && /^#[0-9a-fA-F]{3,8}$/.test(color) ? color : FALLBACK_COLOR
}

export function slotHighlightCss(nodeId: string, scale: number, color?: string | null): string {
	// nodeId는 Figma 노드 id(`1:23` 등)라 콜론이 섞인다 — 속성 선택자의 인용값이라 안전하지만
	// 값 안의 따옴표·백슬래시는 선택자를 깨뜨리므로 막는다.
	const escaped = nodeId.replace(/["\\]/g, '\\$&')
	// scale이 0이나 음수로 오는 순간(측정 전 첫 프레임) 배율이 무의미해진다 — 1로 떨어뜨린다.
	const fit = scale > 0 ? scale : 1
	// 화면 1px에 해당하는 캔버스 길이. 총배율의 역수이고, 뒤 절반은 CSS가 런타임에 채운다.
	const unit = `calc(1px / (${fit} * var(--preview-scale, 1)))`
	// 총배율이 2를 넘는 확대(작은 캔버스를 키워 맞춘 경우)에서도 선이 1px 아래로 내려가지 않게.
	const width = 'max(1px, calc(2 * var(--slot-highlight-unit)))'
	const ink = cssColor(color)
	const fill = `color-mix(in srgb, ${ink} ${FILL_ALPHA}, transparent)`
	const target = `[data-slot="template-preview"] [data-node-id="${escaped}"]`
	return (
		`${target}{position:relative;--slot-highlight-unit:${unit}}` +
		`${target}:not(img)::after{` +
		'content:"";position:absolute;inset:0;pointer-events:none;box-sizing:border-box;' +
		`border:${width} solid ${ink};background-color:${fill}}` +
		// img는 의사요소가 없다 — 테두리를 outline으로 안쪽에 그린다(레이아웃을 안 건드린다).
		`[data-slot="template-preview"] img[data-node-id="${escaped}"]{` +
		`outline:${width} solid ${ink};outline-offset:calc(-1 * ${width});background-color:${fill}}`
	)
}
