import { cache } from 'react'
import { getContrastingForeground, isValidHex } from '@/lib/color'
import { findGuidelineMetadataGlobal } from '../repositories/guideline-view.payload.repository'

export interface GetGuidelineMetadataOutput {
	companyName: string
	documentTitle: string
	faviconHref: string | null
	issuedLabel: string | null
	primaryDarkForegroundHex: string | null
	primaryDarkHex: string | null
	primaryForegroundHex: string | null
	primaryHex: string | null
}

/**
 * Creator UI는 발행된 가이드라인의 문서 메타데이터만 읽는다.
 * 표지, 내비게이션 제목, 푸터 문구는 이 값을 기준으로 조합한다.
 * Payload 조회는 guideline-view repository가 소유한다.
 */
export const getGuidelineMetadata = cache(async (): Promise<GetGuidelineMetadataOutput> => {
	const guideline = await findGuidelineMetadataGlobal()
	const primaryHex = getColorHex(guideline.primaryColor)
	const primaryDarkHex = getColorHex(guideline.primaryColorDark) ?? primaryHex

	return {
		companyName: guideline.companyName,
		documentTitle: guideline.documentTitle,
		faviconHref: getUploadUrl(guideline.favicon),
		issuedLabel: guideline.issuedLabel || null,
		primaryDarkForegroundHex: primaryDarkHex ? getContrastingForeground(primaryDarkHex) : null,
		primaryDarkHex,
		primaryForegroundHex: primaryHex ? getContrastingForeground(primaryHex) : null,
		primaryHex,
	}
})

function getColorHex(value: unknown): string | null {
	if (!value || typeof value !== 'object' || !('hex' in value) || typeof value.hex !== 'string') {
		return null
	}

	return isValidHex(value.hex) ? (value.hex.startsWith('#') ? value.hex : `#${value.hex}`) : null
}

function getUploadUrl(value: unknown): string | null {
	if (!value || typeof value !== 'object' || !('url' in value)) {
		return null
	}

	return typeof value.url === 'string' ? value.url : null
}
