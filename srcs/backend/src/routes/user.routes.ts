import { FastifyInstance } from 'fastify';
import { signupUser, loginUser, getUser, googleSignIn, logoutUser, editUser, editPicture, setUp2fa, verify2fa, setUpEmail2FA, turnOff2FA } from '../controllers/users.controller';
import { IUserParams, IUserBody, IProfileBody } from '../models/user.model';
import fastifyPassport from '@fastify/passport'

export async function authRoutes(app: FastifyInstance) {
	app.post('/api/signup',{schema: {body:{ $ref:'SignupSchema#' }},}, signupUser);
	app.post('/api/login', {schema: { body: { $ref: 'LoginSchema#' } }}, loginUser);
	app.get<{Params: IUserParams}>('/api/profile/:id', {preHandler: [app.authenticate]}, getUser);
	app.patch<{ Params: IUserParams; Body: IUserBody;}>('/api/profile/:id', {preHandler: [app.authenticate]}, editUser);
	app.patch<{ Params: IUserParams; Body: IProfileBody}>('/api/profile/:id/pic', {preHandler: [app.authenticate]}, editPicture)
	app.get('/auth/google', {preValidation: fastifyPassport.authenticate('google', { scope: [ 'email', 'profile' ] })},
		async(req, reply) => {
			reply.redirect('/');
		}
	);
	app.get('/auth/google/callback', {preValidation: fastifyPassport.authenticate('google', { scope: [ 'email', 'profile' ] })},
		googleSignIn
	);
	app.post('/2fa/setup',{preHandler: [app.authenticate]}, setUp2fa);
	app.post('/2fa/disable',{preHandler: [app.authenticate]}, turnOff2FA);
	app.post('/2fa/verify', verify2fa);
	app.post('/2fa/setup/email',{preHandler: [app.authenticate]}, setUpEmail2FA)
	app.post('/api/logout', logoutUser);
	app.get('/api/ping', async (request, reply) => {
		return reply.send({ ok: true });
	});
}
