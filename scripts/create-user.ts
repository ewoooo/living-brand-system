import config from '@payload-config'
import { getPayload } from 'payload'

/**
 * users 컬렉션에 계정을 1개 생성한다 (Payload는 셀프 가입 UI가 없어 우회 생성).
 * 비밀번호를 코드/git에 남기지 않도록 email/password는 환경변수로만 받는다.
 * 생성은 admin만 가능(access)이라 seed 경계로 overrideAccess: true를 쓴다.
 *
 * 실행: SEED_EMAIL=you@x.com SEED_PASSWORD='...' pnpm payload run scripts/create-user.ts
 *       (역할 지정: SEED_ROLE=admin|manager|worker, 기본 admin)
 * 주의: payload run은 top-level await가 끝나야 하므로 함수로 감싸지 않는다.
 */

const email = process.env.SEED_EMAIL
const password = process.env.SEED_PASSWORD
const role = (process.env.SEED_ROLE || 'admin') as 'admin' | 'manager' | 'worker'

if (!email || !password) {
	console.error('SEED_EMAIL, SEED_PASSWORD 환경변수가 필요합니다.')
	process.exit(1)
}

const payload = await getPayload({ config })

const existing = await payload.find({
	collection: 'users',
	where: { email: { equals: email } },
	limit: 1,
})

if (existing.docs.length > 0) {
	console.log(`이미 존재하는 계정입니다: ${email}`)
} else {
	await payload.create({
		collection: 'users',
		data: { email, password, role },
		overrideAccess: true,
	})
	console.log(`생성 완료: ${email} (role: ${role})`)
}
