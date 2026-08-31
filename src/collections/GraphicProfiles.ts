import { APIError, type CollectionConfig } from 'payload'
import {
	deriveGraphicStudioConfig,
	GRAPHIC_RUNTIME_OPTIONS,
	graphicRuntimeManifests,
} from '@/features/graphic-generation/domain/graphic-studio-manifest'
import { managerManagedAccess } from '@/lib/auth'
import { previewImageField } from './fields/preview-image-field'
import {
	graphicPresetsField,
	studioControllerPresentationField,
	studioControllerRestrictionsField,
	studioExportPolicyField,
} from './fields/studio-controller-field'
import { draftVersions } from './shared'

// 🔑 `type`을 함께 싣는다 — Admin의 프리셋 미리보기가 runtime adapter를 고를 때 id와 type을 대조한다.
//    빼면 `loadGraphicRuntimeAdapter`가 언제나 null을 돌려주고 미리보기가 「등록되지 않은 runtime」이 된다.
const graphicAdminRuntimeManifests = graphicRuntimeManifests.map(
	({ artifacts, controller, id, type }) => ({ artifacts, controller, id, type }),
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
		graphicPresetsField({ source: 'graphic', baseConfigs: graphicAdminRuntimeManifests }),
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
