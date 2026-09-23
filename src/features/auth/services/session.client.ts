/**
 * 로그인·로그아웃 브라우저 fetch. 화면 문구와 이동은 호출자(훅)가 소유한다.
 *
 * 🔑 로그인은 앱 라우트(`/api/auth/login`)를 거친다 — 실패 이유를 하나로 덮는 자리가 거기다.
 *    로그아웃은 덮을 것이 없어 Payload의 세션 종료 엔드포인트를 그대로 부른다.
 */

export type LoginResult = { status: 'ok' } | { status: 'rejected' } | { status: 'error' }

export async function requestLogin(email: string, password: string): Promise<LoginResult> {
	const response = await fetch('/api/auth/login', {
		body: JSON.stringify({ email, password }),
		headers: { 'Content-Type': 'application/json' },
		method: 'POST',
	}).catch(() => null)

	if (response?.ok) return { status: 'ok' }
	// 401은 「자격 증명이 틀렸다」이고 그 밖은 「지금 처리하지 못했다」다 — 사용자가 할 일이 다르다.
	if (response?.status === 401) return { status: 'rejected' }
	return { status: 'error' }
}

export async function requestLogout(): Promise<boolean> {
	const response = await fetch('/api/users/logout', { method: 'POST' }).catch(() => null)
	// 🔴 세션이 이미 없으면 Payload가 400 'No User'를 준다. 그것은 실패가 아니라 **이미 끝난
	//    상태**다 — 에러로 다루면 다시 눌러도 영영 400이라 사용자가 문구에 갇힌다.
	return Boolean(response && (response.ok || response.status === 400))
}
