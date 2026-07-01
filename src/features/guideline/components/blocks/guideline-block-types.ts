import type { ComponentType } from 'react'
import type { GuidelinePage } from '@/payload-types'

export type GuidelineBlock = NonNullable<GuidelinePage['blocks']>[number]

export type GuidelineBlockRegistry = {
	[K in GuidelineBlock['blockType']]: ComponentType<{
		block: Extract<GuidelineBlock, { blockType: K }>
	}>
}
