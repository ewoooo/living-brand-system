/** blob: object URL만 해제한다. 원격 URL(http 등)은 무시해 잘못된 해제를 막는다. */
export function revokeBlob(url: string | null | undefined): void {
	if (url?.startsWith('blob:')) URL.revokeObjectURL(url)
}

/** Blob을 지정한 파일 이름으로 브라우저 다운로드하고 object URL을 해제한다. */
export function downloadBlob(blob: Blob, filename: string): void {
	const url = URL.createObjectURL(blob)
	try {
		const link = document.createElement('a')
		link.href = url
		link.download = filename
		link.click()
	} finally {
		revokeBlob(url)
	}
}
