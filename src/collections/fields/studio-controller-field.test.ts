import type { Field } from 'payload'
import { describe, expect, it } from 'vitest'
import { STUDIO_OUTPUT_FORMAT_OPTIONS } from '@/features/studio-export/export-contract'
import { GraphicProfiles } from '../GraphicProfiles'
import { ImageProfiles } from '../ImageProfiles'
import { Templates } from '../Templates'
import { imageProfileFeaturesField } from './image-profile-features-field'
import {
	studioControllerField,
	validateHexColor,
	validatePositiveNumber,
} from './studio-controller-field'

function namedField(fields: Field[], name: string): Field & { name: string } {
	const field = fields.find((candidate) => 'name' in candidate && candidate.name === name)
	if (!field || !('name' in field)) throw new Error(`${name} field is not configured`)
	return field
}

describe('studioControllerField', () => {
	it('Definition 모드는 공통 envelope의 필수 groups와 v1 컨트롤 여섯 종류를 저작한다', () => {
		const controller = studioControllerField({ mode: 'define' })
		expect(controller).toMatchObject({ name: 'controller', type: 'group' })
		expect('required' in controller ? controller.required : undefined).not.toBe(true)
		if (controller.type !== 'group') throw new Error('controller must be a group')

		const groups = namedField(controller.fields, 'groups')
		if (groups.type !== 'array') throw new Error('groups must be an array')
		expect(namedField(groups.fields, 'key')).toMatchObject({ type: 'text', required: true })

		const controls = namedField(groups.fields, 'controls')
		if (controls.type !== 'blocks') throw new Error('controls must be blocks')
		expect(controls.blocks.map((block) => block.slug)).toEqual([
			'text',
			'toggle',
			'select',
			'color',
			'range',
			'pad',
		])
		for (const block of controls.blocks) {
			expect(namedField(block.fields, 'key')).toMatchObject({ type: 'text', required: true })
			expect(namedField(block.fields, 'availability')).toMatchObject({
				type: 'select',
				defaultValue: 'enabled',
			})
			expect(block.fields.some((field) => 'name' in field && field.name === 'id')).toBe(false)
		}
	})

	it('Image·Template·Graphic 어드민이 같은 Controller field factory를 소비한다', () => {
		for (const collection of [ImageProfiles, Templates, GraphicProfiles]) {
			expect(namedField(collection.fields, 'controller')).toMatchObject({
				name: 'controller',
				type: 'group',
			})
		}
	})

	it('Graphic·Template은 Base Definition UI와 kind-free JSON Override만 저작한다', () => {
		for (const collection of [Templates, GraphicProfiles]) {
			const controller = namedField(collection.fields, 'controller')
			expect('admin' in controller ? controller.admin : undefined).toMatchObject({
				hidden: true,
			})
			const override = namedField(collection.fields, 'controllerOverride')
			expect(override).toMatchObject({ type: 'json' })
			expect('admin' in override ? override.admin : undefined).toHaveProperty(
				'components.Field',
			)
		}
	})

	it('세 Studio가 output policy를 Controller Definition과 분리해 발행한다', () => {
		for (const collection of [ImageProfiles, Templates, GraphicProfiles]) {
			const output = namedField(collection.fields, 'output')
			if (output.type !== 'group') throw new Error('output must be a group')
			const allowedFormats = namedField(output.fields, 'allowedFormats')
			expect(allowedFormats).toMatchObject({
				type: 'select',
				hasMany: true,
				options: STUDIO_OUTPUT_FORMAT_OPTIONS,
			})
		}

		const imageOutput = namedField(ImageProfiles.fields, 'output')
		if (imageOutput.type !== 'group') throw new Error('image output must be a group')
		expect(namedField(imageOutput.fields, 'original')).toMatchObject({
			type: 'checkbox',
			defaultValue: true,
		})
	})

	it('color 기본값은 #rrggbb만 허용한다', () => {
		expect(validateHexColor('#12aBcF')).toBe(true)
		expect(validateHexColor(undefined)).toBe(true)
		expect(validateHexColor('#fff')).toBeTypeOf('string')
	})

	it('pad 비율은 유한한 양수만 허용한다', () => {
		expect(validatePositiveNumber(undefined)).toBe(true)
		expect(validatePositiveNumber(1.5)).toBe(true)
		expect(validatePositiveNumber(0)).toBeTypeOf('string')
		expect(validatePositiveNumber(Number.POSITIVE_INFINITY)).toBeTypeOf('string')
	})
})

