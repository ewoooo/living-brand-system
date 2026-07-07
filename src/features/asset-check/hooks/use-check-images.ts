'use client'

import { createContext, use } from 'react'
import type { CheckImageContextValue } from '@/features/asset-check/types'

export const CheckImageContext = createContext<CheckImageContextValue | null>(null)

export function useCheckImages() {
	const context = use(CheckImageContext)
	if (!context) {
		throw new Error('useCheckImages must be used within CheckImageProvider')
	}
	return context
}
