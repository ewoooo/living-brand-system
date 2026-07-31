'use client'

import { revokeBlob } from '@/lib/object-url'
import { MAX_PRINT_PNG_BYTES } from '../print-policy'

/** 서버 TIFF 변환이 사용자 조치가 가능한 상태로 실패했음을 UI에 전달한다. */
export class TemplateTiffDownloadError extends Error {}

/**
 * 브라우저 PNG를 서버의 템플릿 인쇄 정책으로 변환해 TIFF 파일로 내려받는 client use case.
 * PNG 렌더링은 상위 export use case가, HTTP·브라우저 다운로드 I/O는 이 adapter가 소유한다.
 */
export async function downloadTemplateTiff({
	fileName,
	png,
	templateId,
	templateVersion,
}: {
	fileName: string
	png: Blob
	templateId: number
	templateVersion: string
}): Promise<void> {
	if (png.size > MAX_PRINT_PNG_BYTES) {
		throw new TemplateTiffDownloadError(
			'렌더된 PNG가 20MB를 초과합니다. 더 작은 템플릿을 사용해 주세요.',
		)
	}

	const form = new FormData()
	form.set('templateId', String(templateId))
	form.set('templateVersion', templateVersion)
	form.set('image', png, `${fileName}.png`)

	const response = await fetch('/api/templates/export-tiff', {
		body: form,
		method: 'POST',
	})
	if (response.status === 409) {
		throw new TemplateTiffDownloadError(
			'템플릿이 변경되었습니다. 화면을 새로고침한 뒤 다시 시도해 주세요.',
		)
	}
	if (response.status === 429) {
		throw new TemplateTiffDownloadError(
			'TIFF 내보내기 요청이 많습니다. 잠시 후 다시 시도해 주세요.',
		)
	}
	if (!response.ok) {
		throw new TemplateTiffDownloadError(
			'TIFF 내보내기에 실패했습니다. 잠시 후 다시 시도해 주세요.',
		)
	}

	const url = URL.createObjectURL(await response.blob())
	try {
		const link = document.createElement('a')
		link.href = url
		link.download = `${fileName}.tiff`
		link.click()
	} finally {
		revokeBlob(url)
	}
}
