import type { LanguageKey } from '../brand-typeface'
import { TypeLanguageView } from './view'

// 위젯(서버): 저장값을 정리해 뷰에 넘기기만 한다. 표본과 행간 규정은 brand-typeface가 소유하므로
// 조회할 관계도, 계산할 URL도 없다.
//
// props 타입을 여기서 직접 선언한다 — payload-types.ts는 등록 뒤에야 이 위젯을 갖는다.
export function TypeLanguageWidget({
	initialLanguage,
	layout,
}: {
	initialLanguage?: LanguageKey | null
	layout?: 'single' | 'compare' | null
} = {}) {
	// 갤러리는 props 없이 렌더한다. 기본값은 스키마와 같은 국문·전환이다.
	const resolved = initialLanguage ?? 'ko'

	// 🔴 key로 언어를 물린다. 화면의 선택은 뷰의 state라, admin에서 초기 언어를 바꿔도 state가
	//    살아남으면 저작자가 필드를 고쳐도 화면이 안 바뀐다(type-hierarchy와 같은 처리).
	return (
		<TypeLanguageView key={resolved} initialLanguage={resolved} layout={layout ?? 'single'} />
	)
}

export default TypeLanguageWidget
