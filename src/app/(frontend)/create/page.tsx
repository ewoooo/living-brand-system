import { FigmaImportForm } from '@/features/template-import/components/figma-import-form'

export default function CreatePage() {
	return (
		<article className="min-h-full grid place-items-center p-8">
			<div className="flex w-full flex-col items-center gap-6">
				<div className="text-center">
					<h1>Create</h1>
					<p>Template / Plugin</p>
				</div>
				<FigmaImportForm />
			</div>
		</article>
	)
}
