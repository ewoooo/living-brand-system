import type { GlobalConfig } from 'payload'

export const Guideline: GlobalConfig = {
	slug: 'guideline',
	label: 'Metadata',
	admin: {
		group: 'Guideline',
	},
	versions: {
		drafts: {
			schedulePublish: true,
		},
		max: 50,
	},
	fields: [
		{
			name: 'companyName',
			type: 'text',
			required: true,
		},
		{
			name: 'documentTitle',
			type: 'text',
			required: true,
			localized: true,
			admin: {
				description:
					'표지와 푸터에 표시할 문서명입니다. 예: Essenherb Brand Design Guidelines 1.0',
			},
		},
		{
			name: 'issuedLabel',
			type: 'text',
			localized: true,
			admin: {
				description: '발행 시점 표시 문구입니다. 예: Issued in February, 2026',
			},
		},
		{
			name: 'favicon',
			type: 'upload',
			relationTo: 'application-images',
			admin: {
				description:
					'브라우저 탭과 메타데이터에 사용할 파비콘 이미지입니다. 최대 사이즈는 1024px x 1024px 입니다.',
			},
		},
	],
}
