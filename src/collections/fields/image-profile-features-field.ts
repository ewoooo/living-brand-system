import type { Block, Field } from 'payload'

const featureBlocks: Block[] = [
	{
		slug: 'colorAdjustment',
		interfaceName: 'ImageProfileColorAdjustmentFeature',
		labels: { singular: '색 조정', plural: '색 조정' },
		fields: [
			{
				name: 'background',
				type: 'checkbox',
				defaultValue: false,
				label: '배경 색상 조정',
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

/** Image Profile이 Image Runtime Manifest 지원 범위 안에서 열 feature를 선택하는 필드다. */
export function imageProfileFeaturesField(): Field {
	return {
		name: 'features',
		type: 'blocks',
		blocks: featureBlocks,
		label: '프로파일 기능',
		admin: {
			description:
				'비우면 기능을 열지 않습니다. 값과 사용 상태는 Controller 제한이 소유합니다.',
		},
	}
}
