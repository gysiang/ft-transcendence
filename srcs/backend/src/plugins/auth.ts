import { FastifyPluginAsync } from 'fastify';
import { FastifyReply, FastifyRequest } from 'fastify';

const authPlugin: FastifyPluginAsync = async (app) => {
	app.decorate("authenticate", async function (request: FastifyRequest, reply: FastifyReply) {
	try {
		await request.jwtVerify();
	} catch (err) {
		reply.status(401).send({ message: 'Unauthorized' });
	}
	});
};

export default authPlugin;
