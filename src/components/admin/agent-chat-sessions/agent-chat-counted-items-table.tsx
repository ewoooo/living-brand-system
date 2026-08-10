'use client'

import { useFormFields } from '@payloadcms/ui'
import type { FormState } from 'payload'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { fieldNumber, fieldRowCount, fieldString, formatNumber } from '../shared/form-fields'

type CountedItem = {
	callCount?: number | null
	id?: string | null
	name?: string | null
}

type Props = {
	path?: string
}

const HEAD_CLASS = 'align-top text-sm font-semibold text-muted-foreground'
const CELL_CLASS = 'align-top'

function buildItems(fields: FormState, path: string): CountedItem[] {
	return Array.from({ length: fieldRowCount(fields, path) }, (_, index) => ({
		callCount: fieldNumber(fields, `${path}.${index}.callCount`),
		id: fieldString(fields, `${path}.${index}.id`),
		name: fieldString(fields, `${path}.${index}.name`),
	}))
}

export function AgentChatCountedItemsTable({ path }: Props) {
	const isSkills = path === 'usedSkillsTable'
	const sourcePath = isSkills ? 'usedSkills' : 'usedTools'
	const title = isSkills ? 'Used Skills' : 'Used Tools'
	const description = isSkills
		? 'loadSkill로 선택된 Agent skill 이름과 호출 횟수입니다.'
		: 'Agent가 호출한 tool 이름과 호출 횟수입니다.'
	const items = useFormFields(([fields]) => buildItems(fields, sourcePath))

	return (
		<section className="mb-5">
			<h3 className="m-0 mb-2.5">{title}</h3>
			<p className="m-0 text-muted-foreground">{description}</p>
			<Table className="min-w-[420px] table-fixed border-collapse">
				<TableHeader>
					<TableRow>
						<TableHead scope="col" className={HEAD_CLASS}>
							Name
						</TableHead>
						<TableHead scope="col" className={cn(HEAD_CLASS, 'w-40')}>
							Calls
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{items.length > 0 ? (
						items.map((item) => (
							<TableRow key={item.id ?? item.name ?? 'item'}>
								<TableCell className={CELL_CLASS}>{item.name ?? '-'}</TableCell>
								<TableCell className={cn(CELL_CLASS, 'w-40')}>
									{formatNumber(item.callCount)}
								</TableCell>
							</TableRow>
						))
					) : (
						<TableRow>
							<TableCell colSpan={2} className={CELL_CLASS}>
								기록된 항목이 없습니다.
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>
		</section>
	)
}
