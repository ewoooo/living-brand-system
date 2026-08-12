import { APIError, type CollectionConfig } from 'payload'
import {
	deriveGraphicStudioConfig,
	GRAPHIC_RUNTIME_OPTIONS,
	graphicStudioConfigs,
} from '@/features/graphic-studio/graphic-studio-manifest'
import { managerManagedAccess } from '@/lib/auth'
import {
	studioControllerField,
	studioControllerOverrideField,
	studioOutputPolicyField,
} from './fields/studio-controller-field'
import { draftVersions } from './shared'

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
						controller: effective.controller,
						controllerOverride: effective.controllerOverride,
						output: effective.output,
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
		{
			name: 'displayOrder',
			type: 'number',
			required: true,
			defaultValue: 0,
			min: 0,
			admin: { position: 'sidebar' },
		},
		studioControllerField({
			mode: 'restrict',
			hidden: true,
			description:
				'비우면 runtime 기본 계약을 사용합니다. 필요한 항목만 입력하면 같은 ID의 options, 범위, 기본값, 사용 상태만 좁힙니다.',
		}),
		studioControllerOverrideField({
			source: 'graphic',
			baseConfigs: graphicStudioConfigs.map(({ id, controller }) => ({ id, controller })),
		}),
		studioOutputPolicyField({ formats: [{ label: 'SVG', value: 'svg' }] }),
	],
}
