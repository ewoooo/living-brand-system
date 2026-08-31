import type { Field } from 'payload'
import { STUDIO_OUTPUT_FORMAT_OPTIONS } from '@/features/studio-export/export-contract'
import type {
	StudioKind,
	StudioRuntimeManifest,
} from '@/modules/studio-controller/controller-definition'

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

/**
 * 매니저가 창작자에게 제공할 프리셋 목록. 🔑 `controllerRestrictions`와 같은 자리에 둔다 —
 * 「무엇을 노출할지」와 「어디서 시작할지」를 같은 사람이 같은 화면에서 정하기 때문이다.
 * 🔑 저장 형태가 json인 것도 그 필드와 같다 — 렌더를 통째로 대신하므로 array 행 UI가 필요 없다.
 */
export function graphicPresetsField({
	source,
	baseConfigs,
}: {
	source: StudioKind
	baseConfigs?: readonly StudioAdminBaseConfig[]
}): Field {
	return {
		name: 'presets',
		type: 'json',
		label: '프리셋',
		admin: {
			components: {
				Field: {
					path: '/components/admin/studio/graphic-presets-field#GraphicPresetsField',
					clientProps: { source, baseConfigs },
				},
			},
		},
		// 🔴 같은 식별자가 둘이면 뒤엣것이 조용히 가려진다 — 화면에는 둘 다 보이는데 하나만 먹는다.
		validate: (value: unknown) => {
			if (value === null || value === undefined) return true
			if (!Array.isArray(value)) return '프리셋은 목록이어야 합니다.'
			const ids = value
				.map((entry) => (entry as { presetId?: unknown } | null)?.presetId)
				.filter((id): id is string => typeof id === 'string')
			const invalid = ids.filter((id) => !/^[a-z][a-z0-9-]*$/.test(id))
			if (invalid.length > 0) {
				return `식별자는 영문 소문자로 시작하고 소문자·숫자·하이픈만 씁니다: ${invalid.join(', ')}`
			}
			const duplicated = ids.filter((id, index) => ids.indexOf(id) !== index)
			return duplicated.length === 0
				? true
				: `프리셋 식별자가 중복되었습니다: ${[...new Set(duplicated)].join(', ')}`
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
		label: '출력 설정',
		admin: {
			description: '비우면 Exporter가 지원하는 형식을 모두 허용합니다.',
			// 그룹 전체를 정본(76:4) 카드로 그린다 — 하위 필드는 스키마·저장 계약만 소유하고
			// 렌더는 이 컴포넌트가 useField(하위 path)로 직접 잇는다.
			components: {
				Field: {
					path: '/components/admin/studio/studio-export-policy-field#StudioExportPolicyField',
					clientProps: { source, baseConfigs, includeOriginal },
				},
			},
		},
		fields: [
			{
				name: 'allowedFormats',
				type: 'select',
				hasMany: true,
				options: [...STUDIO_OUTPUT_FORMAT_OPTIONS],
				label: '허용 형식',
			},
			{
				name: 'print',
				type: 'group',
				label: '인쇄',
				fields: [
					{
						name: 'allowedPpi',
						type: 'json',
						label: '사용할 인쇄 해상도',
						admin: { description: '전부 켜면 제한을 저장하지 않습니다.' },
					},
				],
			},
			{
				name: 'video',
				type: 'group',
				label: '영상',
				fields: [
					{ name: 'allowedFps', type: 'json', label: '사용할 영상 프레임' },
					// 정본(76:4) 순서: 프레임 → 길이 → 너비·높이.
					{
						name: 'maxDurationSeconds',
						type: 'number',
						min: 0.1,
						label: '최대 영상 길이(초)',
					},
					{ name: 'maxWidth', type: 'number', min: 1, label: '최대 너비' },
					{ name: 'maxHeight', type: 'number', min: 1, label: '최대 높이' },
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
