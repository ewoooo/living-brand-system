import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

export function GuidelineChat() {
	return (
		<aside className="w-16 shrink-0 border-l p-2">
			<Sheet>
				<SheetTrigger asChild>
					<Button variant="outline" size="sm">
						Chat
					</Button>
				</SheetTrigger>
				<SheetContent side="right">
					<SheetHeader>
						<SheetTitle>Chat</SheetTitle>
					</SheetHeader>
				</SheetContent>
			</Sheet>
		</aside>
	)
}
