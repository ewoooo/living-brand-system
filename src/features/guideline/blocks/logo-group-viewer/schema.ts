import type { Block } from 'payload'
import { baseBlockFields } from '../shared/fields'

// 로고 그룹 뷰어 — logoViewer의 변형. 로고 영역을 여러 개(1~3)로 연결해 동시에 보여준다.
// 3개면 상단 1 + 하단 2(수평) 레이아웃(에센허브 커피 서비스 로고형). 슬라이더·텍스트·topic은 그룹 공유.
// "중요도가 1/3인 로고 3개를 동시에" — 각 로고는 자체 오버레이(®·클리어스페이스)를 가질 수 있고 공유 슬라이더로 함께 스케일된다.
export const LogoGroupViewerBlock: Block = {
	slug: 'logoGroupViewer',
	interfaceName: 'LogoGroupViewerBlock',
	labels: { singular: '로고 그룹 뷰어', plural: '로고 그룹 뷰어' },
	fields: [
		{ name: 'title', type: 'text', localized: true },
		{
			name: 'logos',
			type: 'array',
			minRows: 1,
			maxRows: 3,
			labels: { singular: '로고', plural: '로고' },
			admin: { description: '1~3개. 3개면 상단 1 + 하단 2(수평)로 배치됩니다.' },
			fields: [
				{
					name: 'label',
					type: 'text',
					localized: true,
					admin: { description: '로고 캡션(예: Horizontal Type).' },
				},
				{
					name: 'logo',
					type: 'upload',
					relationTo: 'application-images',
					admin: { description: '로고 SVG.' },
				},
				{
					name: 'logoRealHeightPx',
					type: 'number',
					admin: {
						description:
							'파일 속 실제 로고 높이(px). 클리어스페이스 여백 때문에 파일과 다를 때 입력.',
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
					// 최소 크기·® 임계값은 로고에 종속(로고마다 다름). 슬라이더(공유 크기)를 각 로고의 임계값과 비교한다.
					type: 'row',
					fields: [
						{
							name: 'minSizePx',
							type: 'number',
							defaultValue: 20,
							admin: {
								width: '50%',
								description: '이 로고의 최소 크기(px). 미만이면 X 표시.',
							},
						},
						{
							name: 'registeredMinPx',
							type: 'number',
							defaultValue: 45,
							admin: {
								width: '50%',
								description: '이 로고에서 ®를 표시할 최소 크기(px).',
							},
						},
					],
				},
			],
		},
		{
			name: 'topics',
			type: 'array',
			labels: { singular: '토픽', plural: '토픽' },
			admin: { description: '탭으로 노출됩니다. 그룹 전체에 공유됩니다.' },
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

export default LogoGroupViewerBlock
