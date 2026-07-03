import config from '@payload-config'
import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'

/**
 * 커스텀 라우트 핸들러의 요청 인증 헬퍼 — Payload 세션에서 사용자를 읽는다.
 * 라우트가 Payload Local API 초기화를 직접 알지 않게 인증 경계를 여기로 모은다 (docs/06 §6).
 * lib/auth.ts와 분리한 이유: auth.ts는 collections가 import하므로
 * @payload-config를 넣으면 payload.config와 순환 의존이 생긴다.
 */
export async function authenticateRequest() {
	const payload = await getPayload({ config })
	const { user } = await payload.auth({ headers: await getHeaders() })

	return { payload, user }
}
