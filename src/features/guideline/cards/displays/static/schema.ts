import type { Block } from 'payload'

/** 정적 디스플레이 — 업로드 이미지가 카드 판을 배경으로 덮는다(cover). dbName 짧게(sdp). */
export const StaticDisplay: Block = {
	slug: 'staticDisplay',
	dbName: 'sdp',
	interfaceName: 'StaticDisplay',
	labels: { singular: '정적 디스플레이(이미지)', plural: '정적 디스플레이(이미지)' },
	fields: [
		{
			name: 'image',
			type: 'upload',
			relationTo: 'application-images',
			required: true,
			admin: {
				description: '카드 판을 배경으로 채우는 이미지입니다. 판 비율에 맞춰 잘립니다.',
			},
		},
	],
}

export default StaticDisplay
