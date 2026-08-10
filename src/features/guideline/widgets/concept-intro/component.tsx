import type { BrandLogo } from '@/payload-types'

// 개념 소개 위젯(서버) — p2를 그대로 재현하는 2단 본문. upload 관계 해석만 하고 인터랙션은 없다.
// 🔴 p2에는 비율·치수 규정이 하나도 없다(01-specs에 p2 항목 없음). 그래서 위젯이 규정 수치를 만들지 않고,
//    색도 칠하지 않는다 — 로고 파일에 박힌 색을 그대로 쓴다(금지 6: CI의 색상을 임의대로 변경할 수 없습니다).
// 🔑 props가 비면 p2 원문 + 기본 심볼로 자족 렌더한다. 갤러리가 <ConceptIntroWidget />로 렌더하기 때문.

/** p2 리드 원문. .scratch/hd-reference/02-copy.md '고유 본문 > p2' 출처 — 원문에 마침표가 없다(붙이지 말 것). */
const SAMPLE_LEAD = 'CI는 HD현대를 나타내는 대표적이며 핵심적인 시각 상징 요소입니다'

/** p2 본문 원문. 같은 출처. */
const SAMPLE_BODY =
	'앞으로 뻗어 나가는 화살표 형태의 "Forward Mark"는 녹색 계열 컬러로 다채롭게 이루어져 HD현대의 다양한 비즈니스를 하나로 결속시키며, 두려움을 모르는 혁신가이자 따뜻함을 나누는 지도자, 믿을 수 있는 전문가로서 산업 전반과 인류 사회의 지속가능한 미래를 펼쳐나가고자 하는 끊임없는 도전 의지를 담았습니다.'

/** 기본 심볼. ci-lockup/rules.ts SYMBOL.default와 같은 경로 — public URL 문자열이라 static import 함정을 피한다. */
const SAMPLE_LOGO = '/symbols/symbol-default.svg'

type LogoRef = number | BrandLogo | null | undefined

export function ConceptIntroWidget({
	lead,
	body,
	logo,
}: {
	/** 좌측 컬럼 첫 줄(리드 문장). 비면 p2 원문. */
	lead?: string | null
	/** 리드 아래 본문 단락. 비면 p2 원문. */
	body?: string | null
	/** 우측에 크게 표시할 로고. 비면 기본 심볼. */
	logo?: LogoRef
}) {
	// url이 없으면(id만 온 depth 0, 업로드 실패) 안 픽한 것으로 본다 — src와 alt가 같이 움직여야 한다.
	// url만 폴백하면 기본 심볼 그림에 픽된 로고의 alt가 붙는다.
	const picked = typeof logo === 'object' && logo?.url ? logo : null
	const logoSrc = picked?.url ?? SAMPLE_LOGO
	const logoAlt = picked?.alt ?? 'Forward Mark'

	return (
		<div className="grid w-full items-center gap-8 md:grid-cols-2">
			{/* 좌 — 리드는 크기가 아니라 굵기·전경색으로 본문과 구분한다(위젯 타이포 단계는 xs/sm 둘뿐). */}
			<div className="flex flex-col gap-4">
				<p className="font-body font-medium text-foreground text-sm leading-relaxed">
					{lead ?? SAMPLE_LEAD}
				</p>
				<p className="font-body text-muted-foreground text-sm leading-relaxed">
					{body ?? SAMPLE_BODY}
				</p>
			</div>

			{/* 우 — 로고 크기는 셀 폭 기준(cqw). 70은 규정이 아니라 화면 선택이다(p2에 로고 치수 규정이 없다).
			    높이는 이미지가 정하므로 containerType은 inline-size다 — size로 두면 높이가 0으로 붕괴한다. */}
			<div className="flex justify-center" style={{ containerType: 'inline-size' }}>
				{/* biome-ignore lint/performance/noImgElement: Payload upload URL·정적 SVG라 next/image 미사용. */}
				<img
					src={logoSrc}
					alt={logoAlt}
					style={{ width: '70cqw' }}
					className="block h-auto max-w-full"
				/>
			</div>
		</div>
	)
}

export default ConceptIntroWidget
