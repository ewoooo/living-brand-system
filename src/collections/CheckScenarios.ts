import type {
	CollectionBeforeChangeHook,
	CollectionConfig,
	FieldHook,
	JSONFieldValidation,
	PayloadRequest,
	TextFieldValidation,
} from 'payload'
import { findPublishedScenarioCheckRecords } from '@/features/asset-check/repositories/available-scenario-check.payload.repository'
import {
	listAvailableScenarioChecks,
	validateCheckScenarioKey,
	validateCheckScenarioKeys as validateCheckScenarioKeysUseCase,
} from '@/features/asset-check/services/list-available-scenario-checks.service'
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

const validateScenarioKey: TextFieldValidation = validateCheckScenarioKey

export const validateCheckScenarioKeys: JSONFieldValidation = async (value, { req }) => {
	return validateCheckScenarioKeysUseCase(value, () => findPublishedScenarioCheckRecords(req))
}

async function availableChecksEndpoint(req: PayloadRequest) {
	if (!isManager(req.user)) {
		return Response.json({ message: 'Forbidden' }, { status: 403 })
	}

	return Response.json({
		docs: await listAvailableScenarioChecks(() => findPublishedScenarioCheckRecords(req)),
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
