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
					className="h-8 flex-1"
					value={value}
					placeholder="Ask"
					disabled={isBusy}
					onChange={(event) => onChange(event.currentTarget.value)}
				/>
				<Button type="submit" size="lg" disabled={isBusy || !value.trim()}>
					Send
				</Button>
			</div>
		</form>
	)
}
