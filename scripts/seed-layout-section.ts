import config from '@payload-config'
import { getPayload } from 'payload'
import type { GuidelineDocument } from '@/payload-types'

/**
 * Layout 섹션 시드 — Key Layout 그리드(축별 1:2:3) 예시 3종 + 컨트롤 패널 하나.
 *
 * 블록은 레이아웃만 소유한다: 전체폭 + 검정 배경 + 3열 grid.
 * 자식 순서 = 판형 3개(sample a/b/c) → 컨트롤 패널 1개. 3열이라 패널이 다음 행으로 내려가
 * "제목 → 설명 → 판형 → 슬라이더" 순으로 읽힌다. 샘플 디자인 자체는 위젯 코드에 있다.
 * 재실행 안전(slug로 찾아 blocks만 교체).
 *
 * 실행: pnpm payload run scripts/seed-layout-section.ts
 */
type Block = NonNullable<GuidelineDocument['blocks']>[number]
// biome-ignore lint/suspicious/noExplicitAny: 시드에서 richText 트리를 느슨하게 다룬다.
type AnyBlock = any

const PAGE_SLUG = 'layout'
const BLACK_HEX = '#000000'

const TITLE = 'Key Layout 그리드'
const DESCRIPTION =
	'판형을 축별로 1:2:3으로 나눈 9개 셀에 요소를 스냅한다. 마진은 긴 축의 3~6%(수직·수평 동일), 거터는 마진의 0~100%다. 값을 조절해도 1:2:3 분할선은 제자리에 있다.'

// 단문 → lexical richText(description 필드용).
const rt = (text: string): AnyBlock => ({
	root: {
		type: 'root',
		format: '',
		indent: 0,
		version: 1,
		direction: 'ltr',
		children: [
			{
				type: 'paragraph',
				format: '',
				indent: 0,
				version: 1,
				direction: 'ltr',
				children: [
					{
						type: 'text',
						text,
						format: 0,
						style: '',
						mode: 'normal',
						detail: 0,
						version: 1,
					},
				],
			},
		],
	},
})

const payload = await getPayload({ config })

// 배경색은 brand-colors 참조 — 환경마다 id가 달라 hex로 찾는다.
const { docs: blacks } = await payload.find({
	collection: 'brand-colors',
	where: { hex: { equals: BLACK_HEX } },
	limit: 1,
	depth: 0,
	overrideAccess: true,
})
const black = blacks[0]
if (!black) throw new Error(`brand-colors에 ${BLACK_HEX}가 없다 — 색을 먼저 시드할 것`)

const { docs } = await payload.find({
	collection: 'guideline-documents',
	where: { slug: { equals: PAGE_SLUG } },
	locale: 'ko',
	draft: false,
	overrideAccess: true,
	depth: 0,
	limit: 1,
})
const page = docs[0]
if (!page) throw new Error(`'${PAGE_SLUG}' 페이지가 없다 — 가이드라인 문서를 먼저 시드할 것`)

const blocks = [
	{
		blockType: 'block',
		title: TITLE,
		description: rt(DESCRIPTION),
		width: 'full',
		background: black.id,
		arrangement: 'grid',
		columns: 3,
		children: [
			...(['a', 'b', 'c'] as const).map((sample) => ({
				blockType: 'layoutGridWidget',
				sample,
			})),
			// 판형 3개 다음 행 = 슬라이더 하나. 세 판형을 모듈 스토어로 함께 통제한다.
			{ blockType: 'layoutGridControlsWidget' },
		],
	},
] as Block[]

await payload.update({
	collection: 'guideline-documents',
	id: page.id,
	locale: 'ko',
	draft: false,
	overrideAccess: true,
	data: { _status: 'published', blocks },
})

console.log(
	`시드 완료: ${PAGE_SLUG}(${page.id}) — 전체폭 검정 배경 3열 블록 1개, layoutGridWidget 3개(a/b/c) + 컨트롤 패널 1개`,
)
