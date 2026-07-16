import type { CollectionConfig } from 'payload'
import { draftVersions } from './shared'

export const ApplicationImages: CollectionConfig = {
	slug: 'application-images',
	labels: {
		singular: '브랜드 이미지',
		plural: '브랜드 이미지',
	},
	access: {
		// 발행 가이드라인 SSR과 템플릿 렌더링이 인증 없이 파일 URL을 참조하므로 의도적인 공개 읽기다.
		// 쓰기는 Payload 기본(인증 사용자)을 따른다 — read 외 권한을 열지 않는다.
		read: () => true,
	},
	admin: {
		group: '브랜드 자원',
		useAsTitle: 'name',
		defaultColumns: ['filename', 'name', 'alt', 'updatedAt'],
	},
	versions: draftVersions,
	fields: [
		{
			name: 'name',
			type: 'text',
			required: true,
			localized: true,
		},
		{
			name: 'alt',
			type: 'text',
			required: true,
			localized: true,
		},
	],
	upload: {
		imageSizes: [
			{
				name: 'thumbnail',
				width: 320,
				height: 240,
				fit: 'cover',
			},
		],
		adminThumbnail: 'thumbnail',
		focalPoint: true,
		crop: true,
		mimeTypes: ['image/*'],
	},
}
