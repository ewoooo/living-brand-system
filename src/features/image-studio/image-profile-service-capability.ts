import {
	IMAGE_BATCH_DEFAULT,
	IMAGE_BATCH_SIZES,
	IMAGE_PROMPT_MAX_LENGTH,
} from '@/features/generate-image/image-generation-limits'
import type { ImageModelPreset } from '@/features/generate-image/image-model'
import {
	IMAGE_ASPECT_RATIOS,
	IMAGE_OUTPUT_SIZES,
	supportsImageOutputSize,
} from '@/features/generate-image/image-size'

export const IMAGE_STUDIO_CONTROL_IDS = {
	prompt: 'prompt',
	batch: 'batch',
	ratio: 'ratio',
	resolution: 'resolution',
	lineColor: 'lineColor',
	backgroundColor: 'backgroundColor',
} as const

/** Image Profile이 발행할 수 있는 값은 실제 생성·후처리 서비스가 이해하는 범위뿐이다. */
export function getImageProfileServiceCapability(modelPreset: ImageModelPreset) {
	return {
		controls: {
			[IMAGE_STUDIO_CONTROL_IDS.prompt]: { kind: 'text' as const },
			[IMAGE_STUDIO_CONTROL_IDS.batch]: {
				kind: 'select' as const,
				options: IMAGE_BATCH_SIZES.map(String),
				defaultValue: String(IMAGE_BATCH_DEFAULT),
			},
			[IMAGE_STUDIO_CONTROL_IDS.ratio]: {
				kind: 'select' as const,
				options: IMAGE_ASPECT_RATIOS,
			},
			[IMAGE_STUDIO_CONTROL_IDS.resolution]: {
				kind: 'select' as const,
				options: IMAGE_OUTPUT_SIZES.filter((size) =>
					supportsImageOutputSize(modelPreset, size),
				),
			},
			[IMAGE_STUDIO_CONTROL_IDS.lineColor]: { kind: 'color' as const },
			[IMAGE_STUDIO_CONTROL_IDS.backgroundColor]: { kind: 'color' as const },
		},
		features: ['color-adjustment', 'camera-control'] as const,
		promptMaxLength: IMAGE_PROMPT_MAX_LENGTH,
		output: {
			formats: ['original', 'png', 'jpeg'] as const,
			colorProfiles: { rgb: ['srgb'] as const },
			packages: ['zip'] as const,
		},
	}
}
