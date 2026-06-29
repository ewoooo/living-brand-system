import config from '@payload-config'
import { getPayload } from 'payload'

// top-level await: payload run이 async 완료 전에 종료하지 않도록 한다.
const payload = await getPayload({ config })

const all = await payload.count({ collection: 'rules', overrideAccess: true })
const color = await payload.count({
	collection: 'rules',
	where: { category: { equals: 'color' } },
	overrideAccess: true,
})

console.log(`VERIFY_RULES_TOTAL=${all.totalDocs}`)
console.log(`VERIFY_RULES_COLOR=${color.totalDocs}`)

process.exit(0)
