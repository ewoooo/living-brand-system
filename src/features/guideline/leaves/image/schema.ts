import type { Block } from 'payload'

// Image leaf — Block이 직접 품는 정적 이미지 슬롯. Widget과 형제 위계(둘 다 leaf).
// application-images 참조. dbName 짧게(img)로 중첩 테이블명 63자 방어.
// leaves/ = Block의 자식 leaf 종류(image·(추후) text/shape/link). widget은 인터랙티브 특수 leaf라 widgets/에 별도.
export const ImageLeaf: Block = {
	slug: 'image',
	dbName: 'img',
	interfaceName: 'ImageLeaf',
	labels: { singular: '이미지', plural: '이미지' },
	fields: [
		{
			name: 'image',
			type: 'upload',
			relationTo: 'application-images',
			admin: { description: '표시할 이미지입니다.' },
		},
	],
}

export default ImageLeaf
