import type { Field } from 'payload'
import { STUDIO_OUTPUT_FORMAT_OPTIONS } from '@/features/studio-export/export-contract'
import { PRINT_PPI_OPTIONS } from '@/features/studio-export/print-policy'
import type {
	StudioKind,
	StudioRuntimeManifest,
} from '@/modules/studio-controller/controller-definition'
import { STUDIO_VIDEO_FPS_OPTIONS } from '@/modules/studio-artifact/studio-artifact'

type StudioAdminBaseConfig = StudioRuntimeManifest & { id: string }

export function studioControllerRestrictionsField({
	source,
	baseConfigs,
}: {
	source: StudioKind
	baseConfigs?: readonly StudioAdminBaseConfig[]
}): Field {
	return {
		name: 'controllerRestrictions',
		type: 'json',
		label: 'Controller 제한',
		admin: {
			components: {
				Field: {
					path: '/components/admin/studio/studio-controller-restrictions-field#StudioControllerRestrictionsField',
					clientProps: { source, baseConfigs },
				},
			},
		},
	}
}

export function studioControllerPresentationField({
	source,
	baseConfigs,
}: {
	source: StudioKind
	baseConfigs?: readonly StudioAdminBaseConfig[]
}): Field {
	return {
		name: 'controllerPresentation',
		type: 'json',
		label: 'Controller 표현',
		admin: {
			components: {
				Field: {
					path: '/components/admin/studio/studio-controller-restrictions-field#StudioControllerPresentationField',
					clientProps: { source, baseConfigs },
				},
			},
		},
	}
}

/** Exporter 호환 형식을 Admin이 추가하지 않고 좁히기만 하는 정책 필드다. */
export function studioExportPolicyField({
	source,
	baseConfigs,
	includeOriginal = false,
}: {
	source: StudioKind
	baseConfigs?: readonly StudioAdminBaseConfig[]
	includeOriginal?: boolean
}): Field {
	return {
		name: 'exportPolicy',
		type: 'group',
		label: '출력',
		admin: { description: '비우면 Exporter가 지원하는 형식을 모두 허용합니다.' },
		fields: [
			{
				name: 'allowedFormats',
				type: 'select',
				hasMany: true,
				options: [...STUDIO_OUTPUT_FORMAT_OPTIONS],
				label: '허용 형식',
				admin: {
					components: {
						Field: {
							path: '/components/admin/studio/studio-output-formats-field#StudioOutputFormatsField',
							clientProps: { source, baseConfigs },
						},
					},
				},
			},
			{
				name: 'print',
				type: 'group',
				label: '인쇄 제한',
				fields: [
					{
						name: 'allowedPpi',
						type: 'json',
						label: '허용 PPI',
						admin: {
							description: '비우면 72, 150, 300ppi를 모두 허용합니다.',
							components: {
								Field: {
									path: '/components/admin/studio/studio-output-number-options-field#StudioOutputNumberOptionsField',
									clientProps: {
										baseConfigs,
										kind: 'print',
										options: [...PRINT_PPI_OPTIONS],
										source,
									},
								},
							},
						},
					},
				],
			},
			{
				name: 'video',
				type: 'group',
				label: '영상 제한',
				fields: [
					{
						name: 'allowedFps',
						type: 'json',
						label: '허용 FPS',
						admin: {
							components: {
								Field: {
									path: '/components/admin/studio/studio-output-number-options-field#StudioOutputNumberOptionsField',
									clientProps: {
										baseConfigs,
										kind: 'video',
										options: [...STUDIO_VIDEO_FPS_OPTIONS],
										source,
									},
								},
							},
						},
					},
					{ name: 'maxWidth', type: 'number', min: 1, label: '최대 너비' },
					{ name: 'maxHeight', type: 'number', min: 1, label: '최대 높이' },
					{
						name: 'maxDurationSeconds',
						type: 'number',
						min: 0.1,
						label: '최대 길이(초)',
					},
				],
			},
			...(includeOriginal
				? [
						{
							name: 'original',
							type: 'checkbox' as const,
							defaultValue: true,
							label: '원본 다운로드 허용',
						},
					]
				: []),
		],
	}
}
