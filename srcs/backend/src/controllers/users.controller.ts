import { FastifyReply, FastifyRequest } from 'fastify';
import { IUserParams, IUserBody, IProfileBody, createUser, findUserByEmail, findUserById, updateProfilePic, update2faSecret, updateUserStatus, disable2FA } from '../models/user.model';
import bcrypt from 'bcryptjs';
const jwt = require('jsonwebtoken');
const cookie = require("cookie");
import { serialize } from 'cookie';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { createS3Client } from '../services/s3';
import speakeasy from 'speakeasy';


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
	const verifyPassword = await bcrypt.compare(password, user.hash_password);
	if (!verifyPassword) {
		return reply.status(401).send({ message: 'Invalid password' });
	}
	if (!user.id) {
		return reply.status(401).send({ message: "User not found" });
	}
	await updateUserStatus(db, user.id, true);

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
					id: user.id,
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
	const existing = await findUserByEmail(db, email);
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
				id: user.id,
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
		if (!name || !email || !profile_picture) {
			return reply.status(400).send({ message: 'Missing name or email from Google profile' });
		}

		console.log('Google Name:', name);
		console.log('Google Email:', email);
		console.log('Google profile:', profile_picture);

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
				.redirect(frontend + '/')
				.send({
					id: profile.id
				})
			);
	} catch (err : any) {
	req.log.error(err);
	return reply.status(500).send({ message: 'Internal Server Error' });
	}
}

//reply -> res(converstional)
export async function getUser(req: FastifyRequest<{Params: IUserParams}>, reply: FastifyReply) {

	try {
		const { id } = req.params;

		if (!id) {
			return reply.status(400).send({ message: "id is required" });
		}

		const db = req.server.db;
		const user = await findUserById(db, id);
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
		const { id } = req.body as
		{
			id: string;
		}
		if (!id)
			return reply.status(401).send({ message: "id is required" });
		//check if the id is valid
		const db = req.server.db;
		const user = await findUserById(db, id);
		if (!user) {
			return reply.status(400).send({ error: 'User not found' });
		}
		await updateUserStatus(db, id, false);

		reply.header('Set-Cookie', serialize('access_token', '', {
			httpOnly: true,
			maxAge: 0,
			path: '/'
		}))
			.send({
				message: "Logout successful",
			})
	} catch (err: any) {
		req.log.error(err);
		return reply.status(500).send({ message: 'Internal Server Error' });
	}
};


export async function editUser(req: FastifyRequest<{
    Params: IUserParams;
    Body: IUserBody;
}>, reply: FastifyReply) {

	const { id } = req.params;
	const { name, email } = req.body;

	try {
		const db = req.server.db;

		await db.run(
			`UPDATE users SET name = ?, email = ?, updated_at = ? WHERE id = ?`,
			[name, email, new Date().toISOString(), id]
		);
		reply.status(200)
			 .send({
				message: 'User updated successfully',
			  });
	} catch (err: any) {
		req.log.error(err);
		return reply.status(500).send({ message: 'Internal Server Error' });
	}
}

export async function editPicture(req: FastifyRequest<{
	Params: IUserParams;
}>, reply: FastifyReply) {

	const { id } = req.params;

	try {
	const db = req.server.db;
	const s3 = createS3Client();
	const data = await req.file();
	if (!data) {
		return reply.status(400).send({ message: 'No file uploaded' });
	}

	const putObjectCommand = new PutObjectCommand({
		Bucket: process.env.AWS_BUCKET,
		Key: `${id}/${data.filename}`,
		Body: await data.toBuffer(),
		ContentType: data.mimetype,
		ACL: "public-read"
	});

	await s3.send(putObjectCommand);
	const imageUrl = `https://${process.env.AWS_BUCKET}.s3.amazonaws.com/${id}/${data.filename}`;

	await updateProfilePic(db, id, imageUrl);

	reply.status(200)
			 .send({
				message: 'success',
				image: imageUrl
			  });
	} catch (err: any) {
		req.log.error(err);
		return reply.status(500).send({ message: 'Internal Server Error' });
	}
}

export async function setUp2fa(req: FastifyRequest, reply: FastifyReply) {
	const { id } = req.body as
	{
		id: string;
	}
	if (!id)
		return reply.status(401).send({ message: "id is required" });

	try {
	const db = req.server.db;
	const user = await findUserById(db, id);
	if (!user)
		return reply.status(401).send({ message: "User does not exist" });
	let secret = speakeasy.generateSecret({
		 name: "Pong42",
	});
	console.log(secret);
	const tmp_base32_secret = secret.base32;

	await update2faSecret(db, id, tmp_base32_secret);

	reply.status(200).send({
		message: "2fa setup success",
		otpauth_url: secret.otpauth_url,
		base32: secret.base32,
	})
	} catch (err: any) {
		req.log.error(err);
		return reply.status(500).send({ message: 'Internal Server Error' });
	}
}


export async function verify2fa(req: FastifyRequest, reply: FastifyReply) {

	const { id, token } = req.body as
	{
		id: string;
		token: string;
	};
	if (!id)
		return reply.status(401).send({ message: "id is required" });
	if (!token)
		return reply.status(401).send({ message: "token is required" });

	try {
	const db = req.server.db;
	const user = await findUserById(db, id);
	if (!user) {
		return reply.status(400).send({ error: 'User not found' });
	}
	if (!user?.twofa_secret) {
		return reply.status(400).send({ error: '2FA not set up for this user' });
	}
	const verified = speakeasy.totp.verify({
		secret: user.twofa_secret,
		encoding: 'base32',
		token,
		window: 1, // allows +/- 30 sec
	})

	if (!verified)
		return reply.status(401).send({ message: 'Invalid 2FA token' });
	reply.status(200).send({
		message: "2fa verified success",
	})
	} catch (err: any) {
		req.log.error(err);
		return reply.status(500).send({ message: 'Internal Server Error' });
	}
}

export async function turnOff2FA(req: FastifyRequest, reply: FastifyReply) {

	try {
	const { id } = req.body as
	{
		id: string;
	};
	if (!id)
		return reply.status(401).send({ message: "id is required" });
	const db = req.server.db;
	const user = await findUserById(db, id);
	if (!user) {
		return reply.status(400).send({ error: 'User not found' });
	}
	await disable2FA(db, id);
	reply.status(200).send({
		message: "2fa disabled",
	})
	} catch (err: any) {
		req.log.error(err);
		return reply.status(500).send({ message: 'Internal Server Error' });
	}
}
