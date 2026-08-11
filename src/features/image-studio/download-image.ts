/**
 * 생성 이미지 URL 또는 data URI를 파일로 저장한다 — 브라우저 앵커 클릭만 쓰는 DOM 유틸이고
 * 네트워크 I/O가 없다(이미지는 이미 브라우저가 들고 있다). 색을 굽는 저장은 후속 단계다.
 */
export function downloadImage(src: string, index: number) {
	const ext = src.startsWith('data:image/')
		? src.slice(11, src.indexOf(';')).replace('jpeg', 'jpg')
		: new URL(src, window.location.href).pathname.split('.').pop() || 'png'
	const anchor = document.createElement('a')
	anchor.href = src
	anchor.download = `essenherb-image-${index + 1}.${ext}`
	document.body.appendChild(anchor)
	anchor.click()
	anchor.remove()
}
