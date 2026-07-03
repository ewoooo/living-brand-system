import config from '@payload-config'
import { getPayload } from 'payload'

const payload = await getPayload({ config })

type Group = 'blue' | 'gray' | 'green' | 'neutral' | 'purple' | 'red' | 'yellow'

type ColorSeed = {
	group: Group
	hex: string
	isMain?: boolean
	name: string
	pantone?: string
	tone?: number
}

// Essenherb Brand Identity Guidelines 1.0, B.2 Color System (p.24) — 32색 팔레트
const colors: ColorSeed[] = [
	{ name: 'White', hex: 'FFFFFF', group: 'neutral', isMain: true },
	{ name: 'Black', hex: '000000', group: 'neutral', isMain: true },
	{ name: 'Red 1', hex: 'FFF0EB', group: 'red', tone: 1, pantone: '705C' },
	{ name: 'Red 2', hex: 'FFB4AA', group: 'red', tone: 2, pantone: '169C' },
	{
		name: 'Essenherb Red',
		hex: 'EA5343',
		group: 'red',
		tone: 3,
		pantone: 'Warm Red C',
		isMain: true,
	},
	{ name: 'Red 4', hex: '871400', group: 'red', tone: 4, pantone: '7620C' },
	{ name: 'Red 5', hex: '460500', group: 'red', tone: 5, pantone: '188C' },
	{ name: 'Yellow 1', hex: 'FFFAC2', group: 'yellow', tone: 1, pantone: '600C' },
	{ name: 'Yellow 2', hex: 'FFF095', group: 'yellow', tone: 2, pantone: '602C' },
	{ name: 'Yellow 3', hex: 'FFE65F', group: 'yellow', tone: 3, pantone: '7404C' },
	{ name: 'Yellow 4', hex: 'A07D0F', group: 'yellow', tone: 4, pantone: '118C' },
	{ name: 'Yellow 5', hex: '503200', group: 'yellow', tone: 5, pantone: '7575C' },
	{ name: 'Green 1', hex: 'E6FFE6', group: 'green', tone: 1, pantone: '2253C' },
	{ name: 'Green 2', hex: 'A7F5AE', group: 'green', tone: 2, pantone: '2255C' },
	{ name: 'Green 3', hex: '50AE5F', group: 'green', tone: 3, pantone: '2257C' },
	{ name: 'Green 4', hex: '195F30', group: 'green', tone: 4, pantone: '555C' },
	{ name: 'Green 5', hex: '002B1E', group: 'green', tone: 5, pantone: '567C' },
	{ name: 'Blue 1', hex: 'E1F0FF', group: 'blue', tone: 1, pantone: '657C' },
	{ name: 'Blue 2', hex: 'A5CDFF', group: 'blue', tone: 2, pantone: '2717C' },
	{ name: 'Blue 3', hex: '3C87CD', group: 'blue', tone: 3, pantone: '279C' },
	{ name: 'Blue 4', hex: '1E508C', group: 'blue', tone: 4, pantone: '2161C' },
	{ name: 'Blue 5', hex: '001941', group: 'blue', tone: 5, pantone: '2768C' },
	{ name: 'Purple 1', hex: 'FAEBFF', group: 'purple', tone: 1, pantone: '531C' },
	{ name: 'Purple 2', hex: 'EBC8E9', group: 'purple', tone: 2, pantone: '529C' },
	{ name: 'Purple 3', hex: 'A546BE', group: 'purple', tone: 3, pantone: '258C' },
	{ name: 'Purple 4', hex: '692373', group: 'purple', tone: 4, pantone: '260C' },
	{ name: 'Purple 5', hex: '3C0046', group: 'purple', tone: 5, pantone: '7449C' },
	{ name: 'Gray 1', hex: 'FAFAFA', group: 'gray', tone: 1 },
	{ name: 'Gray 2', hex: 'EBEBEB', group: 'gray', tone: 2 },
	{ name: 'Gray 3', hex: 'ACACAC', group: 'gray', tone: 3 },
	{ name: 'Gray 4', hex: '464646', group: 'gray', tone: 4 },
	{ name: 'Gray 5', hex: '151515', group: 'gray', tone: 5 },
]

for (const color of colors) {
	const data = {
		name: color.name,
		hex: `#${color.hex}`,
		pantone: color.pantone ?? null,
		colorGroup: color.group,
		tone: color.tone ?? null,
		isMain: color.isMain ?? false,
		_status: 'published' as const,
	}
	const existing = await payload.find({
		collection: 'brand-colors',
		locale: 'ko',
		limit: 1,
		overrideAccess: true,
		where: { name: { equals: color.name } },
	})
	const found = existing.docs[0]

	if (found) {
		await payload.update({
			collection: 'brand-colors',
			id: found.id,
			data,
			locale: 'ko',
			overrideAccess: true,
		})
	} else {
		await payload.create({
			collection: 'brand-colors',
			data,
			locale: 'ko',
			overrideAccess: true,
		})
	}
}

payload.logger.info(`Seed brand colors 완료 (${colors.length}색)`)

process.exit(0)
