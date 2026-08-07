import type { Block } from 'payload'

// 서체 스크램블 뷰어 — 무작위 글자가 흐르다 목표 문자열로 굳는다. 규정 설명이 아니라 서체 감상용이라
// 필드가 "무엇을 어떤 굵기로 보여줄까" 둘뿐이다. 크기·행간은 판이 알아서 맞춘다(view.tsx).
//
// dbName 짧게(tsc)로 중첩 테이블명 63자 방어. enum은 전역 이름 공유라 enumName 명시.
// 🔴 배열 필드를 두지 않는다 — 배열은 조회 SQL 별칭에 레벨을 하나 더 얹어 63자를 넘기면 조인이 조용히
//    깨진다(alias-length.test.ts가 지킨다). 여러 문자열은 배열 대신 textarea 줄바꿈으로 받는다.
export const TypeScrambleWidget: Block = {
	slug: 'typeScrambleWidget',
	dbName: 'tsw',
	interfaceName: 'TypeScrambleWidget',
	labels: { singular: '서체 스크램블 뷰어', plural: '서체 스크램블 뷰어' },
	fields: [
		{
			name: 'text',
			type: 'textarea',
			admin: {
				description:
					'한 줄에 문자열 하나입니다. 여러 줄을 넣으면 차례로 순환합니다. 비우면 기본 문구를 씁니다.',
			},
		},
		{
			name: 'weight',
			type: 'select',
			defaultValue: 'bold',
			enumName: 'enum_tsw_weight',
			options: [
				{ label: 'Light', value: 'light' },
				{ label: 'Medium', value: 'medium' },
				{ label: 'Bold', value: 'bold' },
			],
			admin: {
				description:
					'표시 굵기입니다. 배포된 서체 파일에 없는 굵기를 고르면 브라우저 합성이라는 안내가 함께 나옵니다.',
			},
		},
	],
}

export default TypeScrambleWidget
