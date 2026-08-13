import * as layout from '@carbon/layout'
import { describe, expect, it } from 'vitest'

// `docs/09` §9이 적어 둔 Carbon 스케일 표가 실제 패키지 값과 같은지 지킨다.
//
// 🔴 왜 필요한가: 이 표의 존재 이유는 "값을 기억으로 부르지 않는다"이다. 그런데 표 자체가 문서에
//    복제된 숫자라서, 검증이 없으면 시간이 지나며 조용히 낡는다 — 낡은 표를 보고 값을 정하는 것은
//    기억으로 부르는 것과 똑같아진다.
//
// 부수 효과가 하나 더 있고 그것도 의도한 것이다: `@carbon/layout`은 런타임 코드가 import하지 않아
// "쓰이지 않는 의존성"으로 보인다. 이 파일이 그것을 실제로 읽으므로 지우면 여기서 깨진다.

/** rem 문자열(`'0.5rem'`)을 px 정수로. Carbon의 baseFontSize는 16이다. */
function px(value: string): number {
	return Number.parseFloat(value) * layout.baseFontSize
}

describe('Carbon 스케일 표', () => {
	const spacingEntries = Object.entries(layout)
		.filter(([key]) => /^spacing\d\d$/.test(key))
		.sort(([a], [b]) => a.localeCompare(b))

	// 🔴 이름 규칙이 바뀌면 위 필터가 0건이 되고, 그러면 아래 표 검증이 통째로 사라진다.
	//    보지 않는 것은 통과시키는 것과 구별되지 않으므로 무엇을 봤는지 먼저 확인한다.
	it('간격 단계를 실제로 찾는다', () => {
		expect(spacingEntries).toHaveLength(13)
	})

	it('간격 13단계가 문서의 표와 같다', () => {
		// docs/09 §9의 표. Tailwind 기본 단계와 일치해 새 토큰이 필요하지 않다는 근거다.
		expect(spacingEntries.map(([, value]) => px(value as string))).toEqual([
			2, 4, 8, 12, 16, 24, 32, 40, 48, 64, 80, 96, 160,
		])
	})

	it('컨트롤 높이가 문서의 표와 같다', () => {
		const sizes = layout.sizes as Record<string, string>
		expect(Object.fromEntries(Object.entries(sizes).map(([k, v]) => [k, px(v)]))).toEqual({
			XSmall: 24,
			Small: 32,
			Medium: 40,
			Large: 48,
			XLarge: 64,
			'2XLarge': 80,
		})
	})
})
