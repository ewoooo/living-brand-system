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
				className="color-swatch-cell__swatch"
				style={{
					backgroundColor: hex,
				}}
			/>
			<span>{hex}</span>
		</Badge>
	)
}
