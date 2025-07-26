type UserPayload = {
	id: string
	email: string
	name: string
}

declare module '@fastify/jwt' {
	interface FastifyJWT {
	payload: UserPayload
	}
}
