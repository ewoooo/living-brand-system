'use client'

import { SaveDraftButton } from '@payloadcms/ui'
import { LiveEditorToggle } from 'payload-better-editor/client'

export default function BetterEditorSaveDraftButton() {
	return (
		<>
			<LiveEditorToggle blocksField="blocks" />
			<SaveDraftButton />
		</>
	)
}
