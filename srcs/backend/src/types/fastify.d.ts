import { PassportUser } from '@fastify/passport'

declare module 'fastify' {
	interface FastifyRequest {
		jwt: JWT;

	}
	interface FastifyInstance {
		authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
	}
}
