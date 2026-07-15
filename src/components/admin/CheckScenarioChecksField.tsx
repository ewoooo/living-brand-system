'use client'

import { FieldDescription, FieldError, FieldLabel, useField } from '@payloadcms/ui'
import type { JSONFieldClientComponent } from 'payload'
import { useEffect, useState } from 'react'

interface AvailableCheck {
	key: string
	title: string
	documentTitle: string
	tier?: 'recommended' | 'required'
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
		(key) => byKey.get(key) ?? { key, title: key, documentTitle: '' },
	)
	const normalizedQuery = query.trim().toLowerCase()
	const candidates = available.filter(
		(check) =>
			!checkKeys.includes(check.key) &&
			(!normalizedQuery ||
				check.key.toLowerCase().includes(normalizedQuery) ||
				check.title.toLowerCase().includes(normalizedQuery) ||
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
		<div className="field-type json">
			<FieldLabel htmlFor={`${path}-search`} label="포함된 Check" path={path} required />
			<FieldError message={errorMessage} path={path} showError={showError} />
			{loadError ? <p role="alert">{loadError}</p> : null}

			<ol>
				{selected.map((check, index) => (
					<li key={check.key}>
						<strong>{check.title}</strong> <code>{check.key}</code>
						{check.documentTitle ? ` · ${check.documentTitle}` : ' · 발행된 Check 없음'}{' '}
						<button
							type="button"
							disabled={disabled || index === 0}
							onClick={() => move(index, -1)}
							aria-label={`${check.title} 위로 이동`}
						>
							↑
						</button>{' '}
						<button
							type="button"
							disabled={disabled || index === selected.length - 1}
							onClick={() => move(index, 1)}
							aria-label={`${check.title} 아래로 이동`}
						>
							↓
						</button>{' '}
						<button
							type="button"
							disabled={disabled}
							onClick={() => update(checkKeys.filter((key) => key !== check.key))}
						>
							제외
						</button>
					</li>
				))}
			</ol>

			<label htmlFor={`${path}-search`}>Check 검색</label>
			<input
				id={`${path}-search`}
				type="search"
				value={query}
				onChange={(event) => setQuery(event.currentTarget.value)}
				disabled={disabled}
			/>
			<ul>
				{candidates.map((check) => (
					<li key={check.key}>
						<strong>{check.title}</strong> <code>{check.key}</code> ·{' '}
						{check.documentTitle}
						{check.tier ? ` · ${check.tier}` : ''}
						{check.executor ? ` · ${check.executor}` : ''}{' '}
						<button
							type="button"
							disabled={disabled}
							onClick={() => update([...checkKeys, check.key])}
						>
							포함
						</button>
					</li>
				))}
			</ul>
			<FieldDescription
				description="발행된 Guideline Check만 선택할 수 있으며 위에서부터 실행 순서를 결정합니다."
				path={path}
			/>
		</div>
	)
}

export default CheckScenarioChecksField
