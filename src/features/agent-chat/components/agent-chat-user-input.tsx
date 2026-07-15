import { ArrowUp, Close, Upload } from '@carbon/icons-react'
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
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { useFileInput } from '@/hooks/use-file-input'

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
	const fileInput = useFileInput()
	const hasFiles = Boolean(files?.length)
	const canSubmit = !isBusy && (Boolean(value.trim()) || hasFiles)
	const clearFiles = () => {
		onFilesChange(undefined)
		fileInput.reset()
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
			<div className="rounded-2xl border border-input bg-background p-2 transition-colors focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30">
				<input
					accept="image/*,text/*"
					className="sr-only"
					multiple
					ref={fileInput.ref}
					type="file"
					onChange={(event) => onFilesChange(event.currentTarget.files || undefined)}
				/>
				<Textarea
					aria-label="무엇이든 물어보세요"
					className="type-callout max-h-40 min-h-20 border-0 bg-transparent px-2 py-2 shadow-none focus-visible:border-transparent focus-visible:ring-0"
					value={value}
					placeholder="무엇이든 물어보세요"
					disabled={isBusy}
					onChange={(event) => onChange(event.currentTarget.value)}
					onKeyDown={(event) => {
						if (
							event.key !== 'Enter' ||
							event.shiftKey ||
							event.nativeEvent.isComposing
						) {
							return
						}
						event.preventDefault()
						event.currentTarget.form?.requestSubmit()
					}}
				/>
				<div className="flex items-center justify-between">
					<Button
						aria-label="파일 첨부"
						type="button"
						variant="ghost"
						size="icon-lg"
						disabled={isBusy}
						onClick={fileInput.open}
					>
						<Upload data-icon="inline-start" />
					</Button>
					<Button
						aria-label="메시지 보내기"
						type="submit"
						variant="default"
						size="icon-lg"
						disabled={!canSubmit}
						className="rounded-full"
					>
						{isBusy ? <Spinner /> : <ArrowUp data-icon="inline-start" />}
					</Button>
				</div>
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
				<AttachmentAction aria-label="첨부 지우기" type="button" onClick={onClear}>
					<Close />
				</AttachmentAction>
			</AttachmentActions>
		</Attachment>
	)
}
