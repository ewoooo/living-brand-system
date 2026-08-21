'use client'

import { useEffect, useState } from 'react'
import { requestPublishedBrandColors } from '@/features/template-core/services/template-editor-options.client'
import type { BrandColor } from '@/payload-types'

export function usePublishedBrandColors() {
	const [colors, setColors] = useState<BrandColor[]>([])
	const [loadError, setLoadError] = useState(false)

	useEffect(() => {
		const controller = new AbortController()
		void requestPublishedBrandColors(controller.signal)
			.then(setColors)
			.catch((error: unknown) => {
				if ((error as { name?: string }).name !== 'AbortError') setLoadError(true)
			})
		return () => controller.abort()
	}, [])

	return { colors, loadError }
}
