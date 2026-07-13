import { AspectRatio } from '@/components/ui/aspect-ratio'
import type { GuidelineSection } from '@/payload-types'
import { GuidelineImage } from '../blocks/children/guideline-image'
import type { GuidelineVariant } from './guideline-variant'

export function GuidelineHeader({
	title,
	image,
	as: Heading = 'h1',
	label,
	variant = 'chapter',
}: {
	title: string
	image?: GuidelineSection['headerImage']
	as?: 'h1' | 'h2'
	label?: string | number
	variant?: GuidelineVariant
}) {
	const hasImage = typeof image === 'object' && image !== null && Boolean(image.url)

	return (
		<header data-variant={variant}>
			<AspectRatio ratio={16 / 9} className="relative overflow-hidden bg-neutral-950">
				<GuidelineImage
					image={image}
					className="absolute inset-0 size-full"
					imgClassName="size-full object-cover"
				/>
				{hasImage && <div aria-hidden="true" className="absolute inset-0 bg-black/25" />}
				<div className="relative z-10 flex size-full items-end p-4 pb-6 text-white">
					<div>
						{label !== undefined && <p className="mb-2 text-white/70">{label}</p>}
						<Heading className="text-5xl">{title}</Heading>
					</div>
				</div>
			</AspectRatio>
		</header>
	)
}
