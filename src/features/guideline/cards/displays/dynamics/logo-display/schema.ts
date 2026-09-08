import type { Block } from 'payload'

// 로고 크게 보기 위젯 — 픽된 로고 SVG를 크게 그대로 보여준다(클리어스페이스/오버레이 없음). 디자인 컨셉용.
// 🔑 로고를 공유 풀에서 fishing하지 않고 logo 필드로 pin한다 → 풀에 뭘 넣든 이 페이지는 안 변형됨.
// 위젯은 image·text 동급 leaf(rule 모름). dbName 짧게(ldp)로 중첩 테이블명 63자 방어.
export const LogoDisplayWidget: Block = {
	slug: 'logoDisplayWidget',
	dbName: 'ldp',
	interfaceName: 'LogoDisplayWidget',
	labels: { singular: '로고 크게 보기 위젯', plural: '로고 크게 보기 위젯' },
	fields: [
		{
			name: 'logo',
			type: 'upload',
			relationTo: 'brand-logos',
			required: true,
			admin: { description: '표시할 이미지입니다.' },
		},
		// 유한 이미지 박스 사이징(레이아웃 아님 — width:100% 같은 건 block 몫). 비우면 이미지 본연 크기.
		{
			name: 'width',
			type: 'number',
			min: 1,
			admin: { description: '폭(px). 비우면 본연 크기.' },
		},
		{
			name: 'height',
			type: 'number',
			min: 1,
			admin: { description: '높이(px). 비우면 본연 크기.' },
		},
		{
			name: 'padding',
			type: 'number',
			min: 0,
			admin: { description: '이미지 주변 여백(px).' },
		},
	],
}

export default LogoDisplayWidget
