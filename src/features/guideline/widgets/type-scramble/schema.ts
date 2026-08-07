import type { Block } from 'payload'

// 서체 스크램블 뷰어 — 무작위 글자가 흐르다 표본 문구로 굳는다. 규정 설명이 아니라 서체 감상용이다.
//
// 🔴 여러 줄은 **한 덩어리**로 그린다(줄바꿈 보존). 예전에는 줄마다 다른 문자열로 보고 순환시켰는데,
//    표본 문구(Artboard 45)가 국문·영문·숫자·기호를 여러 줄에 걸쳐 한 세트로 보여주는 것이라
//    줄을 쪼개면 표본이 깨진다.
// 🔴 글자 크기와 판 높이는 **author가 정한다**. 예전에는 판을 채우도록 런타임에 맞췄는데, 줄이 늘면
//    글자가 과하게 커지고 스크램블 중 크기가 출렁였다.
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
					'표시할 문구입니다. 줄바꿈을 그대로 살려 한 덩어리로 보여줍니다. 비우면 기본 표본을 씁니다.',
			},
		},
		{
			name: 'fontSize',
			type: 'number',
			defaultValue: 48,
			min: 8,
			max: 200,
			admin: { description: '글자 크기(px)입니다. 줄 수와 판 높이에 맞춰 정합니다.' },
		},
		{
			name: 'paddingY',
			type: 'number',
			defaultValue: 96,
			min: 0,
			max: 400,
			admin: {
				description:
					'글자 위아래 여백(px)입니다. 판은 글자와 이 여백을 합친 만큼 커집니다.',
			},
		},
		{
			name: 'panelHeight',
			type: 'number',
			defaultValue: 360,
			min: 80,
			max: 1200,
			admin: {
				description:
					'판 높이(px)입니다. 고정이라 스크램블 중에도 판형이 흔들리지 않습니다.',
			},
		},
		{
			// 🔴 색은 brand-colors가 소유한다. 위젯이 hex를 박지 않는다 — 브랜드 색이 바뀌면
			//    컬렉션만 고치면 되고, 다른 브랜드로 복제해도 코드가 그대로 산다.
			name: 'color',
			type: 'relationship',
			relationTo: 'brand-colors',
			admin: { description: '글자 색입니다. 비우면 기본 전경색을 씁니다.' },
		},
		{
			// 배경도 brand-colors가 소유한다. 비우면 배경 없이 글자만.
			name: 'background',
			type: 'relationship',
			relationTo: 'brand-colors',
			admin: { description: '판 배경색입니다. 비우면 배경 없이 글자만 보입니다.' },
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
