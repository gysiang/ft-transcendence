import { FastifyInstance } from 'fastify';
import { signupUser, loginUser, getUser, googleSignIn, logoutUser, editUser } from '../controllers/users.controller';
import { IUserParams, IUserBody } from '../models/user.model';
import fastifyPassport from '@fastify/passport'

export async function authRoutes(app: FastifyInstance) {
	app.post('/api/signup', signupUser);
	app.post('/api/login', loginUser);
	app.get<{Params: IUserParams}>('/api/profile/:id', {preHandler: [app.authenticate]}, getUser);
	app.patch<{ Params: IUserParams; Body: IUserBody;}>('/api/profile/:id', {preHandler: [app.authenticate]}, editUser);
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
