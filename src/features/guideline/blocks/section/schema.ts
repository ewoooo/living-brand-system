import type { Block } from 'payload'
import LayoutBlock from '../block/schema'
import { backgroundToneField, baseBlockFields } from '../shared/fields'

// 제목에서 앵커를 뽑는다. Payload의 slugify는 `[^\w-]+`를 버려 한글 제목이 통째로 사라지므로
// 글자·숫자(\p{L}\p{N})를 남긴다 — `#키-레이아웃`도 프래그먼트로는 문제없이 동작한다.
export const titleToAnchor = (title: string): string =>
	title
		.trim()
		.toLowerCase()
		.replace(/[^\p{L}\p{N}]+/gu, '-')
		.replace(/^-+|-+$/g, '')

// 토픽 한 화면 안의 꼭지. 2026-08-26까지는 별도 문서(3단계 '페이지')였고, 그 문서가 이 블록이 됐다.
//
// 🔴 꼭지 경계를 **데이터로** 갖는 것이 이 블록의 존재 이유다. 평평한 블록 목록에서 "제목이 있으면
//    새 꼭지"처럼 관례로 표현하면, Better Editor의 블록 드래그 한 번에 경계가 조용히 깨진다.
// 🔴 자기 자신을 자식으로 넣지 말 것 — Payload 스키마 생성기는 자기 참조 블록에서 무한 재귀에 빠진다
//    (`@payloadcms/drizzle` build.js가 traverseFields를 rawTables 등록 **전에** 부른다).
// dbName 짧게(sec)로 중첩 테이블명 63자 방어. enum은 전역 이름 공유.
export const SectionBlock: Block = {
	slug: 'section',
	dbName: 'sec',
	interfaceName: 'SectionBlock',
	labels: { singular: '섹션', plural: '섹션' },
	fields: [
		{
			name: 'anchor',
			type: 'text',
			// 🔴 localized가 아니다. 로케일마다 앵커가 갈리면 복사된 링크가 언어를 바꾸는 순간 끊긴다.
			//    옛 페이지 문서의 slug를 그대로 받으므로 기존 `#앵커` URL이 보존된다.
			// 🔴 required가 아닌 이유: 비우면 아래 훅이 제목에서 채운다. required면 어드민이 저장 전
			//    클라이언트 검증에서 막아 훅까지 오지 못한다(slugField는 클라이언트 컴포넌트로 채워서 통과한다).
			hooks: {
				// 🔴 이미 값이 있으면 손대지 않는다 — 앵커는 URL 정체성이라 제목을 고칠 때마다
				//    다시 파생되면 밖에서 공유한 `#앵커` 링크가 조용히 끊긴다.
				beforeValidate: [
					({ siblingData, value }) => {
						if (typeof value === 'string' && value.trim()) return value
						const title = (siblingData as { title?: unknown } | undefined)?.title
						// locale=all API 쓰기에서는 title이 로케일 객체다 — 그때는 채우지 않고 입력에 맡긴다.
						return typeof title === 'string' ? titleToAnchor(title) || value : value
					},
				],
			},
			admin: {
				description:
					'이 꼭지의 URL 앵커입니다(예: key-layout). 비우면 제목에서 자동 생성합니다. 토픽 안에서 유일해야 합니다.',
			},
		},
		{
			name: 'title',
			type: 'text',
			required: true,
			localized: true,
			admin: { description: '목차에 표시되는 꼭지 제목입니다.' },
		},
		{
			name: 'description',
			type: 'richText',
			localized: true,
			admin: { description: '제목 아래에 표시할 선택 설명입니다.' },
		},
		// 🔴 면은 제목·본문까지 덮는다 — 옛 문서(Page)의 면이 그랬다(Figma 61:3299의 Article).
		//    자식 블록의 면은 배치 영역에서 끊기므로 이 자리를 대신할 수 없다.
		{
			name: 'background',
			type: 'relationship',
			relationTo: 'brand-colors',
			admin: { description: '꼭지 전체(제목·본문·블록)를 덮는 배경색입니다. 비우면 기본.' },
		},
		backgroundToneField(),
		{
			name: 'blocks',
			type: 'blocks',
			label: '본문',
			blocks: [LayoutBlock],
			admin: { description: '이 꼭지가 품는 레이아웃 블록들입니다.' },
		},
		// rules는 옛 페이지 문서가 갖던 것을 그대로 이어받는다(collectGuidelineCheckSources가 훑는다).
		...baseBlockFields(),
	],
}

export default SectionBlock
