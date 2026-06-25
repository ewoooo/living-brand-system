import config from '@payload-config'
import { getPayload } from 'payload'

/**
 * 부트스트랩 1회용: 기존 사용자(들)의 role을 admin으로 설정한다.
 * role 필드 추가 후 기존 row는 값이 비어 access에서 막히므로, overrideAccess로 승격해 락아웃을 방지한다.
 * saveToJWT라 적용 후 재로그인해야 토큰에 새 role이 반영된다.
 */

const payload = await getPayload({ config })

const { docs } = await payload.find({
	collection: 'users',
	limit: 1000,
	overrideAccess: true,
})

let updated = 0
for (const user of docs) {
	await payload.update({
		collection: 'users',
		id: user.id,
		data: { role: 'admin' },
		overrideAccess: true,
	})
	updated += 1
}

payload.logger.info(`Granted admin to ${updated} user(s)`)

process.exit(0)
