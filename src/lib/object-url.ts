/** blob: object URL만 해제한다. 원격 URL(http 등)은 무시해 잘못된 해제를 막는다. */
export function revokeBlob(url: string | null | undefined): void {
	if (url?.startsWith('blob:')) URL.revokeObjectURL(url)
}
