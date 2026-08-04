import {
	type FlatImagePrompt,
	type ImageProfilePromptRow,
	type ImagePromptNormalizationRow,
	mergeImageProfilePrompt,
} from '@/features/generate-image/image-profile-prompt'
import { normalizeImagePromptWithAi } from '@/features/generate-image/repositories/image-prompt-normalization.ai.repository'

/** Provider·정규화 모델 미설정을 route/agent 표면이 일반 생성 실패와 구분하기 위한 서비스 오류. */
export class ImageGenerationUnavailableError extends Error {
	constructor() {
		super('Image generation is not configured.')
		this.name = 'ImageGenerationUnavailableError'
	}
}

/**
 * 유스케이스 경계: 임의 사용자 프롬프트를 관리자가 정한 후보로 정규화하고 flat JSON을 만든다.
 * 모델 호출 I/O는 image-prompt-normalization AI repository가 소유한다.
 */
export async function normalizeImageProfilePrompt({
	profilePrompt,
	userPromptNormalization,
	userPrompt,
}: {
	profilePrompt: ImageProfilePromptRow[]
	userPromptNormalization: ImagePromptNormalizationRow[]
	userPrompt: string
}): Promise<{ finalPrompt: FlatImagePrompt; normalizedInput: FlatImagePrompt }> {
	const normalizedInput =
		userPromptNormalization.length === 0
			? {}
			: await normalizeImagePromptWithAi(userPrompt, userPromptNormalization)
	if (!normalizedInput) throw new ImageGenerationUnavailableError()

	return {
		normalizedInput,
		finalPrompt: mergeImageProfilePrompt(
			profilePrompt,
			normalizedInput,
			userPromptNormalization.length === 0 ? userPrompt : undefined,
		),
	}
}
