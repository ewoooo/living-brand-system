export interface MyResourceRepository {
	findMessage(resourceId: string): Promise<string>
}
