import Image from 'next/image'
import { AspectRatio } from '../ui/aspect-ratio'
import { Skeleton } from '../ui/skeleton'

export function GuidelineHeaderImage({ image, className }: { image?: string; className?: string }) {
	return (
		<AspectRatio ratio={16 / 9} className={className}>
			{image ? (
				<Image src={image} alt="" fill sizes="100vw" className="object-cover" />
			) : (
				<Skeleton className="size-full bg-neutral-200 dark:bg-neutral-800" />
			)}
		</AspectRatio>
	)
}
