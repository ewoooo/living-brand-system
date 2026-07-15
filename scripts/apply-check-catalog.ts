/**
 * Check criteria 카탈로그(docs/superpowers/specs/2026-07-15-check-criteria-catalog.md) 일괄 반영.
 * 체커 7종 upsert → 전 guideline 문서의 checks/blocks[].checks 재작성(재연결·criteria·hp) →
 * 삭제 8건 → 신규 1건(secondary-logo) → 구 체커 10종 삭제.
 * 실행: pnpm exec payload run scripts/apply-check-catalog.ts
 * 사전 조건: criteria 확장 컬럼(kind/operator/expected_value/max/unit) 적용 완료, DB 백업 완료.
 */
import config from '@payload-config'
import { getPayload } from 'payload'

type CriterionSpec =
	| { kind: 'presence'; question: string; expected: 'present' | 'absent' }
	| {
			kind: 'measure'
			question: string
			operator: 'gte' | 'lte' | 'between'
			expectedValue: number
			max?: number
			unit?: string
	  }

interface RuleSpec {
	checker: string
	/** undefined = 기존 criteria 유지 (imagery-misuse 등) */
	criteria?: CriterionSpec[]
	/** undefined = 유지, null = 비움, string = 설정 */
	heuristicPrompt?: string | null
}

const CHECKERS = [
	{
		key: 'ai.logo',
		name: '로고 검수관',
		executor: 'heuristic',
		prompt: "당신은 Essenherb 로고 사용 규정 검수관이다. 로고의 원형 유지(비례·간격·기울기·획 두께), 가독성, 최소 여백, 배치 위치를 이미지에서 관측한다. 오용 예시 참고 이미지는 오용 '유형'의 설명이며 동일한 구도를 요구하지 않는다.",
	},
	{
		key: 'ai.color',
		name: '컬러 검수관',
		executor: 'heuristic',
		prompt: '당신은 Essenherb 컬러 시스템 검수관이다. 사용된 주요 색상, 페어링 구조(Tone in Tone/Tone on Tone/Mono Tone), 명도 대비를 관측한다. 포토그래피·일러스트 내부의 자연색이 아니라 그래픽 요소·배경·텍스트 컬러를 중심으로 본다.',
	},
	{
		key: 'ai.typography',
		name: '타이포그래피 검수관',
		executor: 'heuristic',
		prompt: '당신은 Essenherb 타이포그래피 검수관이다. 서체의 시각 인상(세미 세리프/산세리프/전용 서체), 웨이트·크기 위계, 자간, 대소문자 조합을 관측한다. 픽셀만으로 폰트를 확정할 수 없으면 uncertain으로 남긴다.',
	},
	{
		key: 'ai.imagery',
		name: '이미지 검수관',
		executor: 'heuristic',
		prompt: '당신은 Essenherb 포토그래피·일러스트 검수관이다. 조명·질감·배경톤·연출의 톤앤매너와 일러스트 스타일(둥근 윤곽 처리, 단순화된 표현 수위)을 관측한다.',
	},
	{
		key: 'ai.layout',
		name: '레이아웃 검수관',
		executor: 'heuristic',
		prompt: '당신은 Essenherb 레이아웃·포맷 검수관이다. 캔버스 비율, 정렬 체계(상단 정렬 용법), 요소 배치 영역, 필수 기재 요소 유무를 관측한다. 비율은 시각적 추정으로 판단하되 확신이 없으면 uncertain으로 남긴다.',
	},
	{
		key: 'advisory.copy',
		name: '브랜드 카피라이터',
		executor: 'manual',
		prompt: '당신은 Essenherb의 브랜드 카피라이터다. 이미지 속 텍스트·카피를 브랜드 보이스 — 자연의 본질과 에너지, 담백하고 세련된 어조, 비건 스킨케어의 전문성 — 관점에서 살펴보고, 문구 선택·톤·정보 위계를 개선할 구체적인 조언을 준다. 카피가 없다면 이 산출물에 어떤 브랜드 언어 자산(시그니처, 내러티브)을 더할 수 있을지 제안한다.',
	},
	{
		key: 'advisory.design',
		name: '아트 디렉터',
		executor: 'manual',
		prompt: '당신은 Essenherb의 아트 디렉터다. 컬러 운용 전략(접점 목적에 맞는 페어링 선택 — 인지 강조는 메인 컬러+모노톤, 정보 전달은 톤온톤, 생동감은 톤인톤)과 여백·간격 체계 관점에서 산출물의 완성도를 높일 구체적인 조언을 준다.',
	},
] as const

