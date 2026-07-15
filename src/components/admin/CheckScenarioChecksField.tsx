'use client'

import { Button, FieldDescription, FieldError, FieldLabel, useField } from '@payloadcms/ui'
import type { JSONFieldClientComponent } from 'payload'
import { useEffect, useState } from 'react'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'

interface AvailableCheck {
	blockName: string
	key: string
	title: string
	documentTitle: string
	executor?: 'deterministic' | 'heuristic' | 'manual'
}

const CheckScenarioChecksField: JSONFieldClientComponent = ({ path }) => {
	const { disabled, errorMessage, setValue, showError, value } = useField<unknown>({ path })
	const checkKeys = Array.isArray(value)
		? value.filter((key): key is string => typeof key === 'string')
		: []
	const [available, setAvailable] = useState<AvailableCheck[]>([])
	const [query, setQuery] = useState('')
	const [loadError, setLoadError] = useState('')

	useEffect(() => {
		const controller = new AbortController()
		void fetch('/api/check-scenarios/available-checks', { signal: controller.signal })
			.then((response) => {
				if (!response.ok) throw new Error('Check 목록을 불러오지 못했습니다.')
				return response.json() as Promise<{ docs?: AvailableCheck[] }>
			})
			.then(({ docs }) => setAvailable(docs ?? []))
			.catch((error: unknown) => {
				if (!controller.signal.aborted) {
					setLoadError(
						error instanceof Error
							? error.message
							: 'Check 목록을 불러오지 못했습니다.',
					)
				}
			})
		return () => controller.abort()
	}, [])

	const byKey = new Map(available.map((check) => [check.key, check]))
	const selected = checkKeys.map(
		(key) => byKey.get(key) ?? { blockName: '-', key, title: key, documentTitle: '' },
	)
	const selectedKeys = new Set(checkKeys)
	const normalizedQuery = query.trim().toLowerCase()
	const candidates = available.filter(
		(check) =>
			!selectedKeys.has(check.key) &&
			(!normalizedQuery ||
				check.key.toLowerCase().includes(normalizedQuery) ||
				check.title.toLowerCase().includes(normalizedQuery) ||
				check.blockName.toLowerCase().includes(normalizedQuery) ||
				check.documentTitle.toLowerCase().includes(normalizedQuery)),
	)

	const update = (next: string[]) => setValue(next)
	const move = (index: number, offset: -1 | 1) => {
		const next = [...checkKeys]
		const target = index + offset
		;[next[index], next[target]] = [next[target], next[index]]
		update(next)
	}

	return (
		<div className="field-type json check-scenario-checks-field">
			<FieldLabel htmlFor={`${path}-search`} label="포함된 Check" path={path} required />
			<FieldError message={errorMessage} path={path} showError={showError} />
			{loadError ? <p role="alert">{loadError}</p> : null}

			<Table aria-label="포함된 Check">
				<TableHeader>
					<TableRow>
						<TableHead scope="col">순서</TableHead>
						<TableHead scope="col">Check</TableHead>
						<TableHead scope="col">Check Block</TableHead>
						<TableHead scope="col">상위 문서</TableHead>
						<TableHead scope="col">실행 방식</TableHead>
						<TableHead scope="col">관리</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{selected.length > 0 ? (
						selected.map((check, index) => (
							<TableRow key={check.key}>
								<TableCell>{index + 1}</TableCell>
								<TableCell>
									<span className="check-scenario-checks-field__check">
										<strong>{check.title}</strong>
										<code>{check.key}</code>
									</span>
								</TableCell>
								<TableCell>{check.blockName}</TableCell>
								<TableCell>{check.documentTitle || '발행된 Check 없음'}</TableCell>
								<TableCell>{check.executor ?? '-'}</TableCell>
								<TableCell>
									<span className="check-scenario-checks-field__actions">
										<Button
											type="button"
											buttonStyle="secondary"
											size="xsmall"
											margin={false}
											disabled={disabled || index === 0}
											onClick={() => move(index, -1)}
											aria-label={`${check.title} 위로 이동`}
										>
											↑
										</Button>
										<Button
											type="button"
											buttonStyle="secondary"
											size="xsmall"
											margin={false}
											disabled={disabled || index === selected.length - 1}
											onClick={() => move(index, 1)}
											aria-label={`${check.title} 아래로 이동`}
										>
											↓
										</Button>
										<Button
											type="button"
											buttonStyle="secondary"
											size="xsmall"
											margin={false}
											disabled={disabled}
											onClick={() =>
												update(checkKeys.filter((key) => key !== check.key))
											}
										>
											제외
										</Button>
									</span>
								</TableCell>
							</TableRow>
						))
					) : (
						<TableRow>
							<TableCell colSpan={6}>아직 포함된 Check가 없습니다.</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>

			<label htmlFor={`${path}-search`}>Check 검색</label>
			<input
				id={`${path}-search`}
				type="search"
				value={query}
				onChange={(event) => setQuery(event.currentTarget.value)}
				disabled={disabled}
			/>
			<Table aria-label="추가 가능한 Check">
				<TableHeader>
					<TableRow>
						<TableHead scope="col">Check</TableHead>
						<TableHead scope="col">Check Block</TableHead>
						<TableHead scope="col">상위 문서</TableHead>
						<TableHead scope="col">실행 방식</TableHead>
						<TableHead scope="col">관리</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{candidates.length > 0 ? (
						candidates.map((check) => (
							<TableRow key={check.key}>
								<TableCell>
									<span className="check-scenario-checks-field__check">
										<strong>{check.title}</strong>
										<code>{check.key}</code>
									</span>
								</TableCell>
								<TableCell>{check.blockName}</TableCell>
								<TableCell>{check.documentTitle}</TableCell>
								<TableCell>{check.executor ?? '-'}</TableCell>
								<TableCell>
									<Button
										type="button"
										buttonStyle="secondary"
										size="xsmall"
										margin={false}
										disabled={disabled}
										onClick={() => update([...checkKeys, check.key])}
									>
										포함
									</Button>
								</TableCell>
							</TableRow>
						))
					) : (
						<TableRow>
							<TableCell colSpan={5}>추가 가능한 Check가 없습니다.</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>
			<FieldDescription
				description="발행된 Guideline Check만 선택할 수 있으며 위에서부터 실행 순서를 결정합니다."
				path={path}
			/>
		</div>
	)
}

export default CheckScenarioChecksField
