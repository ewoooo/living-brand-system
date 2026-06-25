import type { MyResourceRepository } from './my-resource.repository'

export class MyResourcePayloadRepository implements MyResourceRepository {
	async findMessage(resourceId: string): Promise<string> {
		return `mock payload resource: ${resourceId}`
	}
}
