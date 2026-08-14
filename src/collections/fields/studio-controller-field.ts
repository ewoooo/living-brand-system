import type { Field } from 'payload'
import { STUDIO_OUTPUT_FORMAT_OPTIONS } from '@/features/studio-export/export-contract'

export function studioControllerRestrictionsField({
	source,
	baseConfigs,
}: {
	source: 'graphic' | 'image' | 'template'
	baseConfigs?: readonly unknown[]
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
	source: 'graphic' | 'image' | 'template'
	baseConfigs?: readonly unknown[]
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

/** Runtime/Service 지원 형식을 Admin이 추가하지 않고 좁히기만 하는 정책 필드다. */
export function studioOutputPolicyField({
	includeOriginal = false,
}: {
	includeOriginal?: boolean
} = {}): Field {
	return {
		name: 'output',
		type: 'group',
		label: '출력',
		admin: { description: '비우면 실행 구현이 지원하는 형식을 모두 허용합니다.' },
		fields: [
			{
				name: 'allowedFormats',
				type: 'select',
				hasMany: true,
				options: [...STUDIO_OUTPUT_FORMAT_OPTIONS],
				label: '허용 형식',
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