describe('ImageProfiles sensitive field access', () => {
	it('모델과 내부 프롬프트는 manager/admin만 읽는다', () => {
		for (const fieldName of ['imageModelPreset', 'profilePrompt', 'userPromptNormalization']) {
			const field = namedField(ImageProfiles.fields, fieldName)
			if (!('access' in field) || typeof field.access?.read !== 'function') {
				throw new Error(`${fieldName} read access is not configured`)
			}
			const read = field.access.read as unknown as (args: {
				req: { user: unknown }
			}) => boolean
			expect(read({ req: { user: null } })).toBe(false)
			expect(read({ req: { user: { role: 'worker' } } })).toBe(false)
			expect(read({ req: { user: { role: 'manager' } } })).toBe(true)
			expect(read({ req: { user: { role: 'admin' } } })).toBe(true)
		}
	})
})

describe('ImageProfiles publish validation', () => {
	const hook = ImageProfiles.hooks?.beforeChange?.[0]
	if (!hook) throw new Error('ImageProfiles beforeChange hook is not configured')

	const legacyProfile = {
		name: 'Legacy',
		slug: 'legacy',
		imageModelPreset: 'openai-gpt-image-2',
		aspectRatio: '2:3',
		imageSize: '2K',
	}

	it('draft와 controller가 없는 legacy publish를 허용한다', async () => {
		const draft = {
			...legacyProfile,
			_status: 'draft',
			controller: { groups: [{ key: 'incomplete' }] },
		}
		await expect(hook({ data: draft } as never)).resolves.toBe(draft)

		const published = { ...legacyProfile, _status: 'published' }
		await expect(hook({ data: published } as never)).resolves.toBe(published)
	})

	it('published controller 계약 오류를 Payload 400 오류로 반환한다', async () => {
		const data = {
			...legacyProfile,
			_status: 'published',
			controller: {
				groups: [
					{
						key: 'image',
						title: 'Image',
						controls: [
							{
								blockType: 'text',
								key: 'prompt',
								label: 'Prompt',
								defaultValue: '',
								maxLength: 100,
							},
						],
					},
				],
			},
		}

		await expect(hook({ data } as never)).rejects.toMatchObject({
			message: 'Image controller에 batch select control이 필요합니다.',
			status: 400,
		})
	})

	it('published feature type 중복을 Payload 400 오류로 반환한다', async () => {
		const data = {
			...legacyProfile,
			_status: 'published',
			features: [{ blockType: 'cameraControl' }, { blockType: 'cameraControl' }],
		}

		await expect(hook({ data } as never)).rejects.toMatchObject({
			message: 'Image feature type이 중복되었습니다: camera-control',
			status: 400,
		})
	})

	it('Admin 공통 선택지가 Image runtime 지원 형식을 넓히지 못한다', async () => {
		const data = {
			...legacyProfile,
			_status: 'published',
			output: { allowedFormats: ['svg'] },
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

	it('draft는 불완전 override를 허용하고 publish는 등록 runtime보다 넓은 계약을 거부한다', async () => {
		const draft = {
			_status: 'draft',
			name: 'Draft',
			runtime: 'forward-straight',
			controllerOverride: { controls: [{ controlId: 'unknown' }] },
		}
		expect(hook({ data: draft } as never)).toBe(draft)

		const published = { ...draft, _status: 'published' }
		expect(() => hook({ data: published } as never)).toThrow(
			'Controller override control을 찾을 수 없습니다: unknown',
		)
	})
})

describe('imageProfileFeaturesField', () => {
	it('capability와 semantic control ref만 저작한다', () => {
		const features = imageProfileFeaturesField()
		if (features.type !== 'blocks') throw new Error('features must be blocks')

		expect(features.blocks.map((block) => block.slug)).toEqual([
			'colorAdjustment',
			'cameraControl',
		])
		expect(features.blocks[0]?.fields).toEqual([
			expect.objectContaining({ name: 'line', type: 'text', required: true }),
			expect.objectContaining({ name: 'background', type: 'text' }),
		])
		expect(features.blocks[1]?.fields).toEqual([])
	})
})
