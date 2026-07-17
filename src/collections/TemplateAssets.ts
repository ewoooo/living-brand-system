import type { CollectionConfig } from 'payload'
import { managerOrAdmin } from '@/lib/auth'

/**
 * 템플릿 임포트가 영속화한 이미지 조각 (배경, 아이콘 등).
 * jsonTemplate의 image 요소와 Figma HTML의 img 요소가 내부 URL로 참조한다.
 */
export const TemplateAssets: CollectionConfig = {
	slug: 'template-assets',
	labels: {
		singular: '템플릿 내부 에셋',
		plural: '템플릿 내부 에셋',
	},
	// 비인가 스테이징 컬렉션 — 미승인 추출물이므로 공개하지 않는다.
	// Admin 미리보기(인증된 manager)의 img 로드는 쿠키 인증으로 통과한다.
	access: {
		read: managerOrAdmin,
		create: managerOrAdmin,
		update: managerOrAdmin,
		delete: managerOrAdmin,
	},
	admin: {
		group: '제작 도구',
		hidden: true,
		description: '템플릿 임포트 시 저장되는 이미지 조각입니다. 직접 편집하지 않습니다.',
	},
	fields: [
		{
			name: 'checksum',
			type: 'text',
			index: true,
			admin: {
				readOnly: true,
				description:
					'파일 내용 해시입니다. 임포트가 같은 조각을 다시 만들지 않도록 재사용 기준으로 씁니다.',
			},
		},
	],
	upload: {
		mimeTypes: ['image/*'],
	},
}
