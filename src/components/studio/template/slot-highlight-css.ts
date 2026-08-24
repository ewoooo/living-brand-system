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
 * 🔴 `position:relative`를 **스타일시트에** 쓴다 — 임포트가 굳힌 인라인 `position:absolute`가
 *    우선순위로 이기므로 절대배치 노드는 그대로 두고, position이 없는 노드만 자기 박스를 만든다.
 *    (의사요소가 조상 박스에 붙어 엉뚱한 자리에 뜨는 것을 막는 유일한 수단이다.)
 *
 * 🔴 색은 `--primary`와 `--primary-foreground` **두 겹**이다. 캔버스는 앱 테마를 안 따른다 —
 *    판의 색은 템플릿이 소유하므로 다크 모드 앱에 흰 템플릿이 놓인다. 한 색으로 그리면 그 조합에서
 *    사라진다(2026-08-24 실측). 이 둘은 정의상 대비되는 짝이라(docs/09 §5) 어느 바탕에서도 한 겹은
 *    읽힌다. 🔴 채도 0인 `--accent`·`--ring`으로는 이 성질이 없다.
 *
 * 🔑 두께·팔 길이를 `scale`로 나눈다 — 캔버스는 축소 렌더되므로 나누지 않으면 선이 사라진다.
 * 🔴 `[data-slot="template-preview"]` 아래로 한정한다 — `data-node-id`는 어드민 캔버스에도 있다.
 */
export function slotHighlightCss(nodeId: string, scale: number): string {
	// nodeId는 Figma 노드 id(`1:23` 등)라 콜론이 섞인다 — 속성 선택자의 인용값이라 안전하지만
	// 값 안의 따옴표·백슬래시는 선택자를 깨뜨리므로 막는다.
	const escaped = nodeId.replace(/["\\]/g, '\\$&')
	// scale이 0이나 음수로 오는 순간(측정 전 첫 프레임) 두께가 무의미해진다 — 원래 값으로 떨어뜨린다.
	const factor = scale > 0 ? 1 / scale : 1
	const width = Math.max(1, 2 * factor)
	// 🔴 팔이 요소 절반을 넘으면 브래킷이 이어져 그냥 테두리가 된다 — 30%로 가둔다.
	const arm = `min(${Math.max(6, 14 * factor)}px, 30%)`
	const target = `[data-slot="template-preview"] [data-node-id="${escaped}"]`
	const corner = (x: string, y: string) =>
		`linear-gradient(#000,#000) ${x} ${y}/var(--slot-bracket-arm) var(--slot-bracket-arm) no-repeat`
	return (
		`${target}{position:relative}` +
		`${target}::after{` +
		'content:"";position:absolute;inset:0;pointer-events:none;box-sizing:border-box;' +
		`--slot-bracket-arm:${arm};` +
		`border:${width}px solid var(--primary);` +
		`box-shadow:inset 0 0 0 ${width}px var(--primary-foreground);` +
		`mask:${corner('left', 'top')},${corner('right', 'top')},` +
		`${corner('left', 'bottom')},${corner('right', 'bottom')}}`
	)
}
