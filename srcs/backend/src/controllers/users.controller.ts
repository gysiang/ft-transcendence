import { FastifyReply, FastifyRequest } from 'fastify';
import { createUser, findUserByEmail } from '../models/user.model';
import bcrypt from 'bcryptjs';
const jwt = require('jsonwebtoken');
const cookie = require("cookie");
import { serialize } from 'cookie';


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
	if (!user.hash_password) {
		return reply.status(401).send({ message: 'Password not set for this user' });
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

	const token = jwt.sign(payload, process.env.JWT_SECRET);
	const cookieStr = cookie.serialize('access_token', token, {
		httpOnly: true,
		maxAge: 60 * 60 * 24,
		path: '/'
	});
	return (reply.header('Set-Cookie', cookieStr)
				.status(200)
				.send({
					message: 'success',
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
	const profile_picture = process.env.FRONTEND_URL + '/default-profile.jpg';
	const user = await createUser(db, { name, email, password, profile_picture });

	const payload = {
		id: user.id,
		name: user.name,
		email : user.email,
	}
	const token = jwt.sign(payload, process.env.JWT_SECRET);

	const cookieStr = cookie.serialize('access_token', token, {
		httpOnly: true,
		maxAge: 60 * 60 * 24,
		path: '/'
	});
	return (reply
			.header('Set-Cookie', cookieStr)
			.status(201)
			.send({
				message: 'success',
			}));
	} catch (err : any) {
	req.log.error(err);
	return reply.status(500).send({ message: 'Internal Server Error' });
	}
}

export async function googleSignIn(req: FastifyRequest, reply: FastifyReply) {

	try {
		const db = req.server.db;
		const frontend = process.env.FRONTEND_URL;
		const password = null;
		const user = req.user as any;
		const name = user._json?.name;
		const email = user._json?.email;
		const profile_picture = user._json?.picture
		//console.log('Authenticated user:', user)
		if (!name || !email) {
			return reply.status(400).send({ message: 'Missing name or email from Google profile' });
		}

		console.log('Google Name:', name);
		console.log('Google Email:', email);

		const existing = await db.get(`SELECT * FROM users WHERE email = ?`, [email]);
		let profile;

		if (!existing) {
			profile = await createUser(db, { name, email, password, profile_picture });
		} else {
			 profile = existing;
		}

		const payload = {
			id: profile.id,
			name: profile.name,
			email : profile.email,
		}
		const token = jwt.sign(payload, process.env.JWT_SECRET);

		const cookieStr = cookie.serialize('access_token', token, {
			httpOnly: true,
			maxAge: 60 * 60 * 24,
			path: '/'
		});

		return (reply
				.header('Set-Cookie', cookieStr)
				.redirect(frontend + '/'));
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
					email: user.email,
					profile_picture: user.profile_picture
				}));
		} catch (err: any) {
		req.log.error(err);
		return reply.status(500).send({ message: 'Internal Server Error' });
		}
}

export async function logoutUser(req: FastifyRequest, reply: FastifyReply) {

	try {
		reply.header('Set-Cookie', serialize('access_token', '', {
			path: '/',
			expires: new Date(0),
		}))
			.send({
				message: "Logout successful",
			})
	} catch (err: any) {
		req.log.error(err);
		return reply.status(500).send({ message: 'Internal Server Error' });
	}
};
