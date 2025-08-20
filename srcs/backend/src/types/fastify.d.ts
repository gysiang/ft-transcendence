import 'fastify';

declare module 'fastify' {
	interface FastifyRequest {
		jwt: JWT;
		userData?: {
			id: string;
			name: string;
			email: string;
		};
	}
	interface FastifyInstance {
		authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
	}
}
