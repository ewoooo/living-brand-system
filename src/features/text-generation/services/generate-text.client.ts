/**
 * 텍스트 생성 클라이언트 서비스 — 브라우저에서 /api/text 호출의 요청/응답 계약을 소유한다.
 * 생성 실행은 route 뒤의 generate-text service가 담당하고, 화면 상태는 호출자가 담당한다.
 */
export interface GenerateTextsInput {
	prompt: string
	rule?: string
	count: number
}

/** 텍스트 후보 목록 생성을 요청한다. 실패하면 status를 담아 throw하고, 호출자가 화면 메시지로 바꾼다. */
export async function generateTexts({
	prompt,
	rule,
	count,
}: GenerateTextsInput): Promise<string[]> {
	const res = await fetch('/api/text', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ prompt, rule, count }),
	})
	if (!res.ok) throw new Error(`생성 실패 (${res.status})`)
	const data = (await res.json()) as { texts?: string[] }
	return data.texts ?? []
}

// 텍스트박스 하나를 채울 용도의 헬퍼 — 후보 1개를 그대로 돌려준다. 슬롯 채우기(Create)가 쓴다. 실패하면 null.
export async function generateOneText(prompt: string): Promise<string | null> {
	try {
		const texts = await generateTexts({ prompt, count: 1 })
		return texts[0] ?? null
	} catch {
		return null
	}
}
