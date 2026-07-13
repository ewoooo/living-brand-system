import { Warning } from '@carbon/icons-react'

export function GuidelineDescriptionFallback() {
	return <p className="text-red-400">Description must be filled on purpose.</p>
}

export function GuidelineLabelFallback() {
	return (
		<h2 className="mb-4 flex items-center gap-2 text-4xl text-red-400">
			<Warning size={36} />
			<span>Label should be fulfilled.</span>
		</h2>
	)
}
