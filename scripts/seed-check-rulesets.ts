import config from '@payload-config'
import { getPayload } from 'payload'
import { DEFAULT_LOCALE as LOCALE } from '@/lib/locale'

/**
 * 검수 설정 정본을 시드한다 — RuleChecker → Rule → 가이드라인 문서 연결 → CheckScenario 순.
 *
 * 네 층이 모두 있어야 검수 1건이 실행된다.
 *   RuleChecker  실행 도구(모델·프롬프트)
 *   Rule         판정 기준(criteria·heuristicPrompt)
 *   문서 연결     published 가이드라인 문서가 Rule을 참조해야 런타임 룰셋에 들어온다
 *                (check-ruleset.payload.repository가 published 문서에서만 수집한다)
 *   CheckScenario 그중 무엇을 실행할지 고른다
 *
 * - 재실행 안전: key로 찾아 없으면 생성, 있으면 목표 상태로 수렴시킨다(skip이 아니라 update).
 * - 🔴 update에 _status를 명시한다. drafts가 켜진 컬렉션이라 생략하면 게시분이 초안으로 내려간다.
 *   가이드라인 문서는 autosave까지 켜져 있어 특히 위험하다.
 * - 문서의 기존 rules는 합집합으로 보존한다. 이 시드가 소유하지 않은 연결을 지우지 않는다.
 *
 * 실행: pnpm payload run scripts/seed-check-rulesets.ts
 * 대상 DB는 DATABASE_URL이 정한다. 공유 DB에 넣으려면 그 URL을 명시적으로 앞에 붙일 것.
 */

type Criterion =
	| { question: string; kind: 'presence'; expected: 'present' | 'absent' }
	| {
			question: string
			kind: 'measure'
			operator: 'gte' | 'lte' | 'between'
			expectedValue: number
			max?: number
			unit?: string
	  }

type CheckerSeed = {
	key: string
	name: string
	executor: 'heuristic' | 'manual'
	model: 'claude-opus-4-8' | 'claude-sonnet-5' | 'claude-haiku-4-5'
	prompt: string
}

type RuleSeed = {
	key: string
	title: string
	titleKo: string
	tier: 'required' | 'recommended'
	checker: string
	/** 이 Rule을 참조할 published 가이드라인 문서의 slug. 여기서 문서 설명이 evidence로 실린다. */
	documentSlug: string
	criteria: Criterion[]
	heuristicPrompt: string
}

type ScenarioSeed = {
	key: string
	title: string
	description: string
	checkKeys: string[]
	aliases: string[]
}

const CHECKERS: CheckerSeed[] = [
	{
		key: 'ai-observer',
		name: 'AI 관찰자 (Sonnet)',
		executor: 'heuristic',
		model: 'claude-sonnet-5',
		prompt: '브랜드 가이드라인 관찰자. 제공된 래스터 이미지에서 보이는 것만 기술한다. 합·부는 판정하지 않는다.',
	},
]

