import type { MyFeatureViewModel } from '../types'

export function MyFeatureComponent({ title }: MyFeatureViewModel) {
	return (
		<section>
			<h2>{title}</h2>
		</section>
	)
}
