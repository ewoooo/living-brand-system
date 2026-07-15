import config from '@payload-config'
import { getPayload } from 'payload'
import type { CheckScenario } from '@/features/asset-check/scenarios'
import type { User } from '@/payload-types'

/** published이며 archived가 아닌 CheckScenario를 Payload에서 읽는다. */
export async function findPublishedCheckScenarios(user?: User): Promise<CheckScenario[]> {
	const payload = await getPayload({ config })
	const result = await payload.find({
		collection: 'check-scenarios',
		depth: 0,
		draft: false,
		limit: 200,
		overrideAccess: !user,
		pagination: false,
		sort: 'createdAt',
		...(user ? { user } : {}),
		where: { archived: { not_equals: true } },
	})

	return result.docs.map((scenario) => ({
		key: scenario.key,
		title: scenario.title,
		checkKeys: Array.isArray(scenario.checkKeys)
			? scenario.checkKeys.filter((key): key is string => typeof key === 'string')
			: [],
	}))
}
