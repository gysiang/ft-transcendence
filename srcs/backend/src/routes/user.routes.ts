import { FastifyInstance } from 'fastify';
import { signupUser, loginUser, getUser, logOut } from '../controllers/users.controller';

export async function authRoutes(app: FastifyInstance) {
	app.post('/api/signup', signupUser);
	app.post('/api/login', loginUser);
	app.delete('/api/logout', {preHandler: [app.authenticate]}, logOut);
	app.get('/api/profile', {preHandler: [app.authenticate]}, getUser);
}