const OLD_CHECKER_KEYS = [
	'checker.background-tone',
	'checker.canvas-format',
	'checker.clear-space',
	'checker.color-combination',
	'checker.contrast',
	'checker.palette-compliance',
	'checker.relative-size',
	'checker.spot-color',
	'model.anthropic.sonnet',
	'manual.review',
]

const DELETE_KEYS = new Set([
	'logo.symbol.concept',
	'logo.misuse',
	'illustration.subject.taxonomy',
	'application.content.mix.ratio',
	'application.stationery.spec.scale',
	'application.package.spec.scale',
	'layout.advertisement.template',
	'application.advertisement.format',
])

const p = (question: string, expected: 'present' | 'absent'): CriterionSpec => ({
	kind: 'presence',
	question,
	expected,
})

const RULES: Record<string, RuleSpec> = {
	// ── ai.logo ──
	'logo.size.minimum': {
		checker: 'ai.logo',
		criteria: [
			{
				kind: 'measure',
				question: '로고 높이가 캔버스 세로 높이에서 차지하는 비율(%)은?',
				operator: 'gte',
				expectedValue: 2,
				unit: '%',
			},
			p('로고가 뭉개지거나 판독이 어려울 정도로 작게 표시되어 있는가?', 'absent'),
		],
		heuristicPrompt: null,
	},
	'logo.space.clear': {
		checker: 'ai.logo',
		criteria: [
			p(
				'로고 주변에 로고 세로획(stem) 너비의 약 3배 이상 여백이 확보되어 있는가?',
				'present',
			),
			p('다른 그래픽·텍스트 요소가 로고의 최소 여백 영역을 침범하는가?', 'absent'),
		],
		heuristicPrompt: null,
	},
	'logo.trademark': {
		checker: 'ai.logo',
		criteria: [p('® 기호가 뭉개지거나 판독 불가능할 정도로 작게 표시되어 있는가?', 'absent')],
		heuristicPrompt: '® 기호가 없는 산출물에서는 모든 기준을 not_applicable로 관측한다.',
	},
	'logo.geometry': {
		checker: 'ai.logo',
		criteria: [
			p('로고의 글자 간격·비례·기울기가 원형에서 임의 변형되어 있는가?', 'absent'),
			p('로고 일부 요소의 형태나 획 두께가 변형되어 있는가?', 'absent'),
			p('로고가 윤곽선(아웃라인)만으로 표현되어 있는가?', 'absent'),
		],
		heuristicPrompt: null,
	},
	'logo.color.misuse': {
		checker: 'ai.logo',
		criteria: [
			p('로고에 그라디언트 효과가 적용되어 있는가?', 'absent'),
			p('로고가 규정 외 컬러로 변형되어 있는가?', 'absent'),
			p('로고 내 일부 요소만 다른 컬러로 변형되어 있는가?', 'absent'),
		],
		heuristicPrompt: null,
	},
	'logo.background.legibility': {
		checker: 'ai.logo',
		criteria: [
			p('로고와 배경 간 명도 대비가 충분해 로고가 명확히 식별되는가?', 'present'),
			p('복잡한 배경 이미지·패턴이 로고의 가독성을 해치고 있는가?', 'absent'),
		],
		heuristicPrompt: null,
	},
	'logo.lockup.modifier': {
		checker: 'ai.logo',
		criteria: [
			p('서비스 로고(Essenherb Coffee)의 조합·비례가 원형 그대로 사용되었는가?', 'present'),
			p('서비스 로고가 판독이 어려울 정도로 작게 표시되어 있는가?', 'absent'),
		],
		heuristicPrompt:
			'Essenherb Coffee 서비스 로고가 없는 산출물은 모든 기준을 not_applicable로 관측한다.',
	},
	'logo.sns.placement': {
		checker: 'ai.logo',
		criteria: [
			p('로고가 콘텐츠 레이아웃 시스템이 정한 로고 영역에 배치되어 있는가?', 'present'),
			p('로고가 다른 요소와 겹쳐 가독성이 저하되어 있는가?', 'absent'),
		],
		heuristicPrompt: null,
	},
	'logo.package.placement': {
		checker: 'ai.logo',
		criteria: [
			p(
				'패키지 전면에 브랜드 로고가 레이아웃 규정(Standard Ratio·Margin·Gutter 체계)에 맞게 배치되어 있는가?',
				'present',
			),
		],
		heuristicPrompt: null,
	},
	'logo.package.variant': {
		checker: 'ai.logo',
		criteria: [
			p('패키지에 사용된 로고가 Primary 또는 Secondary Logo Type 중 하나인가?', 'present'),
			p('사용된 로고 타입이 임의 변형 없이 원형대로 사용되었는가?', 'present'),
		],
		heuristicPrompt: null,
	},
	// ── ai.color ──
	'color.palette': {
		checker: 'ai.color',
		criteria: [
			p(
				'화면의 주요 그래픽·배경·텍스트 색상이 브랜드 팔레트(Essenherb Red #EA5343, White, Black 및 가이드 수록 컬러) 내에 있는가?',
				'present',
			),
			{
				kind: 'measure',
				question: '브랜드 팔레트에 속하지 않는 색상이 그래픽 요소에서 차지하는 비율(%)은?',
				operator: 'lte',
				expectedValue: 10,
				unit: '%',
			},
		],
		heuristicPrompt:
			'포토그래피·일러스트 내부의 자연색은 팔레트 위반으로 세지 않는다. 그래픽 요소·배경·텍스트 컬러만 관측한다.',
	},
	'color.combination': {
		checker: 'ai.color',
		criteria: [
			p(
				'색 조합이 3대 페어링(Tone in Tone / Tone on Tone / Mono Tone) 중 하나를 따르는가?',
				'present',
			),
			{
				kind: 'measure',
				question: '본문 텍스트와 배경 간 대비비(contrast ratio)는?',
				operator: 'gte',
				expectedValue: 4.5,
			},
		],
		heuristicPrompt: null,
	},
	'color.combination.examples': {
		checker: 'ai.color',
		criteria: [
			p('서로 다른 색상 계열의 컬러가 조합되어 있는가?', 'present'),
			p('고채도 컬러 간 충돌로 시각적 피로·가시성 저하가 발생하는가?', 'absent'),
		],
		heuristicPrompt:
			'서로 다른 색상 계열 조합(Tone in Tone)이 아닌 산출물은 모든 기준을 not_applicable로 관측한다.',
	},
	'color.combo.tonal.balance': {
		checker: 'ai.color',
		criteria: [
			p(
				'동일 색상 계열 조합에서 배경-전경 간 명도 차이가 충분히 확보되어 있는가?',
				'present',
			),
		],
		heuristicPrompt:
			'동일 색상 계열 조합(Tone on Tone)이 아닌 산출물은 not_applicable로 관측한다.',
	},
	'color.roles': {
		checker: 'ai.color',
		criteria: [p('Black 또는 White를 기준색으로 유채색을 조합하는 구조인가?', 'present')],
		heuristicPrompt:
			'Mono Tone 페어링(Black/White 기준색)이 아닌 산출물은 not_applicable로 관측한다.',
	},
	// ── ai.typography ──
	'typography-english': {
		checker: 'ai.typography',
		criteria: [
			p(
				'영문 텍스트가 획 끝 삐침이 절제된 세미 세리프(AgfaRotis Semi Serif) 인상인가?',
				'present',
			),
			p('영문 타이포그래피가 Regular/Bold 웨이트 범위 안에서 위계를 형성하는가?', 'present'),
		],
		heuristicPrompt: null,
	},
	'typography.case': {
		checker: 'ai.typography',
		criteria: [
			p(
				'Essen Flux(로고 기반 전용 서체) 텍스트가 전체 대문자로만 조판되어 있는가?',
				'absent',
			),
		],
		heuristicPrompt:
			'Essen Flux 서체(상단 기준선 고정 구조의 전용 영문 서체)가 쓰이지 않은 산출물은 not_applicable로 관측한다.',
	},
	'typography.usage': {
		checker: 'ai.typography',
		criteria: [p('Essen Flux 서체가 영문 이외의 문자(국문 등)에 적용되어 있는가?', 'absent')],
		heuristicPrompt:
			'Essen Flux 서체(상단 기준선 고정 구조의 전용 영문 서체)가 쓰이지 않은 산출물은 not_applicable로 관측한다.',
	},
	'typography.pairing': {
		checker: 'ai.typography',
		criteria: [
			p(
				'국문·영문 병용 텍스트가 지정 웨이트 조합(Kor-Medium & Eng-Bold)으로 균일한 회색도를 유지하는가?',
				'present',
			),
		],
		heuristicPrompt: '국문과 영문이 병용된 텍스트가 없으면 not_applicable로 관측한다.',
	},
	'typography.misuse': {
		checker: 'ai.typography',
		criteria: [
			p('글자의 형태가 임의 변형(비틀기·기울이기·늘리기)되어 있는가?', 'absent'),
			p(
				'지정 서체(AgfaRotis Semi Serif / Pretendard / Essen Flux) 이외의 서체가 사용되어 있는가?',
				'absent',
			),
		],
		heuristicPrompt: null,
	},
	'typography.spacing': {
		checker: 'ai.typography',
		criteria: [
			p('글자 사이 간격이 지나치게 좁혀져 있는가?', 'absent'),
			p('글자 사이 간격이 지나치게 넓혀져 있는가?', 'absent'),
		],
		heuristicPrompt: null,
	},
	'typography.weight': {
		checker: 'ai.typography',
		criteria: [
			p('한 문장 안에 서로 다른 굵기가 혼용되어 있는가?', 'absent'),
			p('한 문장 안에 서로 다른 글자 크기가 혼용되어 있는가?', 'absent'),
		],
		heuristicPrompt: null,
	},
	// ── ai.imagery ──
	'imagery-misuse': { checker: 'ai.imagery' },
	'photography-ingredient-textures': {
		checker: 'ai.imagery',
		heuristicPrompt:
			'재료·질감·제형 사진이 아닌 산출물은 모든 기준을 not_applicable로 관측한다.',
	},
	'imagery.ai.consistency': {
		checker: 'ai.imagery',
		criteria: [
			p('피부 표현이 자연스럽고 현실적인가?', 'present'),
			p('이미지의 톤·대비·연출이 일관적인가?', 'present'),
		],
		heuristicPrompt:
			'인물·피부가 등장하지 않는 AI 생성물은 첫 기준을 not_applicable로 관측한다.',
	},
	'imagery.sns.classification': {
		checker: 'ai.imagery',
		criteria: [
			p(
				'브랜드 자산 이미지(모델·브랜드 어플리케이션·자연 재료 이미지 등)가 콘텐츠에 활용되었는가?',
				'present',
			),
		],
		heuristicPrompt: null,
	},
	'imagery.advertisement.classification': {
		checker: 'ai.imagery',
		criteria: [
			p(
				'광고 내 사진(제품·모델)이 브랜드 톤앤매너(밝고 선명한 연출)에 부합하는가?',
				'present',
			),
		],
		heuristicPrompt: null,
	},
	'imagery.style': {
		checker: 'ai.imagery',
		criteria: [
			p(
				'비주얼이 상단 정렬 용법 기반의 Type A(메시지 중심) 또는 Type B(콘텐츠 중심) 체계 중 하나로 일관되게 전개되는가?',
				'present',
			),
		],
		heuristicPrompt: null,
	},
	'illustration.style': {
		checker: 'ai.imagery',
		criteria: [
			p('일러스트가 둥근 윤곽 처리와 단순화된 표현 수위를 따르는가?', 'present'),
			p('일러스트에 과도한 디테일·사실적 묘사가 있는가?', 'absent'),
		],
		heuristicPrompt: '일러스트레이션이 없는 산출물은 모든 기준을 not_applicable로 관측한다.',
	},
	'illustration.color.usage': {
		checker: 'ai.imagery',
		criteria: [p('일러스트에 브랜드 컬러 팔레트가 적용되어 있는가?', 'present')],
		heuristicPrompt: '일러스트레이션이 없는 산출물은 모든 기준을 not_applicable로 관측한다.',
	},
	// ── ai.layout ──
	'application.sns.format': {
		checker: 'ai.layout',
		criteria: [
			p(
				'캔버스 비율이 Feed(1080×1440, 3:4) 또는 Reels(1080×1920, 9:16) 규격에 부합하는가?',
				'present',
			),
		],
		heuristicPrompt: null,
	},
	'layout.sns.template': {
		checker: 'ai.layout',
		criteria: [
			p('캔버스가 Feed(3:4) 또는 Reels(9:16) 규격 비율인가?', 'present'),
			p('제품 이미지가 콘텐츠의 중심 요소로 배치되어 있는가?', 'present'),
		],
		heuristicPrompt: null,
	},
	'layout.sns.zones': {
		checker: 'ai.layout',
		criteria: [
			p('인물 이미지가 전면에 배치되어 있는가?', 'present'),
			p('텍스트가 상단에 고정 배치되어 있는가?', 'present'),
		],
		heuristicPrompt: null,
	},
	'application.sns.caption.legibility': {
		checker: 'ai.layout',
		criteria: [p('배경 위 텍스트가 충분한 대비로 명확히 판독되는가?', 'present')],
		heuristicPrompt: null,
	},
	'layout.advertisement.zones': {
		checker: 'ai.layout',
		criteria: [
			p('캔버스가 가로형 광고 판형(2400×1600 또는 8600×2100) 비율에 부합하는가?', 'present'),
			p('로고가 규정 로고 영역(Logo Area)에 배치되어 있는가?', 'present'),
		],
		heuristicPrompt: null,
	},
	'layout.visual.template': {
		checker: 'ai.layout',
		criteria: [
			p('캔버스가 규정 판형(1:1 / 3:4 / A4 / 3:1 / 16:9) 중 하나의 비율인가?', 'present'),
			p('로고·타이포그래피가 비주얼의 중심 요소로 상단 정렬 전개되는가?', 'present'),
		],
		heuristicPrompt: null,
	},
	'application.web': {
		checker: 'ai.layout',
		criteria: [p('캔버스가 웹 규격(16:9 또는 3:1) 비율인가?', 'present')],
		heuristicPrompt: null,
	},
	'grid.visual.system': {
		checker: 'ai.layout',
		criteria: [
			p('그래픽·포토그래피 등 비주얼 콘텐츠가 중심 요소로 전개되는가?', 'present'),
			p('상단 정렬 기반의 정돈된 정보 위계가 유지되는가?', 'present'),
		],
		heuristicPrompt: null,
	},
	'application.stationery.format': {
		checker: 'ai.layout',
		criteria: [
			p(
				'캔버스가 스테이셔너리 규격(명함 90×50 / 리플렛 A4 210×297 / 정보 카드 A5 148×210) 중 하나의 비율(방향 무관)에 부합하는가?',
				'present',
			),
		],
		heuristicPrompt: null,
	},
	'application.print.spec': {
		checker: 'ai.layout',
		criteria: [
			p(
				'명함의 색 구성이 레드 계열 별색 1도(Pantone Warm Red C)로 표현 가능한 단색 구성인가?',
				'present',
			),
		],
		heuristicPrompt: null,
	},
	'messaging.stationery.content.fields': {
		checker: 'ai.layout',
		criteria: [p('제품의 정보·특징·효능 등 필수 전달 요소가 포함되어 있는가?', 'present')],
		heuristicPrompt: null,
	},
	'application.package.format': {
		checker: 'ai.layout',
		criteria: [
			p('패키지에 Primary 또는 Secondary Logo Type이 적용되어 있는가?', 'present'),
			p('브랜드 컬러·지정 서체가 절제된 톤앤매너로 적용되어 있는가?', 'present'),
		],
		heuristicPrompt: null,
	},
	'messaging.package.content.fields': {
		checker: 'ai.layout',
		criteria: [p('제품명·제품 설명 등 패키지 필수 기재 요소가 포함되어 있는가?', 'present')],
		heuristicPrompt: null,
	},
	'messaging.signature.combination': {
		checker: 'ai.layout',
		criteria: [
			{
				kind: 'measure',
				question: '화면에 사용된 브랜드 시그니처 문구의 개수는?',
				operator: 'lte',
				expectedValue: 1,
				unit: '개',
			},
		],
		heuristicPrompt:
			'문서에 수록된 브랜드 시그니처 3종 문구만 센다. 하나도 없으면 0으로 관측한다.',
	},
	// ── advisory ──
	'messaging.sns.copy': { checker: 'advisory.copy', criteria: [], heuristicPrompt: null },
	'messaging.advertisement.copy': {
		checker: 'advisory.copy',
		criteria: [],
		heuristicPrompt: null,
	},
	'messaging.advertisement.boilerplate': {
		checker: 'advisory.copy',
		criteria: [],
		heuristicPrompt: null,
	},
	'messaging.advertisement.tagline': {
		checker: 'advisory.copy',
		criteria: [],
		heuristicPrompt: null,
	},
	'messaging.narrative.statement': {
		checker: 'advisory.copy',
		criteria: [],
		heuristicPrompt: null,
	},
	'color.usage': { checker: 'advisory.design', criteria: [], heuristicPrompt: null },
	'spacing.advertisement.scale': {
		checker: 'advisory.design',
		criteria: [],
		heuristicPrompt: null,
	},
}

