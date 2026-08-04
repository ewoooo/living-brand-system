/**
 * 텍스트 생성 클라이언트 서비스 — 브라우저에서 /api/generate-text 호출의 요청/응답 계약을 소유한다.
 * 생성 실행은 route 뒤의 generate-text service가 담당하고, 화면 상태는 호출자가 담당한다.
 */

// 텍스트박스 하나를 채울 용도의 헬퍼 — 후보 1개를 그대로 돌려준다. 슬롯 채우기(Create)가 쓴다. 실패하면 null.
// rule은 슬롯의 aiInstruction("영문 이름만" 등) — 프롬프트와 별개로 생성 규칙으로 전달된다.
export async function generateOneText(prompt: string, rule?: string): Promise<string | null> {
	try {
		const res = await fetch('/api/generate-text', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ prompt, rule, count: 1 }),
		})
		if (!res.ok) return null
		const data = (await res.json()) as { texts?: string[] }
		return data.texts?.[0] ?? null
	} catch {
		return null
	}
}
