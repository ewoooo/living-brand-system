import { AVAILABLE_WEIGHTS, SCRAMBLE_DEFAULT, WEIGHTS, type WeightKey } from '../brand-typeface'
import { TypeScrambleView } from './view'

// 위젯(서버): 인스턴스 값을 정리해 뷰에 넘긴다. 애니메이션과 크기 맞춤은 전부 뷰가 맡는다.
//
// props 타입을 손으로 적는다 — payload-types.ts는 상위가 이 위젯을 등록한 뒤에야 생성된다.
export function TypeScrambleWidget({
	text,
	weight,
}: {
	text?: string | null
	weight?: WeightKey | null
} = {}) {
	// 줄 하나가 문자열 하나다(배열 필드 금지의 대가). 빈 줄은 순환에서 빠진다.
	const lines = (text ?? '')
		.split('\n')
		.map((line) => line.trim())
		.filter(Boolean)

	// 갤러리는 props 없이 렌더하므로 기본 문구로 화면을 채운다.
	const targets = lines.length > 0 ? lines : [SCRAMBLE_DEFAULT]

	const chosen = WEIGHTS.find((w) => w.key === weight) ?? WEIGHTS[2]

	return (
		<TypeScrambleView
			targets={targets}
			weight={chosen.value}
			// 🔴 지금 붙은 서체 파일에 없는 굵기는 브라우저가 합성한다 — 원본과 다르게 보이므로
			//    "이건 진짜 그 굵기가 아니다"를 화면에 알린다. 서체가 교체되면 저절로 사라진다.
			synthetic={!AVAILABLE_WEIGHTS.includes(chosen.value)}
			weightLabel={chosen.label}
		/>
	)
}

export default TypeScrambleWidget
