'use client'

import { useContext } from 'react'
import { GraphicStudioContext } from '@/features/graphic-generation/contexts/graphic-studio-context'

export function useGraphicStudio() {
	const context = useContext(GraphicStudioContext)
	if (!context) {
		throw new Error('useGraphicStudio는 GraphicStudioProvider 안에서만 호출할 수 있습니다.')
	}
	return context
}