const NEW_CHECK = {
	docSlug: 'secondary-logo',
	title: 'Secondary Logo Usage',
	titleKo: '세로형 로고 규정',
	key: 'logo.secondary.usage',
	tier: 'required',
	checker: 'ai.logo',
	criteria: [
		p('세로형 로고의 비례·간격이 원형 그대로 사용되었는가?', 'present'),
		p('세로형 로고 주변에 세로획 너비의 약 3배 이상 여백이 확보되어 있는가?', 'present'),
		p('세로형 로고가 판독이 어려울 정도로 작게 표시되어 있는가?', 'absent'),
	] as CriterionSpec[],
	heuristicPrompt:
		'세로형(Vertical Type) 로고가 없는 산출물은 모든 기준을 not_applicable로 관측한다.',
}

const toCriteriaRows = (specs: CriterionSpec[]) =>
	specs.map((spec) =>
		spec.kind === 'measure'
			? {
					kind: 'measure',
					question: spec.question,
					operator: spec.operator,
					expectedValue: spec.expectedValue,
					max: spec.max ?? null,
					unit: spec.unit ?? null,
					expected: null,
				}
			: { kind: 'presence', question: spec.question, expected: spec.expected },
	)

const payload = await getPayload({ config })
const stats = { updatedDocs: 0, relinked: 0, deleted: 0, unknown: [] as string[] }

