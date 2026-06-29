import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function AgentChatInput({
	value,
	isBusy,
	onChange,
	onSubmit,
}: {
	value: string
	isBusy: boolean
	onChange: (value: string) => void
	onSubmit: () => void
}) {
	return (
		<form
			className="p-3"
			onSubmit={(event) => {
				event.preventDefault()

				if (!value.trim()) {
					return
				}

				onSubmit()
			}}
		>
			<div className="flex gap-2">
				<Input
					className="h-9 pl-3 flex-1 border-none bg-neutral-500/10"
					value={value}
					placeholder="Ask Anything"
					disabled={isBusy}
					onChange={(event) => onChange(event.currentTarget.value)}
				/>
				<Button type="submit" variant="ghost" size="lg" disabled={isBusy || !value.trim()}>
					Send
				</Button>
			</div>
		</form>
	)
}
