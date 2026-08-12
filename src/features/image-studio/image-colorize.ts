import type { CSSProperties } from 'react'

/** 색 조정 세션 값 — 라인 색은 필수, 배경은 계약이 열었을 때만 존재한다. */
export type ImageColorAdjustment = { line: string; background?: string }

/** 색을 얹는 2겹 — 바닥(base)은 컨테이너, 위(overlay)는 이미지를 마스크로만 쓰는 층이다. */
export type ImageColorizeStyle = {
	base: CSSProperties
	overlay: CSSProperties
}

/**
 * 이미지 한 장을 지정한 색으로 물들이는 mask CSS 선언을 만든다 — 프리뷰 오버레이와 저장용 HTML이
 * 이 출력을 함께 써서 화면 색과 저장된 색이 갈라지지 않게 한다. 순수 함수(DOM·네트워크 접근 없음).
 * 기법 원형은 compose-template-html.client의 applyImageColorize와 같다.
 */
export function imageColorizeStyle(src: string, color: ImageColorAdjustment): ImageColorizeStyle {
	// 홑따옴표로 감싼다 — 이 선언은 style="..." 속성으로도 직렬화되므로 겹따옴표를 쓰면 속성이
	// 거기서 끊긴다. src의 홑따옴표는 URL 경로에서 동등한 %27로 바꿔 선언이 깨지지 않게 한다.
	const mask = `url('${src.replaceAll("'", '%27')}')`
	if (color.background) {
		// 바닥=라인 색, 위=배경색 + luminance 마스크(밝은 영역만 배경색, 어두운 선은 바닥이 비친다).
		return {
			base: { backgroundColor: color.line },
			overlay: {
				backgroundColor: color.background,
				maskImage: mask,
				maskMode: 'luminance',
				maskSize: '100% 100%',
				maskPosition: 'center',
				maskRepeat: 'no-repeat',
			},
		}
	}
	// 반전 마스크: 기준층(불투명 gradient)에서 이미지 luminance를 빼면(subtract) 어두운 선만
	// 불투명해져 라인 색으로 칠해지고 나머지는 투명이다(바닥이 그대로 비친다).
	// 기준층 4px 인셋은 박스 가장자리 AA 픽셀에 선 색이 남는 잔선을 막는다.
	// gradient의 #ffffff는 색 선택이 아니라 마스크 알파값 1이다(docs/09 §4 색 토큰 대상 아님).
	return {
		base: {},
		overlay: {
			backgroundColor: color.line,
			maskImage: `linear-gradient(#ffffff,#ffffff), ${mask}`,
			maskMode: 'alpha, luminance',
			maskComposite: 'subtract',
			maskSize: `calc(100% - 4px) calc(100% - 4px), 100% 100%`,
			maskPosition: 'center, center',
			maskRepeat: 'no-repeat, no-repeat',
		},
	}
}
