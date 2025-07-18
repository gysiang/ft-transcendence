import { FastifyReply, FastifyRequest } from 'fastify';
import { createUser, findUserByEmail } from '../models/user.model';
import bcrypt from 'bcryptjs';

export async function loginUser(req: FastifyRequest, reply: FastifyReply) {

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
		name: user.name,
		email : user.email,
	}

	const token = req.server.jwt.sign(payload);

	return (reply.status(200)
				.send({
					message: 'success',
					access_token: token
				}))
	} catch (err: any) {
	req.log.error(err);
	return reply.status(500).send({ message: 'Internal Server Error' });
	}
}

export async function signupUser(req: FastifyRequest, reply: FastifyReply) {
	try {
			const { name, email, password } = req.body as
			{
				name: string;
				email: string;
				password: string;
			};

	const db = req.server.db;
	const existing = await db.get(`SELECT * FROM users WHERE email = ?`, [email]);
	if (existing) {
		return reply.status(400).send({ message: 'Email already exists' });
	}

	const user = await createUser(db, { name, email, password });

	const payload = {
		id: user.id,
		name: user.name,
		email : user.email,
	}
	const token = req.server.jwt.sign(payload);
	if (!token) {
		reply.status(500).send({ message: 'JWT Error' });
	}
	return (reply
			.status(201)
			.send({
				message: 'success',
				access_token: token
			}));
	} catch (err : any) {
	req.log.error(err);
	return reply.status(500).send({ message: 'Internal Server Error' });
	}
}

export async function getUser(req: FastifyRequest, reply: FastifyReply) {

	try {
		const { email } = req.query as {
			email: string;
		}
		if (!email) {
			return reply.status(400).send({ message: "Email is required" });
		}

		const db = req.server.db;
		const user = await findUserByEmail(db, email);
		if (!user) {
			return reply.status(401).send({ message: "Invalid email" });
		}
		return (reply
				.status(200)
				.send({
					message: "Authentication success",
					id: user.id,
					name: user.name,
					email: user.email
				}));
		} catch (err: any) {
		req.log.error(err);
		return reply.status(500).send({ message: 'Internal Server Error' });
		}
}
