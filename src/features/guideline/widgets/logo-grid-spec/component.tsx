import { type Form, NAME_EN_DEFAULT, NAME_KO_DEFAULT } from './rules'
import { LogoGridSpecView } from './view'

// 자회사 CI 그리드 스펙 위젯(서버) — CMS 값과 기본 샘플을 합쳐 평면 props로 뷰에 넘긴다.
// 🔴 props가 하나도 없으면 p18 가로형A 국문 샘플을 그린다. 갤러리가 <LogoGridSpecWidget />로
//    렌더하므로 빈 화면이 되면 목록에 못 올라간다(logo-display·clearspace-overlay가 그 상태다).
// 🔑 자회사 로고 에셋이 리포에 0건이라 로고 이미지 없이 규격만으로 성립하게 만들었다 —
//    심볼 SVG와 HD 웹폰트로 조립하고, 그게 아트워크가 아님을 각주로 화면에 남긴다.

export function LogoGridSpecWidget({
	form,
	nameKo,
	nameEn,
}: {
	form?: Form | null
	nameKo?: string | null
	nameEn?: string | null
}) {
	// 줄바꿈 = 행. 공백뿐이면 기본 샘플로 되돌리므로 결과는 항상 1행 이상이다.
	const enLines = (nameEn?.trim() || NAME_EN_DEFAULT)
		.split('\n')
		.map((line) => line.trim())
		.filter(Boolean)

	return (
		<LogoGridSpecView
			form={form ?? 'horizontalA'}
			nameKo={nameKo?.trim() || NAME_KO_DEFAULT}
			enLines={enLines}
		/>
	)
}

export default LogoGridSpecWidget
