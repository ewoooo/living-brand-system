import type { Block, Field } from 'payload'

const featureBlocks: Block[] = [
	{
		slug: 'colorAdjustment',
		interfaceName: 'ImageProfileColorAdjustmentFeature',
		labels: { singular: '색 조정', plural: '색 조정' },
		fields: [
			{
				name: 'line',
				type: 'text',
				required: true,
				label: '라인 색상 컨트롤 ID',
			},
			{
				name: 'background',
				type: 'text',
				label: '배경 색상 컨트롤 ID',
			},
		],
	},
	{
		slug: 'cameraControl',
		interfaceName: 'ImageProfileCameraControlFeature',
		labels: { singular: '카메라 조정', plural: '카메라 조정' },
		fields: [],
	},
]

/** Image Profile capability가 참조할 Controller control ID를 저작하는 선택 필드다. */
export function imageProfileFeaturesField(): Field {
	return {
		name: 'features',
		type: 'blocks',
		blocks: featureBlocks,
		label: '프로파일 기능',
		admin: {
			description:
				'Controller가 있는 새 계약에서 비우면 기능을 열지 않습니다. 값과 사용 상태는 참조한 Controller control이 소유합니다.',
		},
	}
}
