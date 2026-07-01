import { Ai, Catalog, Search } from '@carbon/icons-react'
import { Marker, MarkerContent, MarkerIcon } from '@/components/ui/marker'
import { Spinner } from '@/components/ui/spinner'
import type {
	AgentReasoningMarker,
	AgentSkillMarker,
	AgentToolMarker,
} from '@/features/agent-chat/get-agent-tool-marker'

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

export function AgentChatReasoningMarker({ marker }: { marker: AgentReasoningMarker | null }) {
	if (!marker) {
		return null
	}

	return (
		<Marker>
			<MarkerIcon>{marker.isPending ? <Spinner /> : <Ai />}</MarkerIcon>
			<MarkerContent className={marker.isPending ? 'shimmer' : undefined}>
				{marker.text}
			</MarkerContent>
		</Marker>
	)
}

export function AgentChatSkillMarker({ marker }: { marker: AgentSkillMarker | null }) {
	if (!marker) {
		return null
	}

	return (
		<Marker>
			<MarkerIcon>
				<Catalog />
			</MarkerIcon>
			<MarkerContent className={marker.isPending ? 'shimmer' : undefined}>
				{marker.text}
			</MarkerContent>
		</Marker>
	)
}
