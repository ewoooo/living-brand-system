import type React from 'react'
import { CheckImageProvider } from '@/features/asset-check/hooks/use-check-images'
import { listPublishedCheckScenarios } from '@/features/quality-rule/services/list-published-check-scenarios.service'

// Review reads Payload collections, so CI builds without migrated tables must not prerender it.
export const dynamic = 'force-dynamic'

export default async function ReviewLayout({ children }: { children: React.ReactNode }) {
	const scenarios = await listPublishedCheckScenarios()

	return <CheckImageProvider scenarios={scenarios}>{children}</CheckImageProvider>
}
