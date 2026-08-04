import { type CollectionConfig, type PayloadRequest, slugField } from 'payload'
import {
	DEFAULT_IMAGE_MODEL_PRESET,
	IMAGE_MODEL_PRESET_OPTIONS,
	type ImageModelPreset,
} from '@/features/generate-image/image-model'
import {
	imagePromptNormalizationRequestSchema,
	validateImageProfilePromptRows,
	validateImagePromptNormalizationRows,
} from '@/features/generate-image/image-profile-prompt'
import {
	IMAGE_ASPECT_RATIO_OPTIONS,
	IMAGE_OUTPUT_SIZE_OPTIONS,
	type ImageOutputSize,
	supportsImageOutputSize,
} from '@/features/generate-image/image-size'
import {
	ImageGenerationUnavailableError,
	normalizeImageProfilePrompt,
} from '@/features/generate-image/services/normalize-image-profile-prompt.service'
import { isManager, managerManagedAccess } from '@/lib/auth'
import { draftVersions } from './shared'

function validateImageSize(
	value: null | string | undefined,
	{ siblingData }: { siblingData: Record<string, unknown> },
): string | true {
	if (!value) return true
	return (
		supportsImageOutputSize(
			siblingData.imageModelPreset as ImageModelPreset,
			value as ImageOutputSize,
		) || 'Nano Banana 2 Lite는 1K 출력만 지원합니다.'
	)
}

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
		if (error instanceof ImageGenerationUnavailableError) {
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
			name: 'imageModelPreset',
			type: 'select',
			required: true,
			defaultValue: DEFAULT_IMAGE_MODEL_PRESET,
			options: [...IMAGE_MODEL_PRESET_OPTIONS],
			label: '이미지 모델',
			admin: {
				position: 'sidebar',
				description: '이 프로파일을 생성할 때 사용할 이미지 모델입니다.',
			},
		},
		{
			name: 'aspectRatio',
			type: 'select',
			required: true,
			defaultValue: '2:3',
			options: [...IMAGE_ASPECT_RATIO_OPTIONS],
			label: '출력 비율',
			admin: {
				position: 'sidebar',
				description: '이미지 공급자와 무관한 가로:세로 비율입니다.',
			},
		},
		{
			name: 'imageSize',
			type: 'select',
			required: true,
			defaultValue: '1K',
			options: [...IMAGE_OUTPUT_SIZE_OPTIONS],
			label: '출력 해상도',
			validate: validateImageSize,
			admin: {
				position: 'sidebar',
				description: 'Nano Banana 2 Lite는 1K만 지원합니다.',
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
			label: '유저 프롬프트',
			labels: { singular: '유저 프롬프트', plural: '유저 프롬프트' },
			validate: validateImagePromptNormalizationRows,
			admin: {
				initCollapsed: false,
				description:
					'선택사항입니다. 행이 있으면 AI가 후보 중 하나로 정규화하고 유저 인풋 원문은 최종 프롬프트에서 제외합니다. 비어 있으면 원문을 subject로 사용합니다.',
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
					Field: '/components/admin/image-profile/image-profile-test-panel',
				},
			},
		},
	],
}
