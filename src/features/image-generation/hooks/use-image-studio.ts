'use client'

import { useContext } from 'react'
import { ImageStudioContext } from '@/features/image-generation/providers/image-studio-provider'

export function useImageStudio() {
	const context = useContext(ImageStudioContext)
	if (!context) {
		throw new Error('useImageStudio는 ImageStudioProvider 안에서만 호출할 수 있습니다.')
	}
	return context
}