// 1. 체커 7종 upsert
const checkerIds: Record<string, number> = {}
for (const checker of CHECKERS) {
	const existing = await payload.find({
		collection: 'rule-checkers',
		where: { key: { equals: checker.key } },
		limit: 1,
	})
	const data = {
		key: checker.key,
		name: checker.name,
		executor: checker.executor,
		model: 'claude-sonnet-5' as const,
		prompt: checker.prompt,
	}
	const doc = existing.docs[0]
		? await payload.update({
				collection: 'rule-checkers',
				id: existing.docs[0].id,
				data,
				draft: false,
			})
		: await payload.create({ collection: 'rule-checkers', data, draft: false })
	checkerIds[checker.key] = doc.id
	console.log(`checker upsert: ${checker.key} (#${doc.id})`)
}

// 2. 전 문서의 checks 재작성
type CheckRow = Record<string, unknown> & { key?: string | null }
function transformChecks(rows: CheckRow[] | null | undefined): {
	rows: CheckRow[] | null | undefined
	changed: boolean
} {
	if (!Array.isArray(rows) || rows.length === 0) return { rows, changed: false }
	let changed = false
	const next: CheckRow[] = []
	for (const row of rows) {
		const key = row.key ?? ''
		if (DELETE_KEYS.has(key)) {
			stats.deleted++
			changed = true
			continue
		}
		const spec = RULES[key]
		if (!spec) {
			stats.unknown.push(key)
			next.push(row)
			continue
		}
		const updated: CheckRow = { ...row, checker: checkerIds[spec.checker] }
		if (spec.criteria !== undefined) updated.criteria = toCriteriaRows(spec.criteria)
		if (spec.heuristicPrompt !== undefined) updated.heuristicPrompt = spec.heuristicPrompt
		stats.relinked++
		changed = true
		next.push(updated)
	}
	return { rows: next, changed }
}

