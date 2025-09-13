const jwt = require('jsonwebtoken');
const cookie = require("cookie");
import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';

export default fp(async function authentication(app: FastifyInstance) {
	app.decorate("authenticate", async function (request: FastifyRequest, reply: FastifyReply) {

	const header = request.headers['cookie'];
	if (!header) {
		reply.status(401).send({ message: 'Missing cookies' });
		return;
	}

	const cookies = cookie.parse(header);
	const token = cookies['access_token'];
	if (!token) {
		reply.status(401).send({ message: 'Missing authentication token' });
		return;
	}
	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		request.userData = decoded;
		//console.log("request.user id: ", request.user);
	} catch (err) {
		console.error("JWT verification error:", err);
		reply.status(401).send({ message: "Invalid token" });
		return;
	}
	});
});
