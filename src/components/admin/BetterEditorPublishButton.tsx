'use client'

import { PublishButton } from '@payloadcms/ui'
import { LiveEditorToggle } from 'payload-better-editor/client'

export default function BetterEditorPublishButton() {
	return (
		<>
			<LiveEditorToggle blocksField="blocks" />
			<PublishButton />
		</>
	)
}
