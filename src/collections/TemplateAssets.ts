import type { CollectionConfig } from 'payload'
import { managerOrAdmin } from '@/lib/auth'

/**
 * 템플릿 임포트가 영속화한 이미지 조각 (배경, 아이콘 등).
 * jsonTemplate의 image 요소가 src(URL)와 assetId로 참조한다.
 */
export const TemplateAssets: CollectionConfig = {
	slug: 'template-assets',
	labels: {
		singular: 'Template Asset',
		plural: 'Template Assets',
	},
	access: {
		// 렌더 시 img 태그로 로드하므로 공개 읽기 (BrandLogos와 동일 패턴)
		read: () => true,
		create: managerOrAdmin,
		update: managerOrAdmin,
		delete: managerOrAdmin,
	},
	admin: {
		group: 'Production Resources',
		description: '템플릿 임포트 시 저장되는 이미지 조각입니다. 직접 편집하지 않습니다.',
	},
	fields: [],
	upload: {
		mimeTypes: ['image/*'],
	},
}
