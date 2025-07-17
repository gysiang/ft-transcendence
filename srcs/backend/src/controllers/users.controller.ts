import { FastifyReply, FastifyRequest } from 'fastify';
import { createUser, findUserByUsername, findUserByEmail } from '../models/user.model';
import bcrypt from 'bcryptjs';

export async function loginController(req: FastifyRequest, reply: FastifyReply) {

	try {
			const { email , password } = req.body as
			{
				email: string;
				password: string;
			}

	const db = req.server.db;
	const user = await findUserByEmail(db, email);
	if (!user) {
		return reply.status(401).send({ message: "Invalid email" });
	}
	const verifyPassword = bcrypt.compare(password, user.hash_password);
	if (!verifyPassword) {
		reply.status(401).send({ message: 'Invalid password' });
	}

	const payload = {
		id: user.id,
		username : user.username,
	}

	const token = req.server.jwt.sign(payload);
	if (!token) {
		reply.status(500).send({ message: 'JWT Error' });
	}

	return (reply
			.status(201)
			.send({ message: 'success' })
			.setCookie('auth_token', token, {
				httpOnly: true,
				sameSite: 'lax',
				path: '/',
			}));

	} catch (err) {
	req.log.error(err);
	return reply.status(500).send({ message: 'Internal Server Error' });
	}
}


export async function signupController(req: FastifyRequest, reply: FastifyReply) {
	try {
			const { username, email, password } = req.body as
			{
				username: string;
				email: string;
				password: string;
			};

	const db = req.server.db;
	const existing = await db.get(`SELECT * FROM users WHERE email = ?`, [email]);
	if (existing) {
		return reply.status(400).send({ message: 'Email already exists' });
	}

	const user = await createUser(db, { username, email, password });

	const payload = {
		id: user.id,
		username : user.username,
	}

	const token = req.server.jwt.sign(payload);
	if (!token) {
		reply.status(500).send({ message: 'JWT Error' });
	}
	return (reply
			.status(201)
			.send({ message: 'success' })
			.setCookie('auth_token', token, {
				httpOnly: true,
				sameSite: 'lax',
				path: '/',
			}));
	} catch (err) {
	req.log.error(err);
	return reply.status(500).send({ message: 'Internal Server Error' });
	}
}
