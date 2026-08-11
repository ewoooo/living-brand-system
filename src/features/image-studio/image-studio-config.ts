import {
	IMAGE_BATCH_DEFAULT,
	IMAGE_BATCH_SIZES,
	IMAGE_PROMPT_MAX_LENGTH,
} from '@/features/generate-image/image-generation-limits'
import {
	IMAGE_ASPECT_RATIOS,
	IMAGE_OUTPUT_SIZES,
	type ImageAspectRatio,
	type ImageOutputSize,
	supportsImageOutputSize,
} from '@/features/generate-image/image-size'
import type { PublishedImageProfileDefinition } from '@/features/generate-image/repositories/image-profile.payload.repository'

/**
 * 이미지 프로파일 하나가 스튜디오에 내는 편집 계약 — 무엇을 조작할 수 있고(개방), 어떤
 * 선택지 안에서인가(레인지), 시작값은 무엇인가. published 프로파일에서 파생되는 읽기 전용
 * 객체이고 저작 상태의 정본이 아니다(정본: image-profiles 컬렉션, 값 상한: 생성 라우트,
 * 세션 값: ImageStudioProvider). 외부 I/O 없음 — 순수 투영.
 *
 * 프로파일마다 하나씩 존재하고, 사용자가 프로파일을 교체하면 Provider가 다른 계약을 고른다
 * (템플릿과 달리 화면 수명 동안 고정이 아니다).
 */
export type ImageStudioConfig = {
	/** 생성·카메라 조정 요청이 이 id로 나간다. */
	profileId: number
	/** 계약 형태 버전 — 어드민 저장·에이전트 노출로 진화할 때의 앵커. */
	version: 1
	name: string
	slug: string | null
	prompt: { maxLength: number }
	generateOptions: {
		batch: ImageStudioChoice<number>
		ratio: ImageStudioChoice<ImageAspectRatio>
		resolution: ImageStudioChoice<ImageOutputSize>
	}
	/** 선택한 생성 이미지를 시드로 시점을 다시 잡을 수 있는가. */
	supportsCameraControl: boolean
}

/**
 * 선택지와 시작값 — 선택지가 하나뿐이면 읽기 전용으로 파생한다(잠금 플래그를 따로 두지 않는다,
 * docs/10 §3.6).
 */
export type ImageStudioChoice<Value> = {
	options: readonly Value[]
	defaultValue: Value
}

/**
 * published 프로파일에서 편집 계약을 파생한다 — 어드민이 계약을 직접 저장하게 되면 이 함수가 그 폴백이 된다.
 * 프로파일에 개방·상한 필드가 아직 없으므로, 지금은 전역 상한과 모델 제약만이 레인지의 원천이다.
 */
export function deriveImageStudioConfig(
	profile: PublishedImageProfileDefinition,
): ImageStudioConfig {
	return {
		profileId: profile.id,
		version: 1,
		name: profile.name,
		slug: profile.slug,
		// 어드민이 프로파일별 상한을 정하는 필드가 생기기 전까지는 전역 상한이 그대로 상한이다.
		prompt: { maxLength: IMAGE_PROMPT_MAX_LENGTH },
		generateOptions: {
			batch: { options: IMAGE_BATCH_SIZES, defaultValue: IMAGE_BATCH_DEFAULT },
			ratio: { options: IMAGE_ASPECT_RATIOS, defaultValue: profile.aspectRatio },
			// 해상도 레인지는 모델 능력에서 파생한다 — Nano Banana 2 Lite는 1K뿐이라 읽기 전용이 된다.
			resolution: {
				options: IMAGE_OUTPUT_SIZES.filter((size) =>
					supportsImageOutputSize(profile.imageModelPreset, size),
				),
				defaultValue: profile.imageSize,
			},
		},
		// 어드민이 카메라 개방을 좁히는 필드가 생기기 전까지는 전 프로파일이 시점 조정을 연다.
		supportsCameraControl: true,
	}
}
