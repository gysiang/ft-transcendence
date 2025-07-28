import { FastifyInstance } from 'fastify';
import { signupUser, loginUser, getUser, googleSignIn, logoutUser } from '../controllers/users.controller';
import fastifyPassport from '@fastify/passport'

export async function authRoutes(app: FastifyInstance) {
	app.post('/api/signup', signupUser);
	app.post('/api/login', loginUser);
	app.get('/api/profile', {preHandler: [app.authenticate]}, getUser);
	app.get('/auth/google', {preValidation: fastifyPassport.authenticate('google', { scope: [ 'email', 'profile' ] })},
		async(req, reply) => {
			reply.redirect('/');
		}
	);
	app.get('/auth/google/callback', {preValidation: fastifyPassport.authenticate('google', { scope: [ 'email', 'profile' ] })},
		googleSignIn
	);
	app.post('/api/logout', logoutUser)
}
