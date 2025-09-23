import { FastifyInstance } from 'fastify';
import { signupUser, loginUser, getUser, googleSignIn, logoutUser, editUser, editPicture, setUp2fa, verify2fa, get2faStatus, setUpEmail2FA, turnOff2FA } from '../controllers/users.controller';
import { IUserParams, IUserBody, IProfileBody, findUserById } from '../models/user.model';
import fastifyPassport from '@fastify/passport'


export async function authRoutes(app: FastifyInstance) {
	app.post('/api/signup',{schema: {body:{ $ref:'SignupSchema#' }},}, signupUser);
	app.post('/api/login', {schema: { body: { $ref: 'LoginSchema#' } }}, loginUser);
	app.get<{Params: IUserParams}>('/api/profile/:id', {schema: { params: { $ref: 'IdString#' }}, preHandler: [app.authenticate]}, getUser);
	app.patch<{ Params: IUserParams; Body: IUserBody;}>('/api/profile/:id',{schema: { params: { $ref: 'IdString#' }, body: { $ref: 'EditUserSchema#' }}, preHandler: [app.authenticate]} , editUser);
	app.patch<{ Params: IUserParams; Body: IProfileBody}>('/api/profile/:id/pic', {schema: { params: { $ref: 'IdString#' }}, preHandler: [app.authenticate]} , editPicture)
	app.get("/auth/google",fastifyPassport.authenticate("google-vm", { scope: ["profile", "email"] }));
	app.get("/auth/google/callback",{ preValidation: fastifyPassport.authenticate("google-vm", { failureRedirect: "/signup" }) }, googleSignIn);
	app.get("/auth/re-google",fastifyPassport.authenticate("google-local", { scope: ["profile", "email"] }));
	app.get("/auth/re-google/callback",{ preValidation: fastifyPassport.authenticate("google-local", { failureRedirect: "/signup" }) },googleSignIn);
	app.post('/2fa/setup',{preHandler: [app.authenticate]}, setUp2fa);
	app.post('/2fa/disable',{preHandler: [app.authenticate]}, turnOff2FA);
	app.post('/2fa/verify', verify2fa);
	app.post('/2fa/setup/email',{preHandler: [app.authenticate]}, setUpEmail2FA)
	app.post('/api/logout', logoutUser);
	app.get('/2fa/status',{preHandler: [app.authenticate]}, get2faStatus);
	app.get('/api/ping', async (request, reply) => {
		return reply.send({ ok: true });
	});
	app.get('/api/me', { onRequest: [app.authenticate] }, async (req: any, reply) => {
		const id = req.userData?.id;
  		if (!id) return reply.code(401).send({ message: 'Unauthenticated' });

  		const user = await findUserById(app.db,id);
  		if (!user) return reply.code(404).send({ message: 'Not found' });
		const name = user.name;
		return reply.code(200).send({ name: String(user.name || '') });
	  });
}
