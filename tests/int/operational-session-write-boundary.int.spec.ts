import type { CollectionConfig } from 'payload'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AgentChatSessions } from '@/collections/AgentChatSessions'
import { CheckSessions } from '@/collections/CheckSessions'
import { createAgentChatSessionRecord } from '@/features/agent-chat/repositories/agent-chat-session.payload.repository'
import {
	createCheckSessionRecord,
	getCheckSessionRecord,
} from '@/features/asset-check/repositories/check-session.payload.repository'
import type { User } from '@/payload-types'

const mocks = vi.hoisted(() => ({
	create: vi.fn(),
	find: vi.fn(),
	getPayload: vi.fn(),
}))

vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('payload', () => ({ getPayload: mocks.getPayload }))

const user = { id: 7 } as User

function createAccess(config: CollectionConfig) {
	const access = config.access?.create
	if (typeof access !== 'function') throw new Error(`${config.slug} create access가 없습니다.`)
	return access
}

describe('operational session write boundary', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		mocks.getPayload.mockResolvedValue({ create: mocks.create, find: mocks.find })
		mocks.create.mockResolvedValue({
			id: 41,
			status: 'running',
			pendingCheckKeys: [],
		})
	})

	it.each([
		CheckSessions,
		AgentChatSessions,
	])('$slug direct create를 모든 사용자에게 닫는다', (config) => {
		const access = createAccess(config)

		expect(access({ req: { user: { id: 1, role: 'worker' } } } as never)).toBe(false)
		expect(access({ req: { user: { id: 2, role: 'admin' } } } as never)).toBe(false)
	})

	it('CheckSession은 서버가 고정한 값으로 trusted create한다', async () => {
		await createCheckSessionRecord({
			source: 'review-page',
			inputSnapshot: {
				sha256: 'a'.repeat(64),
				mediaType: 'image/png',
				byteLength: 8,
			},
			user,
		})

		expect(mocks.create).toHaveBeenCalledWith({
			collection: 'check-sessions',
			data: expect.objectContaining({
				createdBy: 7,
				status: 'running',
				inputSha256: 'a'.repeat(64),
				inputMediaType: 'image/png',
				inputByteLength: 8,
			}),
			overrideAccess: true,
			user,
		})
	})

	it('CheckSession 조회는 id와 createdBy를 함께 제한하고 없으면 null을 반환한다', async () => {
		mocks.find.mockResolvedValue({ docs: [] })

		await expect(getCheckSessionRecord(41, user)).resolves.toBeNull()
		expect(mocks.find).toHaveBeenCalledWith({
			collection: 'check-sessions',
			limit: 1,
			overrideAccess: true,
			user,
			where: {
				and: [{ id: { equals: 41 } }, { createdBy: { equals: 7 } }],
			},
		})
	})

	it('AgentChatSession은 서버가 고정한 값으로 trusted create한다', async () => {
		await createAgentChatSessionRecord({ status: 'running', user })

		expect(mocks.create).toHaveBeenCalledWith({
			collection: 'agent-chat-sessions',
			data: expect.objectContaining({ createdBy: 7, status: 'running' }),
			overrideAccess: true,
			user,
		})
	})
})
