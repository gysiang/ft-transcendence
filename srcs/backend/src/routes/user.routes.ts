import { FastifyInstance } from 'fastify';
import { signupUser, loginUser, getUser } from '../controllers/users.controller';

export async function authRoutes(app: FastifyInstance) {
	app.post('/api/signup', signupUser);
	app.post('/api/login', loginUser);
	app.get('/api/profile', {preHandler: [app.authenticate]}, getUser);
}
