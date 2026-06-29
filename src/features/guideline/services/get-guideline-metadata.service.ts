import config from '@payload-config'
import { getPayload } from 'payload'

export interface GetGuidelineMetadataOutput {
	companyName: string
	documentTitle: string
	issuedLabel: string | null
}

/**
 * Creator UI는 발행된 가이드라인의 문서 메타데이터만 읽는다.
 * 표지, 내비게이션 제목, 푸터 문구는 이 값을 기준으로 조합한다.
 */
export async function getGuidelineMetadata(): Promise<GetGuidelineMetadataOutput> {
	try {
		const payload = await getPayload({ config })
		const guideline = await payload.findGlobal({
			slug: 'guideline',
			depth: 0,
			locale: 'ko',
			fallbackLocale: 'en',
			draft: false,
			select: {
				companyName: true,
				documentTitle: true,
				issuedLabel: true,
			},
		})

		return {
			companyName: guideline.companyName,
			documentTitle: guideline.documentTitle,
			issuedLabel: guideline.issuedLabel || null,
		}
	} catch {
		return {
			companyName: 'Unconfigured Company',
			documentTitle: 'Untitled Guideline',
			issuedLabel: null,
		}
	}
}
