'use client'

import { useContext } from 'react'
import { TemplateStudioContext } from '@/features/template-customization/contexts/template-studio-context'

export type {
	TemplateBackgroundPatch,
	TemplateBackgroundState,
	TemplateImageSlotPatch,
	TemplateImageSlotState,
} from '@/features/template-customization/contexts/template-studio-context'

export function useTemplateStudio() {
	const context = useContext(TemplateStudioContext)
	if (!context) {
		throw new Error('useTemplateStudio는 TemplateStudioProvider 안에서만 호출할 수 있습니다.')
	}
	return context
}
