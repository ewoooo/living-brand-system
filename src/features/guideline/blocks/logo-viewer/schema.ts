import type { Block } from 'payload'
import { baseBlockFields } from '../shared/fields'

// 로고 뷰어 — 공유 로고 스테이지 위에서 topic(탭)별 기능을 보여준다. topic은 임의 N개(브랜드 무관):
// 애플 제품 페이지의 세그먼트 탭처럼 라벨 리스트 + 선택된 topic의 설명·동작. kind가 동작을 정한다.
//  - minSize: 크기 슬라이더, minSizePx 미만이면 X 표시
//  - clearSpace: 클리어스페이스 오버레이 보기 토글
//  - registeredMark: registeredMinPx 이상일 때만 ® 오버레이 표시
export const LogoViewerBlock: Block = {
	slug: 'logoViewer',
	interfaceName: 'LogoViewerBlock',
	labels: { singular: '로고 뷰어', plural: '로고 뷰어' },
	fields: [
		{ name: 'title', type: 'text', localized: true },
		{
			name: 'logo',
			type: 'upload',
			relationTo: 'application-images',
			admin: { description: '기본 로고 SVG(공유 스테이지).' },
		},
		{
			name: 'logoRealHeightPx',
			type: 'number',
			admin: {
				description:
					'로고 파일 속 실제 로고 높이(px). 클리어스페이스 여백 때문에 파일 크기와 다를 때 입력. 이 가중치가 3파일 모두에 적용됩니다. 비우면 파일 크기=로고로 간주.',
			},
		},
		{
			name: 'registeredMark',
			type: 'upload',
			relationTo: 'application-images',
			admin: { description: '등록상표(®) 오버레이 SVG. 로고와 같은 크기.' },
		},
		{
			name: 'clearSpaceGuide',
			type: 'upload',
			relationTo: 'application-images',
			admin: { description: '클리어스페이스 오버레이 SVG. 로고와 같은 크기.' },
		},
		{
			type: 'row',
			fields: [
				{
					name: 'minSizePx',
					type: 'number',
					defaultValue: 20,
					admin: {
						width: '50%',
						description: '최소 크기(px). 이 미만이면 X 표시(슬라이더 하한).',
					},
				},
				{
					name: 'registeredMinPx',
					type: 'number',
					defaultValue: 45,
					admin: { width: '50%', description: '이 크기(px) 이상일 때만 ® 표시.' },
				},
			],
		},
		{
			name: 'topics',
			type: 'array',
			labels: { singular: '토픽', plural: '토픽' },
			admin: { description: '탭으로 노출됩니다. 순서·개수·라벨 자유.' },
			fields: [
				{
					name: 'kind',
					type: 'select',
					required: true,
					options: [
						{ label: '최소 크기', value: 'minSize' },
						{ label: '클리어스페이스', value: 'clearSpace' },
						{ label: '등록상표', value: 'registeredMark' },
					],
					admin: { description: '이 탭의 동작.' },
				},
				{
					name: 'label',
					type: 'text',
					localized: true,
					admin: { description: '탭 라벨.' },
				},
				{ name: 'description', type: 'richText', localized: true },
			],
		},
		...baseBlockFields(),
	],
}

export default LogoViewerBlock
