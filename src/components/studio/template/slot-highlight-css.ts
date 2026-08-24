/**
 * 사이드바가 만지는 슬롯을 캔버스에서 집어 보여 주는 CSS 한 줄.
 *
 * 🔑 **주입된 HTML의 DOM을 건드리지 않는다.** 캔버스 HTML은 타이핑 한 번마다 재합성돼
 *    innerHTML이 통째로 갈리므로 거기 붙인 클래스·속성은 다음 입력에 사라진다. 별도 `<style>`은
 *    React 노드라 살아남고, 내보내는 HTML(`artifact`)에도 들어가지 않는다.
 * 🔴 안쪽으로 그린다(`outline-offset` 음수) — 슬롯 상당수가 `overflow:hidden` 클립 프레임이라
 *    바깥으로 그리면 조상이 잘라 먹는다.
 * 🔑 두께를 `scale`로 나눈다 — 캔버스는 축소 렌더되므로 나누지 않으면 미리보기에서 선이 사라진다.
 * 🔴 `[data-slot="template-preview"]` 아래로 한정한다 — `data-node-id`는 어드민 캔버스에도 있다.
 *
 * 🔴 **두 톤인 이유** — 캔버스는 앱 테마를 안 따른다. 판의 색은 템플릿이 소유하므로 다크 모드의
 *    앱에 흰 템플릿이 놓이고, 한 색으로 그리면 그 조합에서 선이 사라진다(2026-08-24 실측: 다크
 *    모드 `--primary`가 L91인데 캔버스가 흰 판이라 안 보였다). `--primary`와
 *    `--primary-foreground`는 **정의상 서로 대비되는 짝**이라(docs/09 §5) 둘을 나란히 두면 어느
 *    바탕에서도 최소 한 겹이 읽힌다. 🔴 채도 0인 `--accent`·`--ring`으로는 이 성질이 없다.
 *
 * 바깥 겹은 `outline`, 안쪽 겹은 inset `box-shadow`다 — 둘 다 레이아웃을 안 건드리고, outline이
 * box-shadow 위에 그려져 [0,W]=outline · [W,2W]=shadow로 갈린다.
 * ponytail: 인라인 `box-shadow`를 가진 임포트 노드에서는 안쪽 겹이 덮인다(바깥 겹은 남는다).
 *   그 자리까지 지켜야 하면 `::after`에 링을 그린다 — 인라인 style이 못 닿는 자리다.
 */
export function slotHighlightCss(nodeId: string, scale: number): string {
	// nodeId는 Figma 노드 id(`1:23` 등)라 콜론이 섞인다 — 속성 선택자의 인용값이라 안전하지만
	// 값 안의 따옴표·백슬래시는 선택자를 깨뜨리므로 막는다.
	const escaped = nodeId.replace(/["\\]/g, '\\$&')
	// scale이 0이나 음수로 오는 순간(측정 전 첫 프레임) 두께가 무의미해진다 — 1px로 떨어뜨린다.
	const width = scale > 0 ? Math.max(1, 2 / scale) : 1
	return (
		`[data-slot="template-preview"] [data-node-id="${escaped}"]{` +
		`outline:${width}px solid var(--primary);outline-offset:-${width}px;` +
		`box-shadow:inset 0 0 0 ${width * 2}px var(--primary-foreground)}`
	)
}
