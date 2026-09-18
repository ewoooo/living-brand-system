import { notFound, redirect } from 'next/navigation'

export default function GuidelineWidgetsPage() {
	if (process.env.NODE_ENV !== 'development') notFound()
	redirect('/guideline/playground')
}
