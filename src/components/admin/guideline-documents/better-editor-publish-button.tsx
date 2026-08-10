'use client'

import { PublishButton } from '@payloadcms/ui'
import { LiveEditorToggle } from 'payload-better-editor/client'

export function BetterEditorPublishButton() {
	return (
		<>
			<LiveEditorToggle blocksField="blocks" />
			<PublishButton />
		</>
	)
}
