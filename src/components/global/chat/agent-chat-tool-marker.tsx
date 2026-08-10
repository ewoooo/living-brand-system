import type { ReactNode } from 'react'
import { Marker, MarkerContent, MarkerIcon } from '@/components/ui/marker'
import type { AgentToolMarker } from '@/features/agent-chat/utils/derive-agent-message'

type AgentChatMarkerProps = {
	marker: AgentToolMarker | null
	icon: ReactNode
	isPending?: boolean
}

export function AgentChatMarker({
	marker,
	icon,
	isPending = marker?.isPending,
}: AgentChatMarkerProps) {
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
