import { Search } from '@carbon/icons-react'
import { Marker, MarkerContent, MarkerIcon } from '@/components/ui/marker'
import type { AgentToolMarker } from '@/features/agent-chat/get-agent-tool-marker'

export function AgentChatToolMarker({
	marker,
	isPending,
}: {
	marker: AgentToolMarker | null
	isPending: boolean
}) {
	if (!marker) {
		return null
	}

	return (
		<Marker>
			<MarkerIcon>
				<Search />
			</MarkerIcon>
			<MarkerContent className={isPending ? 'shimmer' : undefined}>
				{marker.text}
			</MarkerContent>
		</Marker>
	)
}
