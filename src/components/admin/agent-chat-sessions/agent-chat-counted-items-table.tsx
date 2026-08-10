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
import { fieldNumber, fieldRowCount, fieldString, formatNumber } from '../shared/form-fields'

type CountedItem = {
	callCount?: number | null
	id?: string | null
	name?: string | null
}

type Props = {
	path?: string
}

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
		<section className="agent-chat-counted-items-table">
			<h3>{title}</h3>
			<p>{description}</p>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead scope="col">Name</TableHead>
						<TableHead scope="col">Calls</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{items.length > 0 ? (
						items.map((item) => (
							<TableRow key={item.id ?? item.name ?? 'item'}>
								<TableCell>{item.name ?? '-'}</TableCell>
								<TableCell>{formatNumber(item.callCount)}</TableCell>
							</TableRow>
						))
					) : (
						<TableRow>
							<TableCell colSpan={2}>기록된 항목이 없습니다.</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>
		</section>
	)
}