const docs = await payload.find({
	collection: 'guideline-documents',
	depth: 0,
	pagination: false,
	draft: false,
	locale: 'ko',
})

for (const doc of docs.docs) {
	let changed = false
	const data: Record<string, unknown> = {}

	const topChecks = transformChecks(doc.checks as CheckRow[])
	if (topChecks.changed) {
		data.checks = topChecks.rows
		changed = true
	}

	if (Array.isArray(doc.blocks)) {
		let blocksChanged = false
		const blocks = doc.blocks.map((block) => {
			const blockChecks = transformChecks((block as { checks?: CheckRow[] }).checks)
			if (!blockChecks.changed) return block
			blocksChanged = true
			return { ...block, checks: blockChecks.rows }
		})
		if (blocksChanged) {
			data.blocks = blocks
			changed = true
		}
	}

	if ((doc as { slug?: string }).slug === NEW_CHECK.docSlug) {
		const rows = (data.checks as CheckRow[]) ?? (doc.checks as CheckRow[]) ?? []
		if (!rows.some((row) => row.key === NEW_CHECK.key)) {
			data.checks = [
				...rows,
				{
					title: NEW_CHECK.title,
					titleKo: NEW_CHECK.titleKo,
					key: NEW_CHECK.key,
					tier: NEW_CHECK.tier,
					checker: checkerIds[NEW_CHECK.checker],
					criteria: toCriteriaRows(NEW_CHECK.criteria),
					heuristicPrompt: NEW_CHECK.heuristicPrompt,
				},
			]
			changed = true
			console.log(`new check appended: ${NEW_CHECK.key} → ${NEW_CHECK.docSlug}`)
		}
	}

	if (!changed) continue
	await payload.update({
		collection: 'guideline-documents',
		id: doc.id,
		data,
		depth: 0,
		draft: false,
		locale: 'ko',
	})
	stats.updatedDocs++
	console.log(`doc updated: ${(doc as { slug?: string }).slug ?? doc.id}`)
}

// 3. 구 체커 삭제 (모든 재연결 후)
for (const key of OLD_CHECKER_KEYS) {
	const found = await payload.find({
		collection: 'rule-checkers',
		where: { key: { equals: key } },
		limit: 1,
	})
	if (found.docs[0]) {
		await payload.delete({ collection: 'rule-checkers', id: found.docs[0].id })
		console.log(`old checker deleted: ${key}`)
	}
}

console.log('\n=== summary ===')
console.log(`docs updated: ${stats.updatedDocs}`)
console.log(`checks relinked: ${stats.relinked}`)
console.log(`checks deleted: ${stats.deleted}`)
console.log(`unknown keys (untouched): ${stats.unknown.length ? stats.unknown.join(', ') : '없음'}`)
process.exit(0)
