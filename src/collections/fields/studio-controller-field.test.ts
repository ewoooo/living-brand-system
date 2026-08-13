import type { Field } from 'payload'
import { describe, expect, it } from 'vitest'
import { STUDIO_OUTPUT_FORMAT_OPTIONS } from '@/features/studio-export/export-contract'
import { GraphicProfiles } from '../GraphicProfiles'
import { ImageProfiles } from '../ImageProfiles'
import { Templates } from '../Templates'
import { imageProfileFeaturesField } from './image-profile-features-field'

function namedField(fields: Field[], name: string): Field & { name: string } {
	const field = fields.find((candidate) => 'name' in candidate && candidate.name === name)
	if (!field || !('name' in field)) throw new Error(`${name} field is not configured`)
	return field
}

describe('studioControllerRestrictionsField', () => {
	it('세 Studio가 full Controller를 저장하지 않고 같은 Restrictions만 저작한다', () => {
		for (const collection of [ImageProfiles, Templates, GraphicProfiles]) {
			const restrictions = namedField(collection.fields, 'controllerRestrictions')
			expect(restrictions).toMatchObject({ type: 'json' })
			expect('admin' in restrictions ? restrictions.admin : undefined).toHaveProperty(
				'components.Field',
			)
			expect(
				collection.fields.some((field) => 'name' in field && field.name === 'controller'),
			).toBe(false)
		}
	})

	it('Image Profile은 legacy capability 필드를 저장하지 않는다', () => {
		const fieldNames = new Set(
			ImageProfiles.fields.flatMap((field) => ('name' in field ? [field.name] : [])),
		)
		for (const name of [
			'aspectRatio',
			'imageSize',
			'maxPromptLength',
			'cameraControl',
			'colorAdjustment',
			'controller',
		]) {
			expect(fieldNames.has(name)).toBe(false)
		}
	})

	it('세 Studio가 export policy를 Controller와 분리해 발행한다', () => {
		for (const [collection, source] of [
			[ImageProfiles, 'image'],
			[Templates, 'template'],
			[GraphicProfiles, 'graphic'],
		] as const) {
			const exportPolicy = namedField(collection.fields, 'exportPolicy')
			if (exportPolicy.type !== 'group') throw new Error('exportPolicy must be a group')
			expect(namedField(exportPolicy.fields, 'allowedFormats')).toMatchObject({
				type: 'select',
				hasMany: true,
				options: STUDIO_OUTPUT_FORMAT_OPTIONS,
				admin: {
					components: {
						Field: {
							path: '/components/admin/studio/studio-output-formats-field#StudioOutputFormatsField',
							clientProps: { source },
						},
					},
				},
			})
		}
	})
})

describe('ImageProfiles publish validation', () => {
	const hook = ImageProfiles.hooks?.beforeChange?.[0]
	if (!hook) throw new Error('ImageProfiles beforeChange hook is not configured')
	const profile = {
		name: 'Profile',
		slug: 'profile',
		imageModelPreset: 'openai-gpt-image-2',
	}

	it('draft의 불완전한 restrictions는 허용하고 제한 없는 publish를 파생한다', async () => {
		const draft = {
			...profile,
			_status: 'draft',
			controllerRestrictions: { controls: [{ controlId: 'unknown' }] },
		}
		await expect(hook({ data: draft } as never)).resolves.toBe(draft)
		const published = { ...profile, _status: 'published' }
		await expect(hook({ data: published } as never)).resolves.toBe(published)
	})

	it('published restrictions가 Base Definition을 확장하면 Payload 400으로 거부한다', async () => {
		const data = {
			...profile,
			_status: 'published',
			controllerRestrictions: { controls: [{ controlId: 'unknown' }] },
		}
		await expect(hook({ data } as never)).rejects.toMatchObject({
			message: 'Controller restriction control을 찾을 수 없습니다: unknown',
			status: 400,
		})
	})

	it('published feature type 중복을 Payload 400으로 거부한다', async () => {
		const data = {
			...profile,
			_status: 'published',
			features: [{ blockType: 'cameraControl' }, { blockType: 'cameraControl' }],
		}
		await expect(hook({ data } as never)).rejects.toMatchObject({
			message: 'Image feature type이 중복되었습니다: camera-control',
			status: 400,
		})
	})

	it('Admin export policy가 Image Exporter 지원 형식을 넓히지 못한다', async () => {
		const data = {
			...profile,
			_status: 'published',
			exportPolicy: { allowedFormats: ['svg'] },
		}
		await expect(hook({ data } as never)).rejects.toMatchObject({
			message: '지원하지 않는 output format입니다: svg',
			status: 400,
		})
	})
})

describe('GraphicProfiles publish validation', () => {
	const hook = GraphicProfiles.hooks?.beforeChange?.[0]
	if (!hook) throw new Error('GraphicProfiles beforeChange hook is not configured')

	it('draft는 불완전 restrictions를 허용하고 publish는 runtime보다 넓은 계약을 거부한다', () => {
		const draft = {
			_status: 'draft',
			name: 'Draft',
			runtime: 'forward-straight',
			controllerRestrictions: { controls: [{ controlId: 'unknown' }] },
		}
		expect(hook({ data: draft } as never)).toBe(draft)
		expect(() => hook({ data: { ...draft, _status: 'published' } } as never)).toThrow(
			'Controller restriction control을 찾을 수 없습니다: unknown',
		)
	})
})

describe('imageProfileFeaturesField', () => {
	it('capability 선택만 저작하고 arbitrary control ID는 받지 않는다', () => {
		const features = imageProfileFeaturesField()
		if (features.type !== 'blocks') throw new Error('features must be blocks')
		expect(features.blocks.map((block) => block.slug)).toEqual([
			'colorAdjustment',
			'cameraControl',
		])
		expect(features.blocks[0]?.fields).toEqual([
			expect.objectContaining({ name: 'background', type: 'checkbox' }),
		])
		expect(features.blocks[1]?.fields).toEqual([])
	})
})
