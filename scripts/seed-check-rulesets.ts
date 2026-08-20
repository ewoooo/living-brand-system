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
} & (
	| {
			executor: 'heuristic' | 'manual'
			model: 'claude-opus-4-8' | 'claude-sonnet-5' | 'claude-haiku-4-5'
			prompt: string
	  }
	/** 픽셀을 직접 재는 checker — registry의 checkerKey를 가리키고 모델을 쓰지 않는다. */
	| { executor: 'deterministic'; checkerKey: string }
)

type RuleSeed = {
	key: string
	title: string
	titleKo: string
	tier: 'required' | 'recommended'
	checker: string
	/** 이 Rule을 참조할 published 가이드라인 문서의 slug. 여기서 문서 설명이 evidence로 실린다. */
	documentSlug: string
	/** heuristic 룰만 가진다. deterministic 룰은 options가 기준을 소유한다. */
	criteria?: Criterion[]
	heuristicPrompt?: string
	/** deterministic 룰의 측정·기준. checker registry의 options 스키마를 따른다. */
	options?: Record<string, unknown>
	/** heuristic이 아닌 룰의 상태별 표시 문구. 없으면 화면에 판정만 뜨고 근거가 비어 보인다. */
	messages?: { pass?: string; needsReview?: string; fail?: string }
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
	{
		key: 'raster-overlay-legibility',
		name: '오버레이 대비 측정 (픽셀)',
		executor: 'deterministic',
		checkerKey: 'overlay-legibility',
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
		// 🔴 AI가 대비비를 눈대중하던 잠정 구현을 픽셀 측정으로 교체했다. 임계값을 정하려면 참값이 필요하고,
		//    AI 추정으로는 「임계값이 틀렸나 추정이 틀렸나」를 가릴 수 없다. key는 유지한다(시나리오·이력 연속).
		key: 'logo-background-color',
		title: 'CI and Text Legibility',
		titleKo: 'CI·텍스트 가독성',
		tier: 'required',
		checker: 'raster-overlay-legibility',
		documentSlug: 'color-background',
		options: {
			// 🔴 임계값 1.5는 WCAG 대비비와 같은 축이 아니다. 측정값은 오버레이 경계마다 잰 국소
			//    대비의 하위 5%이고, WCAG 3:1은 전경·배경 한 쌍의 비율이다. 통계가 달라 비교할 수 없다.
			//    그래서 표준값을 빌리지 않고 사람이 판정한 이미지 5장으로 잡았다(2026-08-20 실측):
			//      통과   7.50 · 1.87 · 1.64
			//      불통과              1.34 · 1.34
			//    1.5는 그 사이 중간값이다. 레이블이 늘면 다시 잡을 것.
			criteria: [{ measurement: 'p05ContrastRatio', operator: 'gte', expected: 1.5 }],
			parameters: { overlayColors: ['#FFFFFF', '#000000'] },
		},
		messages: {
			pass: '로고와 글자가 배경과 충분히 분리됩니다.',
			fail: '로고나 글자가 배경에 묻히는 구간이 있습니다. 그 구간의 배경을 어둡게 하거나 글자 아래에 면을 깔아 주세요.',
			needsReview:
				'로고와 글자를 찾지 못해 대비를 재지 못했습니다. 배경과 같은 색의 넓은 면이 있는지 확인해 주세요.',
		},
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
				question: '단색 로고에 그라디언트나 두 가지 이상의 색이 적용되어 있는가?',
				kind: 'presence',
				expected: 'absent',
			},
		],
		heuristicPrompt:
			'단색형(모노) 로고는 흰색 하나 또는 검정 하나로만 채운다. 그라디언트·다색 채움은 불가하다.\n' +
			'가시성은 이 룰이 보지 않는다 — 로고 가시성 룰이 소유한다.\n' +
			'이미지의 로고가 단색형이 아니거나 로고가 없으면 not_applicable로 답한다.',
	},
	{
		key: 'color-misuse',
		title: 'Color Misuse',
		titleKo: '컬러 사용 금지',
		tier: 'required',
		checker: 'ai-observer',
		documentSlug: 'color-incorrect-usage',
		criteria: [
			// 🔴 「제외」가 아니라 「대상 지정」이다. 부정 제외("사진은 제외")를 쓰면 관찰자가 무엇이 제외인지를
			//    판단해야 해서 uncertain으로 떨어진다. 사진은 단색 색면이 아니므로 목록에서 자동으로 빠진다.
			//    🔴 그라디언트 기준은 삭제했다 — 「임의로 적용했나」는 저작 이력에 대한 질문이고 검수 입력은
			//    래스터뿐이라(target_type: uploaded-image) 원리적으로 답할 수 없다. 로고에 적용된 경우는
			//    mono-logo-usage가 이미 본다. 되살리려면 합성 HTML/CSS를 보는 검사기여야 한다.
			{
				question: '로고·타이포·단색 색면에 브랜드 팔레트에 없는 색이 쓰였는가?',
				kind: 'presence',
				expected: 'absent',
			},
		],
		heuristicPrompt:
			'HD현대 브랜드 컬러는 그린 계열 4종(#73D75A #00AF41 #007332 #00280A), 블루 계열 3종(#003087 #000A32 #DCF0F5), 라이트 그린 #DCF5D2, 그리고 무채색(흰·검·그레이 단계)이다.\n' +
			'사진·일러스트 등 회화적 이미지는 이 질문의 대상이 아니다. 로고, 글자, 균일하게 칠한 색면만 본다.\n' +
			'그 세 대상이 이미지에 없으면 not_applicable로 답한다.',
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

		const checkerSeed = CHECKERS.find((entry) => entry.key === rule.checker)
		if (!checkerSeed) throw new Error(`CheckerSeed를 찾지 못했습니다: ${rule.checker}`)

		const existing = await findOne('rules', rule.key)
		const data = {
			key: rule.key,
			title: rule.title,
			titleKo: rule.titleKo,
			tier: rule.tier,
			// hook이 checker에서 다시 채우지만, options 검증이 이 값을 읽으므로 맞는 값을 넣는다.
			executor: checkerSeed.executor,
			checker: checkerId,
			// 실행 방식이 안 쓰는 필드는 비운다 — 남겨 두면 뭐가 기준인지 두 곳에 보인다.
			criteria: rule.criteria ?? [],
			heuristicPrompt: rule.heuristicPrompt ?? null,
			options: rule.options ?? null,
			// messages는 null을 받지 않는다 — 없으면 키 자체를 빼야 한다.
			...(rule.messages ? { messages: rule.messages } : {}),
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
