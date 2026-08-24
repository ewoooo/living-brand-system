/**
 * 사이드바가 만지는 슬롯을 캔버스에서 집어 보여 주는 CSS — 네 모서리의 ㄱ자 브래킷이다.
 *
 * 🔑 **주입된 HTML의 DOM을 건드리지 않는다.** 캔버스 HTML은 타이핑 한 번마다 재합성돼
 *    innerHTML이 통째로 갈리므로 거기 붙인 클래스·속성은 다음 입력에 사라진다. 별도 `<style>`은
 *    React 노드라 살아남고, export는 `composedHtml` 문자열에서 새로 만들므로 여기 흔적이 안 간다.
 *
 * 🔑 **`::after`에 그린다** — 인라인 style은 의사요소를 못 겨냥하므로 임포트 HTML이 무엇을 선언해도
 *    브래킷이 진다. 요소 자신에 그리면 임포트가 굳힌 인라인 `box-shadow`·`outline`에 덮인다.
 *
 * 🔑 브래킷은 **테두리를 네 모서리만 남기고 mask로 자른 것**이다. 모서리마다 그라디언트를 조립하는
 *    대신 `border` 한 줄 + 정사각 mask 4겹이라, 두께·색을 한 자리에서 바꾼다.
 *
 * 🔴 **캔버스는 두 번 축소된다** — `fitPreviewSize`가 정한 `scale`과 Preview Size 컨트롤의
 *    `--preview-scale`이 곱해진다. 앞쪽만 보정하면 기본값(`DEFAULT_PREVIEW_SIZE = 50`)에서 선이
 *    절반 두께로 찍혀 점처럼 깨져 보인다(2026-08-24 실측: 총배율 0.287인데 0.574로 보정했다).
 *    🔑 그래서 `--preview-scale`을 **CSS에서 그대로 읽는다** — 그 변수는 미리보기 판에 인라인으로
 *    걸려 있어 후손이 상속한다. 값이 바뀌면 `calc`가 저절로 다시 풀리므로 리렌더도 실측도 없다.
 *    🔴 그 배율의 transform은 `lg:`에서만 걸리는데 변수는 항상 있다 — 좁은 화면에서는 선이 그만큼
 *    두꺼워진다. 스튜디오는 데스크톱 편집기라 그쪽을 감수한다(브레이크포인트를 코드로 복제하지 않는다).
 *
 * 🔴 색은 `--primary`와 `--primary-foreground` **두 겹**이다. 캔버스는 앱 테마를 안 따른다 —
 *    판의 색은 템플릿이 소유하므로 다크 모드 앱에 흰 템플릿이 놓인다. 한 색으로 그리면 그 조합에서
 *    사라진다(2026-08-24 실측). 이 둘은 정의상 대비되는 짝이라(docs/09 §5) 어느 바탕에서도 한 겹은
 *    읽힌다. 🔴 채도 0인 `--accent`·`--ring`으로는 이 성질이 없다.
 *
 * 🔴 `position:relative`를 **스타일시트에** 쓴다 — 임포트가 굳힌 인라인 `position:absolute`가
 *    우선순위로 이기므로 절대배치 노드는 그대로 두고, position이 없는 노드만 자기 박스를 만든다.
 * 🔴 `[data-slot="template-preview"]` 아래로 한정한다 — `data-node-id`는 어드민 캔버스에도 있다.
 */
export function slotHighlightCss(nodeId: string, scale: number): string {
	// nodeId는 Figma 노드 id(`1:23` 등)라 콜론이 섞인다 — 속성 선택자의 인용값이라 안전하지만
	// 값 안의 따옴표·백슬래시는 선택자를 깨뜨리므로 막는다.
	const escaped = nodeId.replace(/["\\]/g, '\\$&')
	// scale이 0이나 음수로 오는 순간(측정 전 첫 프레임) 배율이 무의미해진다 — 1로 떨어뜨린다.
	const fit = scale > 0 ? scale : 1
	// 화면 1px에 해당하는 캔버스 길이. 총배율의 역수이고, 뒤 절반은 CSS가 런타임에 채운다.
	const unit = `calc(1px / (${fit} * var(--preview-scale, 1)))`
	// 🔴 팔이 요소 절반을 넘으면 브래킷이 이어져 그냥 테두리가 된다 — 30%로 가둔다.
	const arm = 'min(calc(14 * var(--slot-bracket-unit)), 30%)'
	// 총배율이 2를 넘는 확대(작은 캔버스를 키워 맞춘 경우)에서도 선이 1px 아래로 내려가지 않게.
	const width = 'max(1px, calc(2 * var(--slot-bracket-unit)))'
	const target = `[data-slot="template-preview"] [data-node-id="${escaped}"]`
	const corner = (x: string, y: string) =>
		`linear-gradient(#000,#000) ${x} ${y}/var(--slot-bracket-arm) var(--slot-bracket-arm) no-repeat`
	return (
		`${target}{position:relative}` +
		`${target}::after{` +
		'content:"";position:absolute;inset:0;pointer-events:none;box-sizing:border-box;' +
		`--slot-bracket-unit:${unit};--slot-bracket-arm:${arm};` +
		`border:${width} solid var(--primary);` +
		`box-shadow:inset 0 0 0 ${width} var(--primary-foreground);` +
		`mask:${corner('left', 'top')},${corner('right', 'top')},` +
		`${corner('left', 'bottom')},${corner('right', 'bottom')}}`
	)
}
