import type { Block } from 'payload'
import { GUIDELINE_LEAVES } from '@/features/guideline/leaves/registry'
import { StaticDisplay } from './static/schema'

/**
 * 디스플레이 레지스트리 — 카드 판에 무엇을 그릴 수 있는지는 **여기 항목 하나**로 정의된다(2026-09-07).
 * 정적 디스플레이(배경 이미지) 하나와 다이나믹 디스플레이(위젯)들이다.
 *
 * 🔴 이 모듈은 payload.config가 Node에서 읽는다(`cards/schema.ts` 경유) — React를 넣지 말 것. 렌더는
 *    `registry.render.tsx`가 같은 id로 갈라 그린다.
 * 🔴 `description`은 Payload 블록 선택기에 슬롯이 없어 화면에 나오지 않는다. 사람이 읽는 정의서다.
 *
 * 위젯은 **전부** 연다(사용자 결정 2026-09-07 "B") — 기존 문서의 leaf 128개를 카드로 옮기기 위해서다. 그 결과
 * 감수하는 것 둘: 컨트롤러 위젯(ci-lockup·clearspace-viewer·layout-grid)은 하단 Floating Controller를 잃고
 * admin 고정값으로만 그려지며, 콘텐츠 높이형(icon-grid·hd-color-palette·type-hierarchy·logo-on-background)은
 * 규격 비율 판 안에서 스크롤된다. 컨트롤 전용 layout-grid-controls는 그릴 것이 없어 뺐다(이관 시 행 삭제).
 *
 * ponytail: 위젯 스키마는 leaf 레지스트리의 Block 객체를 **그대로** 쓴다(`span` 필드가 딸려 온다). 같은 slug가
 *   두 자리에서 다른 필드로 정의되면 스키마·타입이 갈리기 때문이다. 위젯 폴더가 `displays/`로 이관되면
 *   leaf 레지스트리와 함께 사라진다.
 */
export interface DisplayEntry {
	id: string
	name: string
	description: string
	schema: Block
}

function leaf(slug: string): Block {
	const block = GUIDELINE_LEAVES.find((candidate) => candidate.slug === slug)
	if (!block) throw new Error(`leaf 레지스트리에 없는 위젯: ${slug}`)
	return block
}

export const DISPLAYS = [
	{
		id: 'staticDisplay',
		name: '정적 디스플레이(이미지)',
		description: '업로드 이미지가 판을 배경으로 덮는다. 판 비율에 맞춰 잘린다.',
		schema: StaticDisplay,
	},
	{
		id: 'ciLockupHeroWidget',
		name: 'CI 락업 히어로',
		description: '자회사명·해외지사명이 도는 CI 락업. 판 높이가 심볼 크기를 정한다.',
		schema: leaf('ciLockupHeroWidget'),
	},
	{
		id: 'clearspaceOverlayWidget',
		name: '클리어스페이스 오버레이',
		description: '로고 위에 여백 격자를 겹쳐 보인다.',
		schema: leaf('clearspaceOverlayWidget'),
	},
	{
		id: 'logoBgPickerWidget',
		name: '배경색 선택',
		description: '배경색을 바꿔 가며 로고 표현을 확인한다.',
		schema: leaf('logoBgPickerWidget'),
	},
	{
		id: 'logoDisplayWidget',
		name: '로고 크게 보기',
		description: '로고 파일 하나를 판 가운데에 크게 놓는다.',
		schema: leaf('logoDisplayWidget'),
	},
	{
		id: 'typeScrambleWidget',
		name: '서체 스크램블',
		description: '글자가 흩어졌다 모이는 서체 표본.',
		schema: leaf('typeScrambleWidget'),
	},
	{
		id: 'typeWeightWidget',
		name: '서체 굵기',
		description: '슬라이더로 굵기를 바꿔 보는 서체 표본.',
		schema: leaf('typeWeightWidget'),
	},
	{
		id: 'typeSpecimenWidget',
		name: '타입 스페시멘',
		description: '크기·굵기를 바꿔 보는 서체 표본 판.',
		schema: leaf('typeSpecimenWidget'),
	},
	{
		id: 'layoutGridOverlayWidget',
		name: '레이아웃 그리드 오버레이',
		description: '리플릿 표본 위에 여백·열 격자를 겹친다.',
		schema: leaf('layoutGridOverlayWidget'),
	},
	{
		id: 'ciLockupWidget',
		name: 'CI 락업',
		description:
			'꼴·언어·표현을 admin 고정값으로 정한 CI 락업 판. 컨트롤러 연결은 카드에서 끊겼다.',
		schema: leaf('ciLockupWidget'),
	},
	{
		id: 'clearspaceViewerWidget',
		name: '클리어스페이스 뷰어',
		description: '가로·세로 로고의 여백 격자 뷰어. 컨트롤러 연결은 카드에서 끊겼다.',
		schema: leaf('clearspaceViewerWidget'),
	},
	{
		id: 'layoutGridWidget',
		name: '레이아웃 그리드',
		description: '판형 표본 위의 여백·거터 격자. 컨트롤러 연결은 카드에서 끊겼다.',
		schema: leaf('layoutGridWidget'),
	},
	{
		id: 'doDontWidget',
		name: 'Do/Don’t',
		description: '권장·허용·금지 예시 격자. 카드로 대체될 예정.',
		schema: leaf('doDontWidget'),
	},
	{
		id: 'hdColorPaletteWidget',
		name: 'HD 컬러 팔레트',
		description: '컬러 그룹의 스와치 격자. 콘텐츠 높이형이라 판 안에서 스크롤된다.',
		schema: leaf('hdColorPaletteWidget'),
	},
	{
		id: 'iconGridWidget',
		name: '아이콘 그리드',
		description: '브랜드 아이콘 격자. 콘텐츠 높이형이라 판 안에서 스크롤된다.',
		schema: leaf('iconGridWidget'),
	},
	{
		id: 'stemClearSpaceWidget',
		name: '여백 규정',
		description: '심볼 stem 기준 여백 규정 도판.',
		schema: leaf('stemClearSpaceWidget'),
	},
	{
		id: 'logoColorVariantWidget',
		name: '로고 색상 변형',
		description: '기본형에서 파생한 WHITE·단색 변형을 나란히 본다.',
		schema: leaf('logoColorVariantWidget'),
	},
	{
		id: 'logoOnBgWidget',
		name: '배경색 위 로고',
		description:
			'컬러 그룹의 배경마다 로고를 얹어 본다. 콘텐츠 높이형이라 판 안에서 스크롤된다.',
		schema: leaf('logoOnBgWidget'),
	},
	{
		id: 'typeHierarchyWidget',
		name: '문단 위계 구성',
		description: '제목·본문·캡션의 위계 표본. 콘텐츠 높이형이라 판 안에서 스크롤된다.',
		schema: leaf('typeHierarchyWidget'),
	},
	{
		id: 'typeLanguageWidget',
		name: '언어별 조판 비교',
		description: '국문·영문 조판을 나란히 비교한다.',
		schema: leaf('typeLanguageWidget'),
	},
] as const satisfies readonly DisplayEntry[]

export type DisplayId = (typeof DISPLAYS)[number]['id']

/** 카드 `display` 필드가 받는 Payload Block 목록. 배열 순서가 admin 선택기 순서다. */
export const displayBlocks: Block[] = DISPLAYS.map((entry) => entry.schema)
