import type { GlobalAfterChangeHook, GlobalConfig } from 'payload'
import { revalidateFrontendShell } from '../collections/revalidate'

// 컬렉션 쪽 무효화와 같은 껍데기를 버린다 — 경로를 두 곳에 적어 두면 한쪽만 고쳐진다.
export const revalidateGuideline: GlobalAfterChangeHook = ({ doc, req }) => {
	if (doc._status === 'published') {
		revalidateFrontendShell(req)
	}

	return doc
}

export const Guideline: GlobalConfig = {
	slug: 'guideline',
	label: '가이드라인 기본 정보',
	admin: {
		group: '가이드라인',
	},
	versions: {
		drafts: {
			schedulePublish: true,
		},
		max: 50,
	},
	hooks: {
		afterChange: [revalidateGuideline],
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
					'표지와 푸터에 표시할 문서명입니다. 예: HD현대 Brand Design Guidelines 1.0',
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
		{
			name: 'primaryColor',
			type: 'relationship',
			relationTo: 'brand-colors',
			maxDepth: 1,
			admin: {
				description: 'Creator UI의 기본·라이트 모드 primary 색상입니다.',
			},
		},
		{
			name: 'primaryColorDark',
			type: 'relationship',
			relationTo: 'brand-colors',
			maxDepth: 1,
			admin: {
				description:
					'Creator UI의 다크 모드 primary 색상입니다. 비어 있으면 기본 색상을 사용합니다.',
			},
		},
	],
}
