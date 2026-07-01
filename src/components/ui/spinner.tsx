import { CircleDash } from '@carbon/icons-react'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

function Spinner({ className, ...props }: ComponentProps<'svg'>) {
	return (
		<CircleDash
			data-slot="spinner"
			role="status"
			aria-label="Loading"
			className={cn('size-4 animate-spin', className)}
			{...props}
		/>
	)
}

export { Spinner }