// 로고 검수 — CI·Color 문서 4곳에 나뉘어 붙는다. 문서마다 검수 화면 섹션이 갈린다.
const LOGO_RULES: RuleSeed[] = [
	{
		key: 'logo-misuse',
		title: 'Logo Misuse',
		titleKo: '로고 사용 금지',
		tier: 'required',
		checker: 'ai-observer',
		documentSlug: 'ci-incorrect-usage',
		criteria: [
			{
				question: '로고가 회전되거나 기울어져 있는가?',
				kind: 'presence',
				expected: 'absent',
			},
			{
				question: '로고에 그림자·외곽선·광택 등 별도 효과가 적용되어 있는가?',
				kind: 'presence',
				expected: 'absent',
			},
			{
				question: '로고의 가로세로 비율이 왜곡되어 있는가?',
				kind: 'presence',
				expected: 'absent',
			},
			{
				question: '로고가 규정 외 색상으로 변경되어 있는가?',
				kind: 'presence',
				expected: 'absent',
			},
		],
		heuristicPrompt:
			'HD현대 CI는 색상·형태·비례의 변형이 일절 불가하다. 로고는 규정된 형태 그대로, 수평 정렬로만 쓴다.\n' +
			'이미지에 로고가 보이지 않으면 모든 기준에 not_applicable로 답한다.\n' +
			'해상도가 낮아 변형 여부를 확정할 수 없으면 uncertain으로 답한다 — 추정으로 present/absent를 고르지 않는다.',
	},
	{
		key: 'logo-background-color',
		title: 'Logo Background Color',
		titleKo: '로고 배경 컬러',
		tier: 'required',
		checker: 'ai-observer',
		documentSlug: 'color-background',
		criteria: [
			{
				question:
					'로고가 단색 브랜드 컬러 배경(그린 계열 또는 블루 계열) 위에 놓여 있는가?',
				kind: 'presence',
				expected: 'present',
			},
			{
				question: '로고가 사진이나 패턴 위에 겹쳐져 형태 식별이 어려운가?',
				kind: 'presence',
				expected: 'absent',
			},
		],
		heuristicPrompt:
			'HD현대 로고는 브랜드 프라이머리(HD HERITAGE GREEN #00AF41, HD PROSPERITY GREEN #007332, HD DISCOVERY BLUE #003087, HD ECO GREEN #73D75A) 또는 세컨더리 컬러 배경 위 사용을 권장한다. 흰색·검정 배경도 규정 안이다.\n' +
			'배경이 브랜드 컬러 계열이 아닌 임의 색이면 첫 기준은 absent다.\n' +
			'이미지에 로고가 없으면 not_applicable로 답한다.',
	},
	{
		key: 'mono-logo-usage',
		title: 'Mono Logo Usage',
		titleKo: '모노 로고 사용',
		tier: 'required',
		checker: 'ai-observer',
		documentSlug: 'color-mono',
		criteria: [
			{
				question: '모노(무채색) 배경 위 로고가 배경과 명확히 분리되어 보이는가?',
				kind: 'presence',
				expected: 'present',
			},
			{
				question: '단색 로고에 그라디언트나 두 가지 이상의 색이 적용되어 있는가?',
				kind: 'presence',
				expected: 'absent',
			},
		],
		heuristicPrompt:
			'모노 컬러 팔레트(WHITE·LIGHT GREY·MIDDLE GREY·DARK GREY·BLACK, 명도 10~90%)를 배경으로 쓸 때 로고 가시성을 해치지 않아야 한다. 밝은 배경에는 검정 단색형, 어두운 배경에는 흰색 단색형을 쓴다.\n' +
			'배경이 무채색이 아니면 두 기준 모두 not_applicable로 답한다.',
	},
	{
		key: 'color-misuse',
		title: 'Color Misuse',
		titleKo: '컬러 사용 금지',
		tier: 'required',
		checker: 'ai-observer',
		documentSlug: 'color-incorrect-usage',
		criteria: [
			{
				question:
					'브랜드 팔레트에 없는 임의의 원색(형광색·고채도 색)이 넓은 면적에 쓰였는가?',
				kind: 'presence',
				expected: 'absent',
			},
			{
				question: '브랜드 컬러에 그라디언트나 투명도가 임의로 적용되었는가?',
				kind: 'presence',
				expected: 'absent',
			},
		],
		heuristicPrompt:
			'HD현대 브랜드 컬러는 그린 계열 4종(#73D75A #00AF41 #007332 #00280A), 블루 계열 3종(#003087 #000A32 #DCF0F5), 라이트 그린 #DCF5D2, 그리고 무채색(흰·검·그레이 단계)이다.\n' +
			'사진 안의 자연스러운 색은 판단 대상이 아니다. 그래픽 요소·배경·타이포에 쓰인 색만 본다.\n' +
			'색 판별이 어려우면 uncertain으로 답한다.',
	},
]

