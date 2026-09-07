// 이 파일은 scripts/generate-guideline-block-catalogs.ts로 생성됩니다. 직접 수정하지 마세요.

import type { Block } from 'payload'
import SectionSchema from '../blocks/section/schema'
import type { GuidelineBlock } from '../blocks/types'

type SchemaMap = {
	[Type in GuidelineBlock['blockType']]: Block
}

export const guidelineBlockSchemas = {
	section: SectionSchema,
} satisfies SchemaMap

export const guidelineBlocks = Object.values(guidelineBlockSchemas)
