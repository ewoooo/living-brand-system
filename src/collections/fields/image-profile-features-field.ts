import type { Block, Field } from 'payload'
import { CAMERA_AZIMUTHS, CAMERA_ELEVATIONS } from '@/features/image-generation/camera-control'

const AZIMUTH_LABELS: Record<(typeof CAMERA_AZIMUTHS)[number], string> = {
	front: '정면',
	'front-right': '우측 3/4',
	right: '우측면',
	'rear-right': '후면 우측 3/4',
	rear: '후면',
	'rear-left': '후면 좌측 3/4',
	left: '좌측면',
	'front-left': '좌측 3/4',
}

const ELEVATION_LABELS: Record<(typeof CAMERA_ELEVATIONS)[number], string> = {
	low: '로우 앵글',
	'eye-level': '눈높이',
	elevated: '약간 위',
	high: '하이 앵글',
	'top-down': '탑뷰',
}

/**
 * 구간 목록을 JSON string[]으로 저장한다 — select+hasMany는 값마다 테이블·enum을 만들지만
 * 여기 값은 질의 대상이 아니라 계약 제한이다(exportPolicy의 allowedPpi·allowedFps와 같은 판단).
 */
function cameraSectorsField({
	name,
	label,
	description,
	options,
}: {
	name: string
	label: string
	description: string
	options: readonly { value: string; label: string }[]
}): Field {
	return {
		name,
		type: 'json',
		label,
		admin: {
			components: {
				Field: {
					path: '/components/admin/studio/image-camera-sectors-field#ImageCameraSectorsField',
					clientProps: { label, description, options },
				},
			},
		},
	}
}

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
		fields: [
			cameraSectorsField({
				name: 'azimuths',
				label: '허용 방향',
				description: '비우면 모든 방향을 허용합니다.',
				options: CAMERA_AZIMUTHS.map((value) => ({ value, label: AZIMUTH_LABELS[value] })),
			}),
			cameraSectorsField({
				name: 'elevations',
				label: '허용 높이',
				description: '비우면 모든 높이를 허용합니다.',
				options: CAMERA_ELEVATIONS.map((value) => ({
					value,
					label: ELEVATION_LABELS[value],
				})),
			}),
		],
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
