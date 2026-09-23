/**
 * 로그인·로그아웃 브라우저 fetch. 화면 문구와 이동은 호출자(훅)가 소유한다.
 *
 * 🔑 로그인은 앱 라우트(`/api/auth/login`)를 거친다 — 실패 이유를 하나로 덮는 자리가 거기다.
 *    로그아웃은 덮을 것이 없어 Payload의 세션 종료 엔드포인트를 그대로 부른다.
 */

/** 지금 로그인한 사람. 헤더가 알아야 하는 것은 「누구인가」뿐이라 이메일 하나만 들고 온다. */
export type SessionUser = { email: string } | null

/**
 * 🔑 헤더는 서버에서 세션을 읽지 못한다 — 루트 레이아웃이 세션을 읽으면 `/`와 `/guideline`의
 *    정적 렌더가 깨지기 때문이다(docs/05). 그래서 브라우저가 직접 묻는다.
 */
export async function requestSession(): Promise<SessionUser> {
	const response = await fetch('/api/users/me').catch(() => null)
	if (!response?.ok) return null

	const body = (await response.json().catch(() => null)) as {
		user?: { email?: string } | null
	} | null
	return body?.user?.email ? { email: body.user.email } : null
}

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
