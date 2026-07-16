import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'

// 대량 데이터 테이블: shadcn Table 프리미티브로 구성. 세로 max-height 스크롤 + sticky 헤더로 큰 데이터를 담는다.
export type DataTableColumn = { key: string; label: string; align?: 'left' | 'right' }
export type DataTableRow = Record<string, string | number>

export function DataTable({
	columns,
	rows,
	rowKey,
	caption,
}: {
	columns: DataTableColumn[]
	rows: DataTableRow[]
	// 행을 식별할 컬럼 key. 없으면 첫 컬럼 값을 쓴다.
	rowKey?: string
	caption?: string
}) {
	const keyField = rowKey ?? columns[0]?.key
	return (
		<div className="max-h-[30rem] overflow-y-auto rounded-lg">
			<Table>
				{caption && <TableCaption>{caption}</TableCaption>}
				<TableHeader className="sticky top-0 z-10 bg-background">
					<TableRow>
						{columns.map((column) => (
							<TableHead
								key={column.key}
								className={column.align === 'right' ? 'text-right' : undefined}
							>
								{column.label}
							</TableHead>
						))}
					</TableRow>
				</TableHeader>
				<TableBody>
					{rows.map((row) => (
						<TableRow key={String(row[keyField])}>
							{columns.map((column) => (
								<TableCell
									key={column.key}
									className={
										column.align === 'right'
											? 'text-right tabular-nums'
											: undefined
									}
								>
									{row[column.key]}
								</TableCell>
							))}
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	)
}

const COLUMNS: DataTableColumn[] = [
	{ key: 'token', label: 'Token' },
	{ key: 'name', label: 'Name' },
	{ key: 'hex', label: 'HEX' },
	{ key: 'rgb', label: 'RGB', align: 'right' },
	{ key: 'cmyk', label: 'CMYK', align: 'right' },
	{ key: 'pms', label: 'PMS' },
	{ key: 'usage', label: 'Usage' },
]

const ROWS: DataTableRow[] = [
	{
		token: 'red-1',
		name: 'Red 1',
		hex: '#FFF0EB',
		rgb: '255/240/235',
		cmyk: '0/6/8/0',
		pms: '705 C',
		usage: 'Background tint',
	},
	{
		token: 'red-2',
		name: 'Red 2',
		hex: '#FFB4AA',
		rgb: '255/180/170',
		cmyk: '0/29/28/0',
		pms: '169 C',
		usage: 'Accent light',
	},
	{
		token: 'red-3',
		name: 'Essenherb Red',
		hex: '#EA5343',
		rgb: '234/83/67',
		cmyk: '0/78/76/0',
		pms: 'Warm Red C',
		usage: 'Primary brand',
	},
	{
		token: 'red-4',
		name: 'Red 4',
		hex: '#871400',
		rgb: '135/20/0',
		cmyk: '0/85/100/47',
		pms: '7620 C',
		usage: 'Deep accent',
	},
	{
		token: 'red-5',
		name: 'Red 5',
		hex: '#460500',
		rgb: '70/5/0',
		cmyk: '0/93/100/73',
		pms: '188 C',
		usage: 'Dark ground',
	},
	{
		token: 'yellow-1',
		name: 'Yellow 1',
		hex: '#FFFAC2',
		rgb: '255/250/194',
		cmyk: '0/2/24/0',
		pms: '600 C',
		usage: 'Background tint',
	},
	{
		token: 'yellow-2',
		name: 'Yellow 2',
		hex: '#FFF095',
		rgb: '255/240/149',
		cmyk: '0/6/42/0',
		pms: '602 C',
		usage: 'Accent light',
	},
	{
		token: 'yellow-3',
		name: 'Yellow 3',
		hex: '#FFE65F',
		rgb: '255/230/95',
		cmyk: '0/10/63/0',
		pms: '7404 C',
		usage: 'Highlight',
	},
	{
		token: 'yellow-4',
		name: 'Yellow 4',
		hex: '#A07D0F',
		rgb: '160/125/15',
		cmyk: '0/22/91/37',
		pms: '118 C',
		usage: 'Deep accent',
	},
	{
		token: 'yellow-5',
		name: 'Yellow 5',
		hex: '#503200',
		rgb: '80/50/0',
		cmyk: '0/38/100/69',
		pms: '7575 C',
		usage: 'Dark ground',
	},
	{
		token: 'green-1',
		name: 'Green 1',
		hex: '#E6FFE6',
		rgb: '230/255/230',
		cmyk: '10/0/10/0',
		pms: '2253 C',
		usage: 'Background tint',
	},
	{
		token: 'green-2',
		name: 'Green 2',
		hex: '#A7F5AE',
		rgb: '167/245/174',
		cmyk: '32/0/29/4',
		pms: '2255 C',
		usage: 'Accent light',
	},
	{
		token: 'green-3',
		name: 'Green 3',
		hex: '#50AE5F',
		rgb: '80/174/95',
		cmyk: '54/0/45/32',
		pms: '2257 C',
		usage: 'Success / nature',
	},
	{
		token: 'green-4',
		name: 'Green 4',
		hex: '#195F30',
		rgb: '25/95/48',
		cmyk: '74/0/49/63',
		pms: '555 C',
		usage: 'Deep accent',
	},
	{
		token: 'green-5',
		name: 'Green 5',
		hex: '#002B1E',
		rgb: '0/43/30',
		cmyk: '100/0/30/83',
		pms: '567 C',
		usage: 'Dark ground',
	},
	{
		token: 'blue-1',
		name: 'Blue 1',
		hex: '#E1F0FF',
		rgb: '225/240/255',
		cmyk: '12/6/0/0',
		pms: '657 C',
		usage: 'Background tint',
	},
	{
		token: 'blue-2',
		name: 'Blue 2',
		hex: '#A5CDFF',
		rgb: '165/205/255',
		cmyk: '35/20/0/0',
		pms: '2717 C',
		usage: 'Accent light',
	},
	{
		token: 'blue-3',
		name: 'Blue 3',
		hex: '#3C87CD',
		rgb: '60/135/205',
		cmyk: '71/34/0/20',
		pms: '279 C',
		usage: 'Info',
	},
	{
		token: 'blue-4',
		name: 'Blue 4',
		hex: '#1E508C',
		rgb: '30/80/140',
		cmyk: '79/43/0/45',
		pms: '2161 C',
		usage: 'Deep accent',
	},
	{
		token: 'blue-5',
		name: 'Blue 5',
		hex: '#001941',
		rgb: '0/25/65',
		cmyk: '100/62/0/75',
		pms: '2768 C',
		usage: 'Dark ground',
	},
	{
		token: 'purple-1',
		name: 'Purple 1',
		hex: '#FAEBFF',
		rgb: '250/235/255',
		cmyk: '2/8/0/0',
		pms: '531 C',
		usage: 'Background tint',
	},
	{
		token: 'purple-3',
		name: 'Purple 3',
		hex: '#A546BE',
		rgb: '165/70/190',
		cmyk: '13/63/0/25',
		pms: '258 C',
		usage: 'Accent',
	},
	{
		token: 'purple-5',
		name: 'Purple 5',
		hex: '#3C0046',
		rgb: '60/0/70',
		cmyk: '14/100/0/73',
		pms: '7449 C',
		usage: 'Dark ground',
	},
	{
		token: 'gray-1',
		name: 'Gray 1',
		hex: '#FAFAFA',
		rgb: '250/250/250',
		cmyk: '0/0/0/2',
		pms: '—',
		usage: 'Surface',
	},
	{
		token: 'gray-3',
		name: 'Gray 3',
		hex: '#ACACAC',
		rgb: '172/172/172',
		cmyk: '0/0/0/33',
		pms: 'Cool Gray 7 C',
		usage: 'Muted text',
	},
	{
		token: 'gray-5',
		name: 'Gray 5',
		hex: '#151515',
		rgb: '21/21/21',
		cmyk: '0/0/0/92',
		pms: 'Black C',
		usage: 'Text / ground',
	},
]

export function DataTableDemo() {
	return (
		<DataTable
			columns={COLUMNS}
			rows={ROWS}
			rowKey="token"
			caption="Essenherb 브랜드 컬러 명세 — 전체 팔레트 토큰."
		/>
	)
}
