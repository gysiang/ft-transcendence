import { FastifyJWT } from '@fastify/jwt';
import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';

export default fp(async function authentication(app: FastifyInstance) {
	app.decorate("authenticate", async function (request: FastifyRequest, reply: FastifyReply) {

	const authHeader = request.headers.authorization;

	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return reply.status(401).send({ message: "Missing or invalid Authorization header" });
	}
	const token = authHeader.split(" ")[1];
	try {
		const decoded = app.jwt.verify<FastifyJWT['user']>(token);
		request.user = decoded;
	} catch (err) {
		console.error("JWT verification error:", err);
		return reply.status(401).send({ message: "Invalid token" });
	}
	});
});
