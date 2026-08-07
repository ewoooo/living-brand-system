import { type LanguageKey, LEADING, WEIGHT_SAMPLE, type WeightKey } from '../brand-typeface'
import { TypeWeightView } from './view'

// 위젯(서버): 언어에 딸린 규정(표본 문구·행간)을 평면 값으로 풀어 뷰에 넘긴다.
// 런타임에 바뀌는 건 굵기 하나뿐이라 뷰는 그것만 쥔다.
//
// 🔴 props 타입을 직접 선언한다 — payload-types.ts에 이 블록이 아직 없다(등록은 상위 몫).
export function TypeWeightWidget({
	language,
	initialWeight,
}: {
	language?: LanguageKey | null
	initialWeight?: WeightKey | null
} = {}) {
	// 갤러리는 props 없이 렌더하므로 기본값으로도 화면이 서야 한다.
	const lang = language ?? 'ko'

	return (
		<TypeWeightView
			sample={WEIGHT_SAMPLE[lang]}
			// 굵기만 비교하는 판이라 행간은 고정한다. 임의 값 대신 그 언어의 Head Copy 규정 하한을 쓴다 —
			// 국문 130% / 영문 115% / 대문자 105%로 언어마다 다르고, 눈대중으로 정할 값이 아니다.
			leading={LEADING[lang].head[0] / 100}
			initialWeight={initialWeight ?? 'medium'}
		/>
	)
}

export default TypeWeightWidget