// 레이아웃 검수 — 정본 수치는 widgets/layout-grid/manifest.ts가 소유한다(마진 3~6%, 거터 = 마진의 0~100%).
// Layout Type 1/2/3 문서는 설명이 서로 같아 evidence로 구분되지 않으므로 Grid System Overview 한 곳에 붙인다.
const LAYOUT_RULES: RuleSeed[] = [
	{
		key: 'layout-margin-ratio',
		title: 'Layout Margin Ratio',
		titleKo: '레이아웃 마진 비율',
		tier: 'required',
		checker: 'ai-observer',
		documentSlug: 'layout-three',
		criteria: [
			{
				question: '판형 긴 축 길이 대비 바깥 여백(마진)의 비율은 몇 %인가?',
				kind: 'measure',
				operator: 'between',
				expectedValue: 3,
				max: 6,
				unit: '%',
			},
		],
		heuristicPrompt:
			'HD현대 키 레이아웃의 마진은 판형 긴 축 길이의 3~6%이며 기본값은 4.5%다. 수직·수평 마진은 항상 같은 길이를 쓴다.\n' +
			'콘텐츠(텍스트·로고·그래픽)가 시작되는 선과 대지 가장자리 사이 거리를 재고, 긴 축 길이로 나눈 백분율을 숫자로만 답한다.\n' +
			'의도적으로 대지 끝까지 뻗은(bleed) 이미지는 마진 측정 대상에서 제외한다. 네 변의 여백이 다르면 가장 좁은 값을 답한다.',
	},
	{
		key: 'layout-grid-alignment',
		title: 'Layout Grid Alignment',
		titleKo: '그리드 정렬',
		tier: 'required',
		checker: 'ai-observer',
		documentSlug: 'layout-three',
		criteria: [
			{
				question: '주요 요소들이 공통의 3×3 그리드 선에 정렬되어 있는가?',
				kind: 'presence',
				expected: 'present',
			},
			{
				question: '그리드를 무시하고 임의 위치에 놓인 요소가 있는가?',
				kind: 'presence',
				expected: 'absent',
			},
		],
		heuristicPrompt:
			'HD현대 키 레이아웃의 콘텐츠 영역은 3×3(가로 3열·세로 3행) 셀로 나뉜다. 요소는 셀 하나 또는 여러 셀에 걸쳐 놓이며 셀 경계선에 맞춰 정렬된다.\n' +
			'요소의 좌·우·상·하 모서리가 서로 같은 선을 공유하는지를 본다. 셀 안에서의 중앙·우측 정렬은 규정 안이다.',
	},
	{
		key: 'layout-gutter-consistency',
		title: 'Layout Gutter Consistency',
		titleKo: '거터 일관성',
		tier: 'recommended',
		checker: 'ai-observer',
		documentSlug: 'layout-three',
		criteria: [
			{
				question: '요소 사이의 간격(거터)이 일정하게 유지되는가?',
				kind: 'presence',
				expected: 'present',
			},
			{
				question: '요소 사이 간격이 바깥 여백(마진)보다 넓은가?',
				kind: 'presence',
				expected: 'absent',
			},
		],
		heuristicPrompt:
			'거터는 마진 길이의 0~100%이며 기본값은 75%다. 즉 거터는 마진보다 넓을 수 없다.\n' +
			'수평 거터와 수직 거터는 서로 다를 수 있다 — 같은 방향끼리 일정한지를 본다.\n' +
			'요소가 하나뿐이라 요소 사이 간격이 없으면 not_applicable로 답한다.',
	},
	{
		key: 'layout-bleed-discipline',
		title: 'Layout Bleed Discipline',
		titleKo: '블리드 운용',
		tier: 'recommended',
		checker: 'ai-observer',
		documentSlug: 'layout-three',
		criteria: [
			{
				question: '텍스트나 로고가 마진 영역을 침범하고 있는가?',
				kind: 'presence',
				expected: 'absent',
			},
			{
				question: '대지 끝까지 확장된 이미지가 있다면 그 변에서만 여백이 0인가?',
				kind: 'presence',
				expected: 'present',
			},
		],
		heuristicPrompt:
			'블리드(대지 끝까지 뻗는 배치)는 이미지에만 허용되고, 지정한 변에서만 여백이 0이 된다. 나머지 변은 셀 경계와 거터를 그대로 지킨다.\n' +
			'텍스트·로고·CI는 어떤 경우에도 마진 안쪽에 머문다.\n' +
			'대지 끝까지 뻗은 이미지가 없으면 두 번째 기준은 not_applicable로 답한다.',
	},
]

const RULES = [...LOGO_RULES, ...LAYOUT_RULES]

const SCENARIOS: ScenarioSeed[] = [
	{
		key: 'logo-usage',
		title: '로고 사용 검수',
		description:
			'CI 사용 금지 규정과 배경 컬러·모노 컬러 규정을 기준으로 로고 사용을 검수합니다.',
		checkKeys: LOGO_RULES.map((rule) => rule.key),
		aliases: ['로고', 'logo', 'ci'],
	},
	{
		key: 'layout-review',
		title: '레이아웃 검수',
		description:
			'HD현대 키 레이아웃의 마진·그리드·거터·블리드 규정을 기준으로 판형 구성을 검수합니다.',
		checkKeys: LAYOUT_RULES.map((rule) => rule.key),
		aliases: ['레이아웃', 'layout', '판형'],
	},
]

