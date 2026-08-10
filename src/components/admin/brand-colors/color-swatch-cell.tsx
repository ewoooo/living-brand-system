import { Badge } from '@/components/ui/badge'

type Props = {
	cellData?: unknown
}

export function ColorSwatchCell({ cellData }: Props) {
	const hex = typeof cellData === 'string' ? cellData : ''

	return (
		<Badge variant="outline">
			<span
				aria-hidden="true"
				className="size-3.5 rounded-sm border border-border"
				style={{
					backgroundColor: hex,
				}}
			/>
			<span>{hex}</span>
		</Badge>
	)
}
