// 텍스트박스 하나를 채울 용도의 클라이언트 헬퍼 — /api/text로 후보 1개를 받아 그대로 돌려준다.
// 슬롯 채우기(Create)가 쓴다. 실패하면 null.
export async function generateOneText(prompt: string): Promise<string | null> {
	try {
		const res = await fetch('/api/text', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ prompt, count: 1 }),
		})
		if (!res.ok) return null
		const data = (await res.json()) as { texts?: string[] }
		return data.texts?.[0] ?? null
	} catch {
		return null
	}
}
