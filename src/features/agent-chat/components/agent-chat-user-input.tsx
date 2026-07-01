import { Attachment as AttachmentIcon, Close } from '@carbon/icons-react'
import { useRef } from 'react'
import {
	Attachment,
	AttachmentAction,
	AttachmentActions,
	AttachmentContent,
	AttachmentDescription,
	AttachmentGroup,
	AttachmentMedia,
	AttachmentTitle,
} from '@/components/ui/attachment'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function AgentChatUserInput({
	files,
	value,
	isBusy,
	onChange,
	onFilesChange,
	onSubmit,
}: {
	files?: FileList
	value: string
	isBusy: boolean
	onChange: (value: string) => void
	onFilesChange: (files: FileList | undefined) => void
	onSubmit: () => void
}) {
	const fileInputRef = useRef<HTMLInputElement>(null)
	const hasFiles = Boolean(files?.length)
	const canSubmit = !isBusy && (Boolean(value.trim()) || hasFiles)
	const clearFiles = () => {
		onFilesChange(undefined)
		if (fileInputRef.current) {
			fileInputRef.current.value = ''
		}
	}

	return (
		<form
			className="p-3"
			onSubmit={(event) => {
				event.preventDefault()

				if (!canSubmit) {
					return
				}

				onSubmit()
				clearFiles()
			}}
		>
			{hasFiles && (
				<AttachmentGroup className="mb-2">
					{Array.from(files || []).map((file) => (
						<SelectedAttachment
							file={file}
							key={`${file.name}-${file.lastModified}-${file.size}`}
							onClear={clearFiles}
						/>
					))}
				</AttachmentGroup>
			)}
			<div className="flex items-center gap-2">
				<input
					accept="image/*,text/*"
					className="sr-only"
					multiple
					ref={fileInputRef}
					type="file"
					onChange={(event) => onFilesChange(event.currentTarget.files || undefined)}
				/>
				<Button
					aria-label="Attach files"
					type="button"
					variant="outline"
					size="icon-lg"
					disabled={isBusy}
					onClick={() => fileInputRef.current?.click()}
				>
					<AttachmentIcon data-icon="inline-start" />
				</Button>
				<Input
					className="h-8 flex-1 px-3"
					value={value}
					placeholder="Ask Anything"
					disabled={isBusy}
					onChange={(event) => onChange(event.currentTarget.value)}
				/>
				<Button
					aria-label="Send message"
					type="submit"
					variant="default"
					size="lg"
					disabled={!canSubmit}
				>
					Send
				</Button>
			</div>
		</form>
	)
}

function SelectedAttachment({ file, onClear }: { file: File; onClear: () => void }) {
	return (
		<Attachment size="sm">
			<AttachmentMedia>{file.type.startsWith('image/') ? 'IMG' : 'TXT'}</AttachmentMedia>
			<AttachmentContent>
				<AttachmentTitle>{file.name}</AttachmentTitle>
				<AttachmentDescription>{file.type || 'file'}</AttachmentDescription>
			</AttachmentContent>
			<AttachmentActions>
				<AttachmentAction aria-label="Clear attachments" type="button" onClick={onClear}>
					<Close />
				</AttachmentAction>
			</AttachmentActions>
		</Attachment>
	)
}
