import type { MyResourceRepository } from '@/repositories/my-resource.repository'

export interface MyServiceInput {
	resourceId: string
}

export interface MyServiceOutput {
	resourceId: string
	message: string
}

export class MyService {
	constructor(private readonly myResourceRepository: MyResourceRepository) {}

	async execute(input: MyServiceInput): Promise<MyServiceOutput> {
		const message = await this.myResourceRepository.findMessage(input.resourceId)

		return {
			resourceId: input.resourceId,
			message,
		}
	}
}
