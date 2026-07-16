import type {
	CollectionBeforeChangeHook,
	CollectionConfig,
	FieldHook,
	JSONFieldValidation,
	Payload,
	PayloadRequest,
	TextFieldValidation,
} from 'payload'
import { collectGuidelineCheckSources } from '@/features/guideline/checks/collect-guideline-check-sources'
import { findPublishedUnifiedGuidelineCheckDocuments } from '@/features/guideline/repositories/published-guideline-checks.payload.repository'
import { authenticated, isManager, managerOrAdmin } from '@/lib/auth'
import { draftVersions } from './shared'

const preserveScenarioKey: FieldHook = ({ operation, originalDoc, value }) => {
	if (operation === 'update') return originalDoc?.key
	return typeof value === 'string' ? value.trim() : value
}

const markPublished: CollectionBeforeChangeHook = ({ data, originalDoc }) => {
	if (originalDoc?.hasBeenPublished || data._status === 'published') {
		data.hasBeenPublished = true
	}
	return data
}

const validateScenarioKey: TextFieldValidation = (value) =>
	(typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) ||
	'Key는 영문 소문자, 숫자, 하이픈만 사용할 수 있습니다.'

async function getAvailableChecks(payload: Payload, user: unknown, overrideAccess: boolean) {
	const { documents } = await findPublishedUnifiedGuidelineCheckDocuments(payload, {
		overrideAccess,
		user,
	})
	const byKey = new Map<
		string,
		{
			blockName: string
			key: string
			title: string
			documentTitle: string
			executor?: 'deterministic' | 'heuristic' | 'manual'
		}
	>()

	for (const document of documents) {
		for (const { blockName, check } of collectGuidelineCheckSources(document)) {
			const checker = typeof check.checker === 'object' ? check.checker : null
			byKey.set(check.key, {
				blockName: blockName ?? '문서',
				key: check.key,
				title: check.titleKo?.trim() || check.title,
				documentTitle: document.title,
				executor: checker?.executor,
			})
		}
	}

	return [...byKey.values()].sort(
		(a, b) =>
			a.documentTitle.localeCompare(b.documentTitle, 'ko') ||
			a.blockName.localeCompare(b.blockName, 'ko') ||
			a.title.localeCompare(b.title, 'ko'),
	)
}

export const validateCheckScenarioKeys: JSONFieldValidation = async (value, { req }) => {
	if (!Array.isArray(value) || value.length === 0) return 'Check를 1개 이상 포함하세요.'
	if (value.some((key) => typeof key !== 'string' || !key.trim())) {
		return 'Check key는 비어 있지 않은 문자열이어야 합니다.'
	}

	const checkKeys = value as string[]
	if (new Set(checkKeys).size !== checkKeys.length) return '중복된 Check가 있습니다.'

	const available = await getAvailableChecks(req.payload, req.user, !req.user)
	const availableKeys = new Set(available.map(({ key }) => key))
	const missing = checkKeys.filter((key) => !availableKeys.has(key))
	return missing.length > 0 ? `발행된 Guideline에 없는 Check입니다: ${missing.join(', ')}` : true
}

async function availableChecksEndpoint(req: PayloadRequest) {
	if (!isManager(req.user)) {
		return Response.json({ message: 'Forbidden' }, { status: 403 })
	}

	return Response.json({
		docs: await getAvailableChecks(req.payload, req.user, false),
	})
}

export const CheckScenarios: CollectionConfig = {
	slug: 'check-scenarios',
	dbName: 'check_scenarios',
	access: {
		read: authenticated,
		create: managerOrAdmin,
		update: managerOrAdmin,
		delete: ({ req }) =>
			isManager(req.user) ? { hasBeenPublished: { equals: false } } : false,
	},
	admin: {
		group: '검수 설정',
		useAsTitle: 'title',
		defaultColumns: ['title', 'key', 'archived', '_status', 'updatedAt'],
		description: '검수 목적에 맞게 실행할 Check를 조립하고 발행합니다.',
	},
	labels: {
		singular: '검수 시나리오',
		plural: '검수 시나리오',
	},
	versions: draftVersions,
	hooks: {
		beforeChange: [markPublished],
	},
	endpoints: [
		{
			path: '/available-checks',
			method: 'get',
			handler: availableChecksEndpoint,
		},
	],
	fields: [
		{
			name: 'title',
			type: 'text',
			required: true,
			localized: true,
			label: '이름',
		},
		{
			name: 'description',
			type: 'textarea',
			localized: true,
			label: '설명',
		},
		{
			name: 'key',
			type: 'text',
			required: true,
			unique: true,
			index: true,
			validate: validateScenarioKey,
			hooks: { beforeValidate: [preserveScenarioKey] },
			admin: {
				description: '최초 저장 후 변경되지 않는 CheckScenario 식별자입니다.',
			},
		},
		{
			name: 'checkKeys',
			type: 'json',
			required: true,
			validate: validateCheckScenarioKeys,
			admin: {
				components: { Field: '/components/admin/CheckScenarioChecksField' },
				description: '발행된 Guideline Check 중 이 시나리오에서 실행할 항목입니다.',
			},
		},
		{
			name: 'archived',
			type: 'checkbox',
			defaultValue: false,
			label: '보관됨',
			admin: {
				position: 'sidebar',
				description: '발행된 시나리오를 신규 검수 대상에서 제외할 때 사용합니다.',
			},
		},
		{
			name: 'hasBeenPublished',
			type: 'checkbox',
			required: true,
			defaultValue: false,
			admin: { hidden: true },
		},
	],
}
