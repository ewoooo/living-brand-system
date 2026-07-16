/**
 * Figma 가져오기 클라이언트 서비스 — 브라우저에서 /api/templates/import-figma-html 호출의
 * 요청/응답 계약을 소유한다. Figma REST 호출·HTML 변환은 route 뒤의 import-figma-html
 * service가 담당하고, 폼 필드 반영은 호출자(Admin FigmaHtmlImportField)가 담당한다.
 */
import type { FigmaHtmlResult } from '@/features/template-import/utils/figma-node-to-html'

export type ImportFigmaHtmlResult = FigmaHtmlResult & { name: string }

/** Figma URL의 프레임을 HTML로 변환 요청한다. 실패하면 서버 메시지를 담아 throw한다. */
export async function importFigmaHtmlFromUrl(sourceUrl: string): Promise<ImportFigmaHtmlResult> {
	const response = await fetch('/api/templates/import-figma-html', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ sourceUrl }),
	})
	const body = await response.json().catch(() => null)
	if (!response.ok) {
		throw new Error(body?.message || 'Figma 가져오기에 실패했습니다.')
	}
	return body as ImportFigmaHtmlResult
}
