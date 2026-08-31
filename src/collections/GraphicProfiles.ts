import { APIError, type CollectionConfig } from 'payload'
import {
	deriveGraphicStudioConfig,
	GRAPHIC_RUNTIME_OPTIONS,
	graphicRuntimeManifests,
} from '@/features/graphic-generation/domain/graphic-studio-manifest'
import { managerManagedAccess } from '@/lib/auth'
import { previewImageField } from './fields/preview-image-field'
import {
	studioControllerPresentationField,
	studioControllerRestrictionsField,
	studioExportPolicyField,
} from './fields/studio-controller-field'
import { draftVersions } from './shared'

const graphicAdminRuntimeManifests = graphicRuntimeManifests.map(
	({ artifacts, controller, id }) => ({ artifacts, controller, id }),
)

export const GraphicProfiles: CollectionConfig = {
	slug: 'graphic-profiles',
	dbName: 'graphic_profiles',
	access: managerManagedAccess,
	hooks: {
		beforeChange: [
			({ data, originalDoc }) => {
				const effective = { ...originalDoc, ...data }
				if (effective._status !== 'published') return data
				try {
					deriveGraphicStudioConfig({
						id: Number(effective.id ?? 0),
						name: String(effective.name ?? ''),
						runtime: String(effective.runtime ?? ''),
						controllerRestrictions: effective.controllerRestrictions,
						controllerPresentation: effective.controllerPresentation,
						exportPolicy: effective.exportPolicy,
					})
				} catch (error) {
					throw new APIError(
						error instanceof Error
							? error.message
							: '그래픽 Controller 계약을 확인하세요.',
						400,
					)
				}
				return data
			},
		],
	},
	admin: {
		group: '제작 도구',
		useAsTitle: 'name',
		defaultColumns: ['name', 'runtime', 'displayOrder', '_status', 'updatedAt'],
		description:
			'등록된 그래픽 runtime의 기본 Controller 계약을 좁혀 기본값·선택지·범위·사용 상태를 관리합니다.',
	},
	defaultSort: 'displayOrder',
	labels: { singular: '그래픽 프로파일', plural: '그래픽 프로파일' },
	versions: draftVersions,
	fields: [
		{ name: 'name', type: 'text', required: true, label: '프로파일 이름' },
		{
			name: 'runtime',
			type: 'select',
			required: true,
			unique: true,
			index: true,
			options: GRAPHIC_RUNTIME_OPTIONS,
			label: '그래픽 Runtime',
			admin: {
				description:
					'실행 구현은 코드 registry가 소유합니다. 프로파일은 해당 runtime의 편집 범위만 좁힙니다.',
			},
		},
		previewImageField(),
		{
			name: 'displayOrder',
			type: 'number',
			required: true,
			defaultValue: 0,
			min: 0,
			admin: { position: 'sidebar' },
		},
		{
			name: 'presets',
			type: 'array',
			label: '프리셋',
			labels: { singular: '프리셋', plural: '프리셋' },
			admin: {
				initCollapsed: true,
				description:
					'브랜드 디자이너가 정해 두는 파라미터 조합입니다. 창작자는 이 중 하나를 고른 뒤 노출된 컨트롤만 조정합니다. 코드가 제공하는 프리셋은 그대로 남고 여기 만든 것이 뒤에 붙습니다.',
			},
			fields: [
				{
					name: 'presetId',
					type: 'text',
					required: true,
					label: '식별자',
					admin: {
						width: '40%',
						description:
							'스튜디오가 저장하는 값입니다. 🔴 만든 뒤에 바꾸면 이미 그 프리셋을 고른 사람의 선택이 풀립니다.',
					},
					validate: (value: unknown) =>
						typeof value === 'string' && /^[a-z][a-z0-9-]*$/.test(value)
							? true
							: '식별자는 영문 소문자로 시작하고 소문자·숫자·하이픈만 씁니다.',
				},
				{
					name: 'label',
					type: 'text',
					required: true,
					label: '이름',
					admin: { width: '60%' },
				},
				{
					name: 'values',
					type: 'json',
					label: '파라미터',
					admin: {
						description:
							'런타임 입력 스키마의 일부입니다. 여기 없는 값은 런타임 기본값을 따릅니다.',
					},
				},
			],
			// 🔴 같은 식별자가 둘이면 뒤엣것이 조용히 가려진다 — 화면에는 둘 다 보이는데 하나만 먹는다.
			validate: (value: unknown) => {
				if (!Array.isArray(value)) return true
				const ids = value
					.map((entry) => (entry as { presetId?: unknown } | null)?.presetId)
					.filter((id): id is string => typeof id === 'string')
				const duplicated = ids.filter((id, index) => ids.indexOf(id) !== index)
				return duplicated.length === 0
					? true
					: `프리셋 식별자가 중복되었습니다: ${[...new Set(duplicated)].join(', ')}`
			},
		},
		studioControllerRestrictionsField({
			source: 'graphic',
			baseConfigs: graphicAdminRuntimeManifests,
		}),
		studioControllerPresentationField({
			source: 'graphic',
			baseConfigs: graphicAdminRuntimeManifests,
		}),
		studioExportPolicyField({
			source: 'graphic',
			baseConfigs: graphicAdminRuntimeManifests,
		}),
	],
}
