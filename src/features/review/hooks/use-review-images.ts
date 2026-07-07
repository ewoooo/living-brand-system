'use client'

import { use } from 'react'
import { ReviewImageContext } from '@/features/review/components/review-image-provider'

export function useReviewImages() {
	const context = use(ReviewImageContext)
	if (!context) {
		throw new Error('useReviewImages must be used within ReviewImageProvider')
	}
	return context
}
