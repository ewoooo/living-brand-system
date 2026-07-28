import { type CollectionConfig, type PayloadRequest, slugField } from 'payload'
import {
	imagePromptNormalizationRequestSchema,
	validateImageProfilePromptRows,
	validateImagePromptNormalizationRows,
} from '@/features/image-generation/image-profile-prompt'
import {
	ImagePromptNormalizationUnavailableError,
	normalizeImageProfilePrompt,
} from '@/features/image-generation/services/normalize-image-profile-prompt.service'
import { isManager, managerManagedAccess } from '@/lib/auth'
import { draftVersions } from './shared'

async function normalizePromptEndpoint(req: PayloadRequest) {
	if (!isManager(req.user)) {
		return Response.json({ message: 'Forbidden' }, { status: 403 })
	}

	const parsed = imagePromptNormalizationRequestSchema.safeParse(
		req.json ? await req.json().catch(() => null) : null,
	)
	if (!parsed.success) {
		return Response.json(
			{ message: '프롬프트 테이블과 유저 인풋을 확인하세요.' },
			{ status: 400 },
		)
	}

	try {
		return Response.json(await normalizeImageProfilePrompt(parsed.data))
	} catch (error) {
		req.payload.logger.error({ err: error }, 'image-prompt-normalization.failed')
		if (error instanceof ImagePromptNormalizationUnavailableError) {
			return Response.json(
				{ message: 'AI 프롬프트 정규화가 설정되지 않았습니다.' },
				{ status: 503 },
			)
		}
		return Response.json({ message: '프롬프트 정규화에 실패했습니다.' }, { status: 500 })
	}
}

export const ImageProfiles: CollectionConfig = {
	slug: 'image-profiles',
	dbName: 'image_profiles',
	access: managerManagedAccess,
	admin: {
		group: '제작 도구',
		useAsTitle: 'name',
		defaultColumns: ['name', 'slug', 'displayOrder', '_status', 'updatedAt'],
		description: '이미지 유형별 시스템 프롬프트와 유저 프롬프트 후보를 관리하고 테스트합니다.',
	},
	defaultSort: 'displayOrder',
	labels: {
		singular: '이미지 프로파일',
		plural: '이미지 프로파일',
	},
	versions: draftVersions,
	endpoints: [
		{
			path: '/normalize',
			method: 'post',
			handler: normalizePromptEndpoint,
		},
	],
	fields: [
		{
			name: 'name',
			type: 'text',
			required: true,
			label: '프로파일 이름',
		},
		slugField({
			useAsSlug: 'name',
			required: true,
		}),
		{
			name: 'displayOrder',
			type: 'number',
			required: true,
			defaultValue: 0,
			min: 0,
			admin: {
				position: 'sidebar',
				description: '숫자가 낮을수록 Studio 내비게이션에서 먼저 표시됩니다.',
			},
		},
		{
			name: 'profilePrompt',
			type: 'array',
			dbName: 'img_profile_prompt',
			required: true,
			minRows: 1,
			label: '시스템 프롬프트',
			labels: { singular: '프롬프트 필드', plural: '프롬프트 필드' },
			validate: validateImageProfilePromptRows,
			admin: {
				initCollapsed: false,
				description:
					'이미지 유형의 기본값입니다. 각 행은 최종 JSON의 주제와 프롬프트가 됩니다.',
			},
			fields: [
				{ name: 'key', type: 'text', required: true, label: '주제' },
				{ name: 'value', type: 'textarea', required: true, label: '프롬프트' },
			],
		},
		{
			name: 'userPromptNormalization',
			type: 'array',
			dbName: 'img_prompt_norm',
			required: true,
			minRows: 1,
			label: '유저 프롬프트',
			labels: { singular: '유저 프롬프트', plural: '유저 프롬프트' },
			validate: validateImagePromptNormalizationRows,
			admin: {
				initCollapsed: false,
				description:
					'AI가 유저 인풋을 각 주제의 프롬프트 후보 중 하나로 정규화합니다. 시스템 프롬프트와 같은 주제면 이 프롬프트가 우선합니다.',
			},
			fields: [
				{ name: 'key', type: 'text', required: true, label: '주제' },
				{
					name: 'candidates',
					type: 'array',
					dbName: 'img_prompt_choices',
					required: true,
					minRows: 1,
					label: '프롬프트 후보',
					labels: { singular: '프롬프트 후보', plural: '프롬프트 후보' },
					fields: [
						{ name: 'value', type: 'textarea', required: true, label: '프롬프트' },
					],
				},
			],
		},
		{
			name: 'generationTest',
			type: 'ui',
			admin: {
				components: {
					Field: '/features/image-generation/components/image-profile-test-panel',
				},
			},
		},
	],
}
