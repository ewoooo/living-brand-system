'use client'

import { useFormFields } from '@payloadcms/ui'
import { getDataByPath } from 'payload/shared'
import { getImageRuntimeManifest } from '@/features/image-generation/domain/image-runtime-manifest'
import { deriveImageProfileController } from '@/features/image-generation/domain/image-studio-config'
import {
	DEFAULT_IMAGE_MODEL_PRESET,
	type ImageModelPreset,
} from '@/features/image-generation/image-model'
import { getTemplateRuntimeManifest } from '@/features/template-customization/domain/template-studio-config'
import type { StudioRuntimeManifest } from '@/modules/studio-controller/controller-definition'
import type { TemplateNodeConfigMap } from '@/types/template'

export type StudioAdminRuntimeSource = 'graphic' | 'image' | 'template'

export type StudioAdminBaseConfig = StudioRuntimeManifest & { id: string }

/** 현재 Admin form 값에서 Controller와 output이 함께 소비할 Base Runtime Manifest를 만든다. */
export function useStudioRuntimeManifest(
	source: StudioAdminRuntimeSource,
	baseConfigs: readonly StudioAdminBaseConfig[],
): StudioRuntimeManifest | null {
	const runtime = useFormFields(([fields]) => fields.runtime?.value) as string | undefined
	const imageModelPreset =
		(useFormFields(([fields]) => fields.imageModelPreset?.value) as
			| ImageModelPreset
			| undefined) ?? DEFAULT_IMAGE_MODEL_PRESET
	const imageFeatures = useFormFields(([fields]) => getDataByPath(fields, 'features'))
	const html = (useFormFields(([fields]) => fields.html?.value) as string | undefined) ?? ''
	const nodeConfigs = (useFormFields(([fields]) => fields.overrides?.value) ??
		{}) as TemplateNodeConfigMap

	if (source === 'graphic') {
		return baseConfigs.find((config) => config.id === runtime) ?? null
	}
	if (source === 'image') {
		return {
			...getImageRuntimeManifest(imageModelPreset),
			controller: deriveImageProfileController(imageModelPreset, imageFeatures, undefined),
		}
	}
	return getTemplateRuntimeManifest({ html, nodeConfigs })
}
