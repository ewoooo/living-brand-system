'use client'

import { createContext, use } from 'react'
import type { ReviewImageContextValue } from '@/features/review/types'

export const ReviewImageContext = createContext<ReviewImageContextValue | null>(null)

export function useReviewImages() {
	const context = use(ReviewImageContext)
	if (!context) {
		throw new Error('useReviewImages must be used within ReviewImageProvider')
	}
	return context
}
