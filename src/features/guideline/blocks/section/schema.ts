import type { Block } from 'payload'
import LayoutBlock from '../block/schema'
import { backgroundToneField, baseBlockFields } from '../shared/fields'

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
			required: true,
			// 🔴 localized가 아니다. 로케일마다 앵커가 갈리면 복사된 링크가 언어를 바꾸는 순간 끊긴다.
			//    옛 페이지 문서의 slug를 그대로 받으므로 기존 `#앵커` URL이 보존된다.
			admin: {
				description:
					'이 꼭지의 URL 앵커입니다(예: key-layout). 토픽 안에서 유일해야 합니다.',
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
