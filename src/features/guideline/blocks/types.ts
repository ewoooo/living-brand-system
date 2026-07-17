import type { GuidelineDocument } from '@/payload-types'

export type GuidelineBlock = NonNullable<GuidelineDocument['blocks']>[number]

export type CheckReferenceAssetRole = 'positive' | 'negative' | 'context'

export interface CheckReferenceAssetRef {
	id: number
	role: CheckReferenceAssetRole
}

/** Agent/Search 텍스트와 Check 근거가 같은 블록 해석 결과를 공유한다. */
export interface BlockProjection<Evidence> {
	text: string
	evidence: Evidence
	referenceAssets: CheckReferenceAssetRef[]
}
