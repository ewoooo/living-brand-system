import { MyResourcePayloadRepository } from '@/repositories/my-resource.payload.repository'
import { MyService, type MyServiceInput } from '@/services/my-service.service'

const myService = new MyService(new MyResourcePayloadRepository())

export async function GET(request: Request) {
	const url = new URL(request.url)
	const input: MyServiceInput = {
		resourceId: url.searchParams.get('resourceId') ?? 'my-resource',
	}

	const output = await myService.execute(input)

	return Response.json(output)
}
