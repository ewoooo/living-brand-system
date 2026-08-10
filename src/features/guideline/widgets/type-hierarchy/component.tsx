import type { LanguageKey } from '../brand-typeface'
import { TypeHierarchyView } from './view'

// 위젯(서버): 인스턴스가 고른 언어를 확정해 뷰에 넘긴다. 조회할 컬렉션이 없어 하는 일이 이것뿐이다
// — 규정 표(행간·크기·예시 문구)는 brand-typeface.ts가 소유하고 뷰가 직접 읽는다.
//
// 🔴 payload-types에 아직 이 위젯 타입이 없어 props 타입을 여기서 선언한다(등록은 상위가 한다).
export function TypeHierarchyWidget({ language }: { language?: LanguageKey | null }) {
	// 갤러리는 props 없이 렌더하므로 기본값이 있어야 화면이 비지 않는다.
	const resolved = language ?? 'ko'

	// 🔴 key로 언어를 물린다. 편집한 문구는 뷰의 state라, admin에서 언어를 바꿔도 state가 살아남으면
	//    국문 예시가 영문 규정 위에 남는다. 언어가 바뀌면 뷰를 새로 만든다.
	return <TypeHierarchyView key={resolved} language={resolved} />
}

export default TypeHierarchyWidget
