import type { Block } from 'payload'
import { baseBlockFields } from '../shared/fields'

// 로고 뷰어(naive) — 같은 크기로 제작된 SVG 3장(순수 로고 / 등록상표® / 클리어스페이스 디자인)을
// 겹쳐 놓고 오버레이를 토글해 보여준다. 같은 사이즈라 절대 배치로 자동 정렬된다.
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
			admin: { description: '순수 로고 SVG(기본 레이어).' },
		},
		{
			name: 'registeredMark',
			type: 'upload',
			relationTo: 'application-images',
			admin: { description: '등록상표(®) 오버레이 SVG. 로고와 같은 크기여야 정렬됩니다.' },
		},
		{
			name: 'clearSpaceGuide',
			type: 'upload',
			relationTo: 'application-images',
			admin: {
				description: '클리어스페이스 가이드 오버레이 SVG. 로고와 같은 크기여야 정렬됩니다.',
			},
		},
		...baseBlockFields(),
	],
}

export default LogoViewerBlock
