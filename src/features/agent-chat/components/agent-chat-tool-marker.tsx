import type { ReactNode } from 'react'
import { Marker, MarkerContent, MarkerIcon } from '@/components/ui/marker'
import type { AgentToolMarker } from '@/features/agent-chat/utils/get-agent-tool-marker'

export function AgentChatMarker({
	marker,
	icon,
	isPending = marker?.isPending,
}: {
	marker: AgentToolMarker | null
	icon: ReactNode
	isPending?: boolean
}) {
	if (!marker) {
		return null
	}

	return (
		<Marker>
			<MarkerIcon>{icon}</MarkerIcon>
			<MarkerContent className={isPending ? 'shimmer' : undefined}>
				{marker.text}
			</MarkerContent>
		</Marker>
	)
}