async function main() {
	const payload = await getPayload({ config })

	const findOne = async (
		collection: 'rule-checkers' | 'rules' | 'check-scenarios',
		key: string,
	) => {
		const { docs } = await payload.find({
			collection,
			depth: 0,
			limit: 1,
			pagination: false,
			where: { key: { equals: key } },
		})
		return docs[0]
	}

	const checkerIds = new Map<string, number>()
	for (const checker of CHECKERS) {
		const existing = await findOne('rule-checkers', checker.key)
		const data = { ...checker, _status: 'published' as const }
		if (existing) {
			await payload.update({ collection: 'rule-checkers', id: existing.id, data })
			checkerIds.set(checker.key, existing.id)
		} else {
			const created = await payload.create({ collection: 'rule-checkers', data })
			checkerIds.set(checker.key, created.id)
		}
		console.log(`${existing ? 'update' : 'create'} rule-checker ${checker.key}`)
	}

	const ruleIdsByDocumentSlug = new Map<string, number[]>()
	for (const rule of RULES) {
		const checkerId = checkerIds.get(rule.checker)
		if (!checkerId) throw new Error(`RuleChecker를 찾지 못했습니다: ${rule.checker}`)

		const existing = await findOne('rules', rule.key)
		const data = {
			key: rule.key,
			title: rule.title,
			titleKo: rule.titleKo,
			tier: rule.tier,
			// executor는 checker에서 hook이 다시 채운다. 타입상 required라 여기서도 채워 둔다.
			executor: 'heuristic' as const,
			checker: checkerId,
			criteria: rule.criteria,
			heuristicPrompt: rule.heuristicPrompt,
			_status: 'published' as const,
		}
		let ruleId: number
		if (existing) {
			await payload.update({ collection: 'rules', id: existing.id, data })
			ruleId = existing.id
		} else {
			ruleId = (await payload.create({ collection: 'rules', data })).id
		}

		const siblings = ruleIdsByDocumentSlug.get(rule.documentSlug) ?? []
		siblings.push(ruleId)
		ruleIdsByDocumentSlug.set(rule.documentSlug, siblings)
		console.log(`${existing ? 'update' : 'create'} rule ${rule.key}`)
	}

	for (const [slug, ruleIds] of ruleIdsByDocumentSlug) {
		const { docs } = await payload.find({
			collection: 'guideline-documents',
			depth: 0,
			limit: 1,
			locale: LOCALE,
			pagination: false,
			where: { slug: { equals: slug }, _status: { equals: 'published' } },
		})
		const document = docs[0]
		if (!document) throw new Error(`published 가이드라인 문서를 찾지 못했습니다: ${slug}`)

		// 기존 연결은 합집합으로 보존한다 — 이 시드가 소유하지 않은 Rule을 떼어내지 않는다.
		const current = (document.rules ?? []).map((rule) =>
			typeof rule === 'object' ? rule.id : rule,
		)
		const merged = [...new Set([...current, ...ruleIds])]
		if (merged.length === current.length) {
			console.log(`skip guideline-doc ${slug} (연결 변화 없음)`)
			continue
		}

		await payload.update({
			collection: 'guideline-documents',
			id: document.id,
			locale: LOCALE,
			// 🔴 autosave 초안 위에 얹히면 게시 문서가 초안으로 내려간다.
			data: { rules: merged, _status: 'published' },
		})
		console.log(`update guideline-doc ${slug} rules ${current.length} → ${merged.length}`)
	}

	for (const scenario of SCENARIOS) {
		const existing = await findOne('check-scenarios', scenario.key)
		const data = {
			key: scenario.key,
			title: scenario.title,
			description: scenario.description,
			checkKeys: scenario.checkKeys,
			aliases: scenario.aliases,
			archived: false,
			// hook(markPublished)이 발행 시 true로 올린다. 타입상 required라 여기서도 채워 둔다.
			hasBeenPublished: false,
			_status: 'published' as const,
		}
		if (existing) {
			await payload.update({
				collection: 'check-scenarios',
				id: existing.id,
				locale: LOCALE,
				data,
			})
		} else {
			await payload.create({ collection: 'check-scenarios', locale: LOCALE, data })
		}
		console.log(`${existing ? 'update' : 'create'} check-scenario ${scenario.key}`)
	}

	console.log('done')
	process.exit(0)
}

await main()
