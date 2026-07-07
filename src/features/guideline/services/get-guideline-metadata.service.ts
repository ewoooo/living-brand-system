import { cache } from 'react'
import { findGuidelineMetadataGlobal } from '../repositories/guideline-view.payload.repository'

export interface GetGuidelineMetadataOutput {
	companyName: string
	documentTitle: string
	faviconHref: string | null
	issuedLabel: string | null
}

/**
 * Creator UI는 발행된 가이드라인의 문서 메타데이터만 읽는다.
 * 표지, 내비게이션 제목, 푸터 문구는 이 값을 기준으로 조합한다.
 * Payload 조회는 guideline-view repository가 소유한다.
 */
export const getGuidelineMetadata = cache(async (): Promise<GetGuidelineMetadataOutput> => {
	try {
		const guideline = await findGuidelineMetadataGlobal()

		return {
			companyName: guideline.companyName,
			documentTitle: guideline.documentTitle,
			faviconHref: getUploadUrl(guideline.favicon),
			issuedLabel: guideline.issuedLabel || null,
		}
	} catch {
		return {
			companyName: 'Unconfigured Company',
			documentTitle: 'Living Brand System',
			faviconHref: null,
			issuedLabel: null,
		}
	}
})

function getUploadUrl(value: unknown): string | null {
	if (!value || typeof value !== 'object' || !('url' in value)) {
		return null
	}

	return typeof value.url === 'string' ? value.url : null
}
